
import React, { useState } from 'react';
import { UserStats, MathTopic } from '../types';
import { TOPICS, MOCK_LEADERBOARD, TOPIC_COLORS } from '../constants';

interface LeaderboardProps {
  stats: UserStats;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ stats }) => {
  const [activeTopic, setActiveTopic] = useState<MathTopic | 'Overall'>('Overall');

  return (
    <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Elite Performance</h1>
        <p className="text-gray-500">Track your standing against the GCSE Math Master community.</p>
      </header>

      <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 rounded-2xl max-w-max mx-auto no-scrollbar">
        <button 
          onClick={() => setActiveTopic('Overall')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTopic === 'Overall' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Overall
        </button>
        {TOPICS.map(topic => (
          <button 
            key={topic}
            onClick={() => setActiveTopic(topic)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTopic === topic ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="apple-card apple-shadow overflow-hidden bg-white">
        <div className="p-8 space-y-2 border-b">
           <div className="flex justify-between items-end">
              <div>
                 <h3 className="text-2xl font-bold">{activeTopic} Ranking</h3>
                 <p className="text-sm text-gray-500">Current Season: May 2025</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Position</p>
                 <p className="text-2xl font-bold text-blue-600">#24</p>
              </div>
           </div>
        </div>
        
        <div className="divide-y divide-gray-100">
           {MOCK_LEADERBOARD.map((entry, i) => (
             <div key={entry.name} className={`px-8 py-5 flex items-center justify-between transition-colors hover:bg-gray-50 ${entry.isCurrentUser ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-center gap-8">
                   <div className="w-8 text-lg font-bold text-gray-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                         {entry.name.charAt(0)}
                      </div>
                      <div>
                         <p className="font-bold text-gray-900">{entry.name}</p>
                         <p className="text-xs text-gray-500">Tier: Higher</p>
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-bold text-gray-900">{entry.score} XP</p>
                   <div className="flex gap-1 justify-end mt-1">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      ))}
                   </div>
                </div>
             </div>
           ))}
           {/* Current User Row */}
           <div className="px-8 py-6 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-8">
                 <div className="w-8 text-lg font-bold opacity-70">#24</div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">Y</div>
                    <div>
                       <p className="font-bold">You (Student)</p>
                       <p className="text-xs opacity-70">Tier: Higher</p>
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <p className="font-bold text-xl">{stats.totalQuestions * 10} XP</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
