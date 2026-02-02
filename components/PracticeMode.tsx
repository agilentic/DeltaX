
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserSettings, Question, MathTopic, PaperType, Bookmark, ExamBoard, Tier } from '../types';
import { TOPICS, TOPIC_COLORS, PAPER_TYPES, BOOKMARK_CATEGORIES, EXAM_BOARDS, TIERS } from '../constants';
import { generateMathQuestion, evaluateAnswer } from '../services/gemini';
import MathRenderer from './MathRenderer';

interface PracticeModeProps {
  topic: MathTopic | 'bookmarks' | null;
  settings: UserSettings;
  bookmarks: Bookmark[];
  onComplete: (topic: MathTopic, isCorrect: boolean) => void;
  onToggleBookmark: (question: Question, category?: string) => void;
  onExit: () => void;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ topic, settings, bookmarks, onComplete, onToggleBookmark, onExit }) => {
  // Session Settings
  const [board, setBoard] = useState<ExamBoard>(settings.board);
  const [tier, setTier] = useState<Tier>(settings.tier);
  const [paperType, setPaperType] = useState<PaperType>(PAPER_TYPES[0]);
  
  // Session State
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Review Mode Specifics
  const [bookmarkCategory, setBookmarkCategory] = useState<string>('All');

  // Timer/Stats
  const [isTimed, setIsTimed] = useState(settings.defaultTimedMode);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes default
  const [sessionStats, setSessionStats] = useState({ attempted: 0, correct: 0 });
  const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
  const [sessionOver, setSessionOver] = useState(false);

  const timerRef = useRef<number | null>(null);

  const isCurrentBookmarked = currentQuestion ? bookmarks.some(b => b.question.id === currentQuestion.id) : false;

  // Handle countdown
  useEffect(() => {
    if (isTimed && isSessionStarted && !loading && !feedback && !sessionOver) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setSessionOver(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimed, isSessionStarted, loading, feedback, sessionOver]);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setCurrentQuestion(null);
    setFeedback(null);
    setUserAnswer('');
    
    if (topic === 'bookmarks') {
      const filtered = bookmarkCategory === 'All' 
        ? bookmarks 
        : bookmarks.filter(b => b.category === bookmarkCategory);
        
      if (filtered.length === 0) {
        setLoading(false);
        setSessionOver(true);
        return;
      }
      const randomBookmark = filtered[Math.floor(Math.random() * filtered.length)];
      setCurrentQuestion(randomBookmark.question);
      setLoading(false);
      return;
    }

    const targetTopic = topic || TOPICS[Math.floor(Math.random() * TOPICS.length)];
    try {
      const question = await generateMathQuestion(board, targetTopic, tier, paperType);
      setCurrentQuestion(question);
    } catch (error) {
      console.error("Error generating question", error);
    } finally {
      setLoading(false);
    }
  }, [topic, board, tier, paperType, bookmarks, bookmarkCategory]);

  const startSession = () => {
    setIsSessionStarted(true);
    loadQuestion();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !userAnswer || feedback || submitting) return;

    setSubmitting(true);
    try {
      const evaluation = await evaluateAnswer(currentQuestion, userAnswer);
      setFeedback(evaluation);
      setSessionStats(prev => ({
        attempted: prev.attempted + 1,
        correct: prev.correct + (evaluation.isCorrect ? 1 : 0)
      }));
      onComplete(currentQuestion.topic, evaluation.isCorrect);
    } catch (error) {
      console.error("Error evaluating answer", error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBookmark = (category: string = "General") => {
    if (currentQuestion) {
      onToggleBookmark(currentQuestion, category);
      setShowBookmarkMenu(false);
    }
  };

  const accuracy = sessionStats.attempted > 0 
    ? Math.round((sessionStats.correct / sessionStats.attempted) * 100) 
    : 0;

  // Session Setup View
  if (!isSessionStarted) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8 animate-fade-in">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900">Session Setup</h1>
          <p className="text-gray-500 font-medium">Configure your practice environment.</p>
        </header>

        <div className="bg-white rounded-[32px] apple-shadow p-8 space-y-8 border border-gray-100">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Board</label>
              <select value={board} onChange={(e) => setBoard(e.target.value as any)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-gray-700">
                {EXAM_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value as any)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-gray-700">
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paper Type</label>
            <div className="flex gap-2">
              {PAPER_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setPaperType(type)}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all border-2 ${paperType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {topic === 'bookmarks' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bookmark Folder</label>
              <select value={bookmarkCategory} onChange={(e) => setBookmarkCategory(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-gray-700">
                <option value="All">All Saved Questions</option>
                {BOOKMARK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="space-y-1">
              <p className="font-bold text-gray-900">Timed Session</p>
              <p className="text-xs text-gray-500">Solve against a 10-minute clock.</p>
            </div>
            <button 
              onClick={() => setIsTimed(!isTimed)}
              className={`w-14 h-8 rounded-full transition-all relative ${isTimed ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isTimed ? 'right-1' : 'left-1'} shadow-sm`} />
            </button>
          </div>

          <button onClick={startSession} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
            Start Learning
          </button>
        </div>
      </div>
    );
  }

  // Session Results View
  if (sessionOver) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-fade-in">
        <div className="text-6xl">🏁</div>
        <h2 className="text-4xl font-black text-gray-900">Session Complete</h2>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="apple-card apple-shadow p-6 bg-white">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attempted</p>
            <p className="text-3xl font-black text-gray-900">{sessionStats.attempted}</p>
          </div>
          <div className="apple-card apple-shadow p-6 bg-white">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Correct</p>
            <p className="text-3xl font-black text-green-600">{sessionStats.correct}</p>
          </div>
          <div className="apple-card apple-shadow p-6 bg-white">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
            <p className="text-3xl font-black text-blue-600">{accuracy}%</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => { setIsSessionStarted(false); setSessionOver(false); setSessionStats({attempted:0, correct:0}); setTimeRemaining(600); }} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest">Restart Session</button>
          <button onClick={onExit} className="w-full py-5 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest">Exit to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Session Stats Header */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white/50 backdrop-blur apple-shadow px-4 py-3 rounded-2xl border border-white/50">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Attempted</p>
          <p className="font-bold text-gray-900">{sessionStats.attempted}</p>
        </div>
        <div className="bg-white/50 backdrop-blur apple-shadow px-4 py-3 rounded-2xl border border-white/50">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Correct</p>
          <p className="font-bold text-green-600">{sessionStats.correct}</p>
        </div>
        <div className="bg-white/50 backdrop-blur apple-shadow px-4 py-3 rounded-2xl border border-white/50">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
          <p className="font-bold text-blue-600">{accuracy}%</p>
        </div>
        {isTimed && (
          <div className={`apple-shadow px-4 py-3 rounded-2xl border border-white/50 transition-colors ${timeRemaining < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-white/50 text-gray-900'}`}>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Timer</p>
            <p className="font-mono font-black">{formatTime(timeRemaining)}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onExit}
          className="text-gray-400 hover:text-gray-900 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest transition-colors"
        >
          &larr; Exit
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{board} • {tier} • {paperType}</span>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col relative transition-all duration-500">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-black text-gray-900">Neural Synthesis...</h3>
            <p className="text-gray-500 max-w-xs mt-2 font-medium">Fetching custom problem set from {board} syllabus.</p>
          </div>
        ) : currentQuestion ? (
          <>
            <div className="bg-gray-50/80 backdrop-blur-sm px-10 py-6 border-b border-gray-100 flex justify-between items-center">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${TOPIC_COLORS[currentQuestion.topic]}`}>
                {currentQuestion.topic}
              </span>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  <button 
                    onClick={() => isCurrentBookmarked ? handleBookmark() : setShowBookmarkMenu(!showBookmarkMenu)}
                    className={`text-2xl transition-all transform active:scale-90 ${isCurrentBookmarked ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    {isCurrentBookmarked ? '★' : '☆'}
                  </button>
                  
                  {showBookmarkMenu && (
                    <div className="absolute right-0 top-full mt-4 w-56 bg-white border border-gray-100 rounded-[28px] shadow-2xl z-[200] py-4 overflow-hidden animate-fade-in apple-shadow">
                      <p className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign to List</p>
                      {BOOKMARK_CATEGORIES.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => handleBookmark(cat)}
                          className="w-full text-left px-6 py-3 text-xs font-bold text-gray-700 hover:bg-blue-50 transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 p-12 space-y-10">
              <div className="prose prose-blue max-w-none">
                <MathRenderer 
                  content={currentQuestion.questionText} 
                  className="text-2xl text-gray-800 leading-[1.6] font-medium" 
                />
              </div>

              {!feedback ? (
                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                  <div className="relative group">
                    <label htmlFor="answer" className="absolute -top-3 left-6 bg-white px-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">Input Response</label>
                    <input
                      id="answer"
                      type="text"
                      autoFocus
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="e.g. 15.5 or y = 2x + 1"
                      className="w-full p-6 border-2 border-gray-100 rounded-[24px] focus:border-blue-500 bg-gray-50/50 focus:bg-white focus:outline-none transition-all text-xl font-bold text-gray-800"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !userAnswer}
                    className="w-full bg-black hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-6 rounded-[24px] shadow-xl transition-all uppercase tracking-[0.2em] text-sm"
                  >
                    {submitting ? 'Authenticating...' : 'Verify Solution'}
                  </button>
                </form>
              ) : (
                <div className={`p-10 rounded-[32px] border-2 space-y-6 animate-fade-in ${feedback.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${feedback.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {feedback.isCorrect ? '✓' : '×'}
                    </div>
                    <div>
                      <h4 className={`text-xl font-black ${feedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {feedback.isCorrect ? 'Excellence Achieved' : 'Growth Opportunity'}
                      </h4>
                      <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Board Verification Result</p>
                    </div>
                  </div>
                  
                  <MathRenderer content={feedback.feedback} className="text-gray-700 font-medium leading-relaxed" />
                  
                  <div className="pt-8 border-t border-gray-200/50 space-y-4">
                    <div className="bg-white/60 p-6 rounded-2xl border border-black/5">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Master Solution</p>
                      <MathRenderer content={currentQuestion.explanation} className="text-sm text-gray-700 leading-relaxed" />
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-gray-400">Final Answer</span>
                        <span className="font-black text-gray-900 text-lg">{currentQuestion.correctAnswer}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={loadQuestion}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[24px] mt-4 shadow-2xl transition-all uppercase tracking-widest text-sm active:scale-95"
                  >
                    Next Challenge &rarr;
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <p className="text-red-500 font-bold">Signal Interrupted.</p>
            <button onClick={loadQuestion} className="mt-4 text-blue-600 font-black uppercase tracking-widest underline underline-offset-8">Re-establish Link</button>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] opacity-40">MathMaster Neural Practice Interface v4.2</p>
      </div>
    </div>
  );
};

export default PracticeMode;
