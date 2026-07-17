
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question, MathTopic, ExamBoard, Tier, PaperType } from "../types";

const CONTENT_CACHE_TTL = 1000 * 60 * 60 * 24;
const memoryCache = new Map<string, Question[]>();
const pendingRequests = new Map<string, Promise<Question[]>>();

const cacheKey = (board: ExamBoard, topics: MathTopic[], tier: Tier, paperType: PaperType, count: number) =>
  `dx-content-v2:${board}:${tier}:${paperType}:${[...topics].sort().join('|')}:${count}`;

const readCache = (key: string) => {
  const inMemory = memoryCache.get(key);
  if (inMemory) return inMemory;
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (value?.savedAt > Date.now() - CONTENT_CACHE_TTL && Array.isArray(value.questions)) {
      memoryCache.set(key, value.questions);
      return value.questions as Question[];
    }
  } catch { /* storage can be disabled */ }
  return undefined;
};

const writeCache = (key: string, questions: Question[]) => {
  memoryCache.set(key, questions);
  try { localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), questions })); } catch { /* quota/private mode */ }
};

const fallbackQuestions = (board: ExamBoard, topics: MathTopic[], tier: Tier, paperType: PaperType, count: number): Question[] => {
  const templates: Record<MathTopic, Array<[string, string, string]>> = {
    [MathTopic.Number]: [['Calculate $15\\%$ of $240$.', '36', '$10\\%=24$ and $5\\%=12$, so $15\\%=36$.'], ['Write $0.375$ as a fraction in its simplest form.', '$\\frac{3}{8}$', '$0.375=\\frac{375}{1000}=\\frac{3}{8}$.']],
    [MathTopic.Algebra]: [['Solve $3x+7=25$.', '6', 'Subtract 7, then divide by 3: $x=18/3=6$.'], ['Expand and simplify $4(x+3)-2x$.', '$2x+12$', '$4x+12-2x=2x+12$.']],
    [MathTopic.Ratio]: [['Share £84 in the ratio $3:4$.', '£36 and £48', 'There are 7 parts; each is £12. Multiply by 3 and 4.'], ['A recipe uses 250 g flour for 10 cakes. How much for 16?', '400 g', '$250\\div10\\times16=400$.']],
    [MathTopic.Geometry]: [['Find the area of a triangle with base 12 cm and height 7 cm.', '42 cm²', '$\\frac12\\times12\\times7=42$.'], ['The angles in a triangle are $x$, $2x$, and $3x$. Find $x$.', '$30^\\circ$', '$6x=180^\\circ$, so $x=30^\\circ$.']],
    [MathTopic.Probability]: [['A fair die is rolled. Find the probability of an even number.', '$\\frac{1}{2}$', 'Three of the six outcomes are even, so $3/6=1/2$.'], ['A bag has 3 red and 7 blue counters. Find $P(red)$.', '$\\frac{3}{10}$', 'There are 10 counters and 3 are red.']],
    [MathTopic.Statistics]: [['Find the mean of $4,7,8,9$.', '7', 'The total is 28 and $28\\div4=7$.'], ['Find the median of $3,9,5,12,7$.', '7', 'Order them: $3,5,7,9,12$; the middle is 7.']],
    [MathTopic.Calculus]: [['Differentiate $y=3x^2+4x-1$.', '$6x+4$', 'Use the power rule: $3x^2\\to6x$, $4x\\to4$.'], ['Find $\\int 6x\\,dx$.', '$3x^2+C$', 'Increase the power by one and divide by the new power.']],
  };
  return Array.from({ length: count }, (_, i) => {
    const topic = topics[i % topics.length];
    const options = templates[topic];
    const [questionText, correctAnswer, explanation] = options[Math.floor(i / topics.length) % options.length];
    return { id: `local-${topic}-${i}-${board}-${tier}`, topic, board, tier, paperType, questionText, correctAnswer, explanation, marks: 1 };
  });
};

const isQuestion = (q: any) => q && typeof q.questionText === 'string' && typeof q.correctAnswer === 'string' && typeof q.explanation === 'string';

