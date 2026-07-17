import React, { useEffect, useState } from 'react';
import { MathTopic, Question, UserSettings } from '../types';
import { TOPICS, TOPIC_COLORS } from '../constants';
import { generateQuizQuestions } from '../services/gemini';
import MathRenderer from './MathRenderer';

interface Props { settings: UserSettings; }

const Flashcards: React.FC<Props> = ({ settings }) => {
  const [topic, setTopic] = useState<MathTopic>(TOPICS[0]);
  const [cards, setCards] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError(''); setFlipped(false); setIndex(0);
    try {
      const next = await generateQuizQuestions(settings.board, [topic], settings.tier, 'Calculator', 10);
      setCards(next);
      if (!next.length) setError('No cards were available. Please retry.');
    } catch { setError('Cards could not be loaded. Please retry.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [topic, settings.board, settings.tier]);
  const card = cards[index];

  return <div className="max-w-3xl mx-auto py-10 space-y-7 animate-fade-in">
    <header className="text-center"><h1 className="text-4xl font-black text-gray-900">Flashcards</h1><p className="text-gray-500 mt-2">Fast, board-aligned active recall.</p></header>
    <div className="flex gap-2 overflow-x-auto pb-2">{TOPICS.map(t => <button key={t} onClick={() => setTopic(t)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold ${t === topic ? 'bg-black text-white' : 'bg-white border text-gray-500'}`}>{t}</button>)}</div>
    {loading ? <div className="h-96 bg-white rounded-[36px] flex items-center justify-center apple-shadow"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
    : error || !card ? <div className="h-96 bg-white rounded-[36px] flex flex-col gap-4 items-center justify-center apple-shadow"><p className="text-gray-500">{error}</p><button onClick={load} className="px-5 py-3 bg-black text-white rounded-xl font-bold">Retry</button></div>
    : <>
      <button onClick={() => setFlipped(v => !v)} className="w-full min-h-96 bg-white rounded-[36px] p-10 apple-shadow border border-gray-100 text-left flex flex-col">
        <div className="flex justify-between w-full"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${TOPIC_COLORS[card.topic]}`}>{card.topic}</span><span className="text-xs text-gray-400 font-bold">{index + 1} / {cards.length}</span></div>
        <div className="flex-1 flex flex-col justify-center text-center">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-5">{flipped ? 'Answer & explanation' : 'Question'}</p>
          <div className="text-xl md:text-2xl font-bold text-gray-900"><MathRenderer text={flipped ? card.correctAnswer : card.questionText} /></div>
          {flipped && <div className="mt-6 text-sm text-gray-500"><MathRenderer text={card.explanation} /></div>}
        </div><p className="text-center text-xs text-gray-400 w-full">Tap card to {flipped ? 'see question' : 'reveal answer'}</p>
      </button>
      <div className="grid grid-cols-2 gap-3"><button disabled={index === 0} onClick={() => { setIndex(i => i - 1); setFlipped(false); }} className="py-4 bg-gray-100 rounded-2xl font-black disabled:opacity-40">← Previous</button><button onClick={() => { setIndex(i => (i + 1) % cards.length); setFlipped(false); }} className="py-4 bg-black text-white rounded-2xl font-black">Next →</button></div>
    </>}
  </div>;
};

export default Flashcards;
