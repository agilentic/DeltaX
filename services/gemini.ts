
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question, MathTopic, ExamBoard, Tier, PaperType } from "../types";

export const generateMathQuestion = async (
  board: ExamBoard,
  topic: MathTopic,
  tier: Tier,
  paperType: PaperType
): Promise<Question> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a GCSE Mathematics practice question for the ${board} board, topic ${topic}, ${tier} tier, ${paperType} paper. Return the response in a structured JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          questionText: { type: Type.STRING, description: "The math question, use LaTeX for math symbols if needed." },
          correctAnswer: { type: Type.STRING, description: "The final short answer." },
          explanation: { type: Type.STRING, description: "Step-by-step explanation of how to solve it." },
          marks: { type: Type.INTEGER }
        },
        required: ["id", "questionText", "correctAnswer", "explanation", "marks"]
      }
    }
  });

  const questionData = JSON.parse(response.text || '{}');
  return {
    ...questionData,
    topic,
    tier,
    paperType,
    board
  };
};

export const evaluateAnswer = async (
  question: Question,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
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
