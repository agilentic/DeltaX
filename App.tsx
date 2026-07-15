
import React, { useState, useEffect } from 'react';
import { UserStats, UserSettings, MathTopic, Bookmark, Question, Transaction, TutorTranscript, Wishlist } from './types';
import { INITIAL_STATS } from './constants';
import Dashboard from './components/Dashboard';
import PracticeMode from './components/PracticeMode';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import Marketplace from './components/Marketplace';
import Booking from './components/Booking';
import AITutor from './components/AITutor';
import AILab from './components/AILab';
import BrandBanner from './components/BrandBanner';
import Leaderboard from './components/Leaderboard';
import PaymentHistory from './components/PaymentHistory';
import TutorHistory from './components/TutorHistory';
import QuizGenerator from './components/QuizGenerator';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'practice' | 'settings' | 'marketplace' | 'booking' | 'tutor' | 'leaderboard' | 'history' | 'tutor-history' | 'ailab' | 'quiz'>('dashboard');
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('gcse_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.bookmarks) parsed.bookmarks = [];
      if (!parsed.transactions) parsed.transactions = [];
      if (!parsed.wishlists) parsed.wishlists = [{ id: 'default', name: 'My List', bookIds: [] }];
      if (!parsed.recentlyViewed) parsed.recentlyViewed = [];
      if (!parsed.tutorHistory) parsed.tutorHistory = [];
      return parsed;
    }
    return { ...INITIAL_STATS, wishlists: [{ id: 'default', name: 'My List', bookIds: [] }], recentlyViewed: [], tutorHistory: [] };
  });
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('gcse_settings');
    return saved ? JSON.parse(saved) : {
      board: 'AQA',
      tier: 'Higher',
      dailyGoal: 5,
      defaultTimedMode: false,
      ambientAudio: true
    };
  });
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | 'bookmarks' | null>(null);

  useEffect(() => {
    localStorage.setItem('gcse_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('gcse_settings', JSON.stringify(settings));
  }, [settings]);

  const handleCompleteQuestion = (topic: MathTopic, isCorrect: boolean) => {
    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalQuestions += 1;
      if (isCorrect) {
        newStats.correctAnswers += 1;
        newStats.topicBreakdown[topic].correct += 1;
      }
      newStats.topicBreakdown[topic].total += 1;
      newStats.topicBreakdown[topic].lastAttempted = new Date().toISOString();
      
      const today = new Date().toDateString();
      const lastActive = new Date(prev.lastActive).toDateString();
      if (today !== lastActive) {
          newStats.streak += 1;
          newStats.lastActive = new Date().toISOString();
      }
      return newStats;
    });
  };

  const saveTutorSession = (session: TutorTranscript) => {
    setStats(prev => ({
      ...prev,
      tutorHistory: [session, ...prev.tutorHistory]
    }));
  };

  const handleTransaction = (tx: Transaction) => {
    setStats(prev => ({
      ...prev,
      transactions: [tx, ...prev.transactions]
    }));
  };

  const addToWishlist = (bookId: string, wishlistId: string) => {
    setStats(prev => ({
      ...prev,
      wishlists: prev.wishlists.map(w => w.id === wishlistId 
        ? { ...w, bookIds: Array.from(new Set([...w.bookIds, bookId])) }
        : w
      )
    }));
  };

  const createWishlist = (name: string) => {
    setStats(prev => ({
      ...prev,
      wishlists: [...prev.wishlists, { id: Math.random().toString(36).substr(2, 9), name, bookIds: [] }]
    }));
  };

  const viewBook = (bookId: string) => {
    setStats(prev => ({
      ...prev,
      recentlyViewed: [bookId, ...prev.recentlyViewed.filter(id => id !== bookId)].slice(0, 10)
    }));
  };

  const toggleBookmark = (question: Question, category: string = "General") => {
    setStats(prev => {
      const isBookmarked = prev.bookmarks.some(b => b.question.id === question.id);
      if (isBookmarked) {
        return { ...prev, bookmarks: prev.bookmarks.filter(b => b.question.id !== question.id) };
      } else {
        return { ...prev, bookmarks: [...prev.bookmarks, { question, category, savedAt: new Date().toISOString() }] };
      }
    });
  };

  const startPractice = (topic?: MathTopic | 'bookmarks') => {
    setSelectedTopic(topic || null);
    setView('practice');
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar currentView={view} setView={setView} streak={stats.streak} />
      
      <main className="flex-1">
        {view === 'dashboard' && (
          <>
            <BrandBanner />
            <div className="container mx-auto px-4 py-12 max-w-5xl">
              <Dashboard 
                stats={stats} 
                settings={settings}
                onStartPractice={startPractice}
              />
            </div>
          </>
        )}
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {view === 'practice' && (
            <PracticeMode 
              topic={selectedTopic}
              settings={settings}
              bookmarks={stats.bookmarks}
              onComplete={handleCompleteQuestion}
              onToggleBookmark={toggleBookmark}
              onExit={() => setView('dashboard')}
            />
          )}
          {view === 'quiz' && (
            <QuizGenerator 
              settings={settings}
              bookmarks={stats.bookmarks}
              onComplete={handleCompleteQuestion}
              onToggleBookmark={toggleBookmark}
              onExit={() => setView('dashboard')}
            />
          )}
          {view === 'settings' && <Settings settings={settings} onUpdate={setSettings} />}
          {view === 'marketplace' && (
            <Marketplace 
              onPurchase={handleTransaction} 
              wishlists={stats.wishlists} 
              onAddToWishlist={addToWishlist}
              onCreateWishlist={createWishlist}
              recentlyViewed={stats.recentlyViewed}
              onViewBook={viewBook}
            />
          )}
          {view === 'booking' && <Booking onConfirm={handleTransaction} />}
          {view === 'tutor' && <AITutor onExit={() => setView('dashboard')} ambientEnabled={settings.ambientAudio} onSaveSession={saveTutorSession} />}
          {view === 'ailab' && <AILab />}
          {view === 'leaderboard' && <Leaderboard stats={stats} />}
          {view === 'history' && <PaymentHistory transactions={stats.transactions} />}
          {view === 'tutor-history' && <TutorHistory history={stats.tutorHistory} onBack={() => setView('dashboard')} />}
        </div>
      </main>

      <footer className="bg-white border-t py-12 text-center text-gray-400 text-sm">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left">
            <h3 className="text-gray-900 font-bold text-lg">MathMaster</h3>
            <p className="mt-2 max-w-xs">Empowering learners with high-performance AI tools and expert pedagogy.</p>
          </div>
          <div className="flex gap-8">
            <button onClick={() => setView('tutor-history')} className="hover:text-blue-600">Transcripts</button>
            <button onClick={() => setView('history')} className="hover:text-blue-600">Payments</button>
            <a href="https://wa.me/1234567890" target="_blank" className="font-bold text-green-600">WhatsApp</a>
          </div>
        </div>
        <p className="mt-8">&copy; 2025 MathMaster Corp.</p>
      </footer>
    </div>
  );
};

export default App;
