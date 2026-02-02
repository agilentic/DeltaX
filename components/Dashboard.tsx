
import React from 'react';
import { UserStats, UserSettings, MathTopic } from '../types';
import { TOPICS, TOPIC_COLORS, MOCK_LEADERBOARD } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  stats: UserStats;
  settings: UserSettings;
  onStartPractice: (topic?: MathTopic | 'bookmarks') => void;
}

const QUOTES = [
  "Mathematics is the music of reason. — James Joseph Sylvester",
  "The only way to learn mathematics is to do mathematics. — Paul Halmos",
  "Pure mathematics is, in its way, the poetry of logical ideas. — Albert Einstein",
  "Math is the language of the universe. — Galileo Galilei",
  "Nature is written in mathematical symbols. — Leonardo da Vinci"
];

const Dashboard: React.FC<DashboardProps> = ({ stats, settings, onStartPractice }) => {
  const chartData = TOPICS.map(topic => ({
    name: topic.split(' ')[0],
    accuracy: stats.topicBreakdown[topic].total > 0 
      ? Math.round((stats.topicBreakdown[topic].correct / stats.topicBreakdown[topic].total) * 100) 
      : 0
  }));

  const dailyProgress = Math.min((stats.totalQuestions % settings.dailyGoal) / settings.dailyGoal * 100, 100);
  const randomQuote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

  // Spaced Repetition Recommendation (Topics not touched in 2+ days)
  const recommendedTopic = TOPICS.find(topic => {
    const lastAttempted = stats.topicBreakdown[topic].lastAttempted;
    if (!lastAttempted) return false;
    const diff = Date.now() - new Date(lastAttempted).getTime();
    return diff > 2 * 24 * 60 * 60 * 1000;
  }) || TOPICS.reduce((prev, curr) => (stats.topicBreakdown[curr].correct < stats.topicBreakdown[prev].correct ? curr : prev), TOPICS[0]);

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="space-y-4">
        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold tracking-wider uppercase">
          Daily Briefing
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Level up your <span className="text-blue-600">potential.</span>
        </h1>
        <p className="text-xl text-gray-500 font-medium max-w-2xl">{randomQuote}</p>
      </header>

      {/* Recommended for You (Spaced Repetition) */}
      <div className="apple-card bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 apple-shadow">
         <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2">
               <h3 className="text-2xl font-bold">Recommended for Optimization</h3>
               <p className="text-blue-100">Reviewing <span className="font-bold">{recommendedTopic}</span> now will maximize your long-term retention.</p>
            </div>
            <button 
              onClick={() => onStartPractice(recommendedTopic)}
              className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
            >
              Start Revision
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="apple-card apple-shadow p-8 flex flex-col justify-between h-48">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Rank</span>
          <div className="text-5xl font-bold text-gray-900">
             #24
          </div>
          <div className="text-sm text-blue-600 font-medium">Top 5% of learners</div>
        </div>
        
        <div className="apple-card apple-shadow p-8 flex flex-col justify-between h-48 border-l-4 border-blue-500">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily Goal</span>
          <div className="text-5xl font-bold text-gray-900">{Math.round(dailyProgress)}%</div>
          <p className="text-sm text-gray-500 font-medium">{stats.totalQuestions % settings.dailyGoal} of {settings.dailyGoal} completed</p>
        </div>

        <div className="apple-card apple-shadow p-8 flex flex-col justify-between h-48 bg-gray-900 text-white">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Streak</span>
          <div className="text-5xl font-bold">{stats.streak} Days</div>
          <p className="text-sm text-gray-400">Momentum is key.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 apple-card apple-shadow p-8 overflow-hidden">
           <h3 className="text-lg font-bold mb-8">Performance Analytics</h3>
           {/* Wrapping ResponsiveContainer with a container that has explicit pixel height and min-width to prevent -1/0 warnings */}
           <div style={{ width: '100%', height: '300px', minHeight: '300px', minWidth: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="accuracy" radius={[6, 6, 6, 6]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#1d1d1f'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="apple-card apple-shadow p-8 flex flex-col justify-between">
          <h3 className="text-lg font-bold">Top Students</h3>
          <div className="space-y-4">
             {MOCK_LEADERBOARD.slice(0, 3).map(entry => (
               <div key={entry.name} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3 items-center">
                     <span className="font-bold text-gray-400">#{entry.rank}</span>
                     <span className="font-medium">{entry.name}</span>
                  </div>
                  <span className="font-bold text-blue-600">{entry.score} pts</span>
               </div>
             ))}
          </div>
          <button className="w-full py-3 bg-gray-100 rounded-xl text-sm font-bold mt-4 hover:bg-gray-200 transition-colors">View All Leaderboards</button>
        </div>
      </div>

      <section className="space-y-6 pt-12">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-bold">Curated Practice</h2>
          <button onClick={() => onStartPractice()} className="text-blue-600 font-semibold text-sm">Review All &rarr;</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOPICS.slice(0, 6).map(topic => (
            <button
              key={topic}
              onClick={() => onStartPractice(topic)}
              className="apple-card apple-shadow p-6 text-left group"
            >
              <div className="flex justify-between items-center mb-6">
                 <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <span className="text-lg">📐</span>
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stats.topicBreakdown[topic].total} Attempted</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{topic}</h4>
              <p className="text-sm text-gray-500 mb-4">Master fundamental principles and exam techniques.</p>
              <div className="w-full py-2 flex justify-end">
                <span className="text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Learn &rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