export const generateQuizQuestions = async (
  board: ExamBoard,
  topics: MathTopic[],
  tier: Tier,
  paperType: PaperType,
  count: number
): Promise<Question[]> => {
  const key = cacheKey(board, topics, tier, paperType, count);
  const cached = readCache(key);
  if (cached) return cached;
  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = (async () => {
  const localFallback = fallbackQuestions(board, topics, tier, paperType, count);
  if (!process.env.API_KEY) {
    writeCache(key, localFallback);
    return localFallback;
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const topicsListStr = topics.join(', ');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a set of ${count} unique, high-quality GCSE Mathematics practice questions for the ${board} exam board, ${tier} tier, ${paperType} paper. The questions must be distributed across the following selected topics: ${topicsListStr}. Ensure each question has a realistic difficulty, clear phrasing, uses LaTeX for mathematical rendering where appropriate, and has a unique id. Return the response in a structured JSON format containing a "questions" array.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                topic: { type: Type.STRING, description: `The topic of the question, MUST be exactly one of: ${topicsListStr}` },
                questionText: { type: Type.STRING, description: "The math question, use LaTeX for math symbols if needed." },
                correctAnswer: { type: Type.STRING, description: "The final short answer." },
                explanation: { type: Type.STRING, description: "Step-by-step explanation of how to solve it." },
                marks: { type: Type.INTEGER }
              },
              required: ["id", "topic", "questionText", "correctAnswer", "explanation", "marks"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{"questions":[]}');
    const questions = (data.questions || []).filter(isQuestion).slice(0, count).map((q: any, index: number) => ({
      ...q,
      id: q.id || `generated-${Date.now()}-${index}`,
      topic: topics.includes(q.topic as MathTopic) ? (q.topic as MathTopic) : topics[0],
      tier,
      paperType,
      board
    }));
    const complete = [...questions, ...localFallback.slice(questions.length)].slice(0, count);
    writeCache(key, complete);
    return complete;
  } catch (error) {
    console.error("Error parsing generated quiz questions", error);
    writeCache(key, localFallback);
    return localFallback;
  }
  })().catch(error => {
    console.error('Content generation failed; using local content.', error);
    const fallback = fallbackQuestions(board, topics, tier, paperType, count);
    writeCache(key, fallback);
    return fallback;
  }).finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, request);
  return request;
};

export const generateMathQuestion = async (
  board: ExamBoard,
  topic: MathTopic,
  tier: Tier,
  paperType: PaperType
): Promise<Question> => {
  // Fetch a small batch once: subsequent practice questions resolve from the
  // 24-hour cache instead of paying one network round trip per card.
  const questions = await generateQuizQuestions(board, [topic], tier, paperType, 10);
  return questions[Math.floor(Math.random() * questions.length)];
};

export const evaluateAnswer = async (
  question: Question,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '').replace(/[,£$]/g, '');
  if (normalize(userAnswer) === normalize(question.correctAnswer)) {
    return { isCorrect: true, feedback: 'Correct — your answer matches the model answer.' };
  }
  if (!process.env.API_KEY) {
    return { isCorrect: false, feedback: `Compare your answer with ${question.correctAnswer}. ${question.explanation}` };
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Question: ${question.questionText}\nCorrect Answer: ${question.correctAnswer}\nUser's Answer: ${userAnswer}\n\nDetermine if the user's answer is mathematically equivalent to the correct answer. Provide brief feedback.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isCorrect: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING }
        },
        required: ["isCorrect", "feedback"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

/**
 * Image Generation with Gemini 3 Pro Image (1K, 2K, 4K)
 */
export const generateImagePro = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data found in response");
};

/**
 * Image Editing with Gemini 2.5 Flash Image
 */
export const editImageFlash = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data found in response");
};

/**
 * Video Generation with Veo 3.1 Fast
 */
export const generateVideoVeo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    image: imageBase64 ? { imageBytes: imageBase64, mimeType: 'image/png' } : undefined,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResp.blob();
  return URL.createObjectURL(blob);
};

/**
 * Media Understanding (Image/Video) with Gemini 3 Pro
 */
export const analyzeMedia = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: prompt },
      ],
    },
  });
  return response.text;
};

/**
 * Thinking Mode with Gemini 3 Pro
 */
export const thinkMore = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });
  return response.text;
};

/**
 * Fast responses with Gemini 2.5 Flash Lite
 */
export const fastChat = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: prompt,
  });
  return response.text;
};

export const generateBookCover = async (title: string, category: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A sleek, high-tech Apple-style book cover for a mathematics book titled "${title}". The theme is ${category}. Minimalism, geometric patterns, clean typography, 4k, professional design.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64Bytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64Bytes}`;
  } catch (error) {
    return "https://images.unsplash.com/photo-1543003923-4350ffcc104c?auto=format&fit=crop&q=80&w=400";
  }
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectTutor = async (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: 'You are an elite, patient, and encouraging GCSE Math Tutor. You provide detailed explanations for complex math concepts using clear analogies. Help students step-by-step. You will receive real-time audio input and feedback turns.',
    },
  });
};
