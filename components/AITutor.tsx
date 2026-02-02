
import React, { useState, useEffect, useRef } from 'react';
import { connectTutor, decode, decodeAudioData, encode } from '../services/gemini';
import { MathTopic, TutorTranscript, Tier } from '../types';
import { TOPICS } from '../constants';
import MathRenderer from './MathRenderer';

interface AITutorProps {
  onExit: () => void;
  onSaveSession: (session: TutorTranscript) => void;
  ambientEnabled: boolean;
}

const AITutor: React.FC<AITutorProps> = ({ onExit, onSaveSession, ambientEnabled }) => {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<Tier>('Higher');
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionMessages, setSessionMessages] = useState<{ role: 'user' | 'ai'; text: string; feedback?: 'up' | 'down'; comment?: string }[]>([]);
  const [autoSaveNotif, setAutoSaveNotif] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);

  const finalTopic = selectedTopic === 'Custom' ? customTopic : selectedTopic;

  const startSession = async () => {
    if (!finalTopic) return;
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const session = await connectTutor({
        onopen: () => {
          setIsActive(true);
          setIsConnecting(false);
          const source = inputContext.createMediaStreamSource(stream);
          const processor = inputContext.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            sessionRef.current?.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
          };
          source.connect(processor);
          processor.connect(inputContext.destination);

          sessionRef.current?.sendRealtimeInput({
            text: `Initiate a GCSE Math session on "${finalTopic}" at ${selectedTier} tier. Start by providing a detailed, deep-dive explanation of a core concept, then check my knowledge.`
          });
        },
        onmessage: async (msg: any) => {
          const audioBase64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64 && audioContextRef.current) {
            const buffer = await decodeAudioData(decode(audioBase64), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start();
          }
          if (msg.serverContent?.outputTranscription) {
            setSessionMessages(prev => [...prev, { role: 'ai', text: msg.serverContent.outputTranscription.text }]);
          }
          if (msg.serverContent?.inputTranscription && msg.serverContent.turnComplete) {
            setSessionMessages(prev => [...prev, { role: 'user', text: msg.serverContent.inputTranscription.text }]);
          }
        },
        onclose: () => setIsActive(false),
      });
      sessionRef.current = session;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  // 5-minute Auto-save
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      if (sessionMessages.length > 0) {
        onSaveSession({
          id: `auto-${Date.now()}`,
          topic: finalTopic,
          tier: selectedTier,
          date: new Date().toISOString(),
          messages: sessionMessages
        });
        setAutoSaveNotif(true);
        setTimeout(() => setAutoSaveNotif(false), 3000);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isActive, sessionMessages, finalTopic, selectedTier]);

  const stopSession = () => {
    if (sessionMessages.length > 0) {
      onSaveSession({
        id: Math.random().toString(36).substr(2, 9),
        topic: finalTopic,
        tier: selectedTier,
        date: new Date().toISOString(),
        messages: sessionMessages
      });
    }
    sessionRef.current?.close();
    setIsActive(false);
    setSessionStarted(false);
  };

  const handleFeedback = (idx: number, fb: 'up' | 'down') => {
    setSessionMessages(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], feedback: fb };
      return copy;
    });
  };

  const handleComment = (idx: number, comment: string) => {
    setSessionMessages(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], comment };
      return copy;
    });
  };

  if (!sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8 animate-fade-in">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">AI Voice Tutor</h1>
          <p className="text-gray-500 font-medium">Deep-dive explanations and interactive learning.</p>
        </header>

        <div className="bg-white p-8 rounded-3xl apple-shadow space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Topic</p>
            <div className="grid grid-cols-2 gap-3">
              {[...TOPICS, 'General Math', 'Complex Concepts', 'Custom'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setSelectedTopic(t)} 
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTopic === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-blue-200 text-gray-600'}`}
                >
                  <span className="font-bold">{t}</span>
                </button>
              ))}
            </div>
            {selectedTopic === 'Custom' && (
              <input 
                type="text" 
                placeholder="Enter specific topic..." 
                value={customTopic} 
                onChange={(e) => setCustomTopic(e.target.value)} 
                className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-medium" 
              />
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tier Level</p>
            <div className="flex gap-4">
              {['Foundation', 'Higher'].map(tier => (
                <button 
                  key={tier} 
                  onClick={() => setSelectedTier(tier as Tier)} 
                  className={`flex-1 p-4 rounded-xl border-2 font-bold transition-all ${selectedTier === tier ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500'}`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <button disabled={!finalTopic} onClick={() => setSessionStarted(true)} className="w-full py-5 bg-black text-white rounded-2xl font-bold disabled:opacity-30 shadow-xl active:scale-95 transition-all">Begin Practice Session</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-8 animate-fade-in relative">
      {autoSaveNotif && (
        <div className="fixed top-20 right-8 bg-black text-white px-6 py-3 rounded-2xl text-xs font-bold animate-bounce z-[100] apple-shadow">
          ✓ Session Auto-saved
        </div>
      )}

      <div className="apple-card apple-shadow p-8 bg-gray-900 flex flex-col min-h-[600px] relative overflow-hidden">
        {isActive && (
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live</span>
          </div>
        )}

        {!isActive ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border border-white/10 text-5xl">🎙️</div>
            <button onClick={startSession} disabled={isConnecting} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform">{isConnecting ? 'Linking...' : 'Connect Voice'}</button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            <header className="mb-8 border-b border-white/10 pb-4">
               <h2 className="text-white font-bold text-lg">{finalTopic} • {selectedTier}</h2>
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[400px]">
              {sessionMessages.map((msg, i) => (
                <div key={i} className={`p-5 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai' ? 'bg-white/10 text-white mr-10' : 'bg-blue-600 text-white ml-10 text-right'}`}>
                  <p className="text-[10px] font-bold uppercase opacity-40 mb-2">{msg.role === 'ai' ? 'AI Tutor' : 'You'}</p>
                  <MathRenderer content={msg.text} />
                  {msg.role === 'ai' && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                      <div className="flex gap-3">
                        <button onClick={() => handleFeedback(i, 'up')} className={`p-2 rounded-lg hover:bg-white/10 transition ${msg.feedback === 'up' ? 'text-green-400' : 'opacity-30'}`}>👍</button>
                        <button onClick={() => handleFeedback(i, 'down')} className={`p-2 rounded-lg hover:bg-white/10 transition ${msg.feedback === 'down' ? 'text-red-400' : 'opacity-30'}`}>👎</button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Optional comment..." 
                        value={msg.comment || ''} 
                        onChange={(e) => handleComment(i, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
               <button onClick={stopSession} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl active:scale-95">End Session & Save Transcript</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITutor;
