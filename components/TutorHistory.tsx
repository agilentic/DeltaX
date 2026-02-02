
import React, { useState } from 'react';
import { TutorTranscript } from '../types';
import MathRenderer from './MathRenderer';

interface HistoryProps {
  history: TutorTranscript[];
  onBack: () => void;
}

const TutorHistory: React.FC<HistoryProps> = ({ history, onBack }) => {
  const [selectedSession, setSelectedSession] = useState<TutorTranscript | null>(null);

  if (selectedSession) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-8 animate-fade-in">
        <button onClick={() => setSelectedSession(null)} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
          &larr; Return to History
        </button>
        
        <header className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight">{selectedSession.topic}</h2>
          <div className="flex items-center gap-4 text-gray-500 font-medium">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{selectedSession.tier} Tier</span>
            <span>{new Date(selectedSession.date).toLocaleString()}</span>
          </div>
        </header>

        <div className="bg-white rounded-3xl p-10 apple-shadow space-y-8 border border-gray-100">
          {selectedSession.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-6 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-900 border border-gray-100'}`}>
                <p className="font-bold text-[10px] uppercase opacity-40 tracking-widest mb-2">{msg.role === 'user' ? 'Student' : 'AI Tutor'}</p>
                <MathRenderer content={msg.text} />
                {msg.feedback && (
                  <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-2 text-[10px] font-bold uppercase opacity-60">
                    <span>{msg.feedback === 'up' ? '👍 Marked as Helpful' : '👎 Improvement Requested'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-8">
           <p className="text-gray-400 text-xs italic">End of Transcript • Session ID: {selectedSession.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Study Transcripts</h1>
          <p className="text-gray-500 font-medium">Review your personalized AI Tutor interactions to reinforce learning.</p>
        </div>
        <button onClick={onBack} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-200 transition-all">
          Dashboard &rarr;
        </button>
      </header>

      <div className="apple-card apple-shadow bg-white overflow-hidden border border-gray-100">
        {history.length === 0 ? (
          <div className="p-20 text-center space-y-6">
             <div className="text-7xl grayscale opacity-20">📚</div>
             <div className="space-y-2">
               <p className="text-xl font-bold text-gray-900">No transcripts yet</p>
               <p className="text-gray-500">Your AI Tutor sessions will be automatically logged here for later review.</p>
             </div>
             <button onClick={onBack} className="text-blue-600 font-bold hover:underline">Start a practice session now</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map(session => (
              <button 
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full p-8 text-left hover:bg-gray-50 transition-all flex justify-between items-center group"
              >
                <div className="flex gap-8 items-center">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📝
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">{session.topic}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                         <span className="uppercase tracking-widest bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px] font-bold">{session.tier}</span>
                         <span>{new Date(session.date).toLocaleDateString()}</span>
                         <span>•</span>
                         <span>{session.messages.length} exchanges</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  Read Analysis <span className="text-lg">&rarr;</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4 items-center">
         <span className="text-2xl">🧠</span>
         <p className="text-sm text-blue-800 leading-relaxed font-medium">
           <strong>Pro Tip:</strong> Regularly reviewing your transcripts helps identify recurring conceptual gaps. The AI Tutor remembers your tier and topic context for better historical accuracy.
         </p>
      </div>
    </div>
  );
};

export default TutorHistory;
