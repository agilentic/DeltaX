import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserSettings, Question, MathTopic, PaperType, Bookmark, ExamBoard, Tier } from '../types';
import { TOPICS, TOPIC_COLORS, PAPER_TYPES, BOOKMARK_CATEGORIES, EXAM_BOARDS, TIERS } from '../constants';
import { generateQuizQuestions, evaluateAnswer } from '../services/gemini';
import MathRenderer from './MathRenderer';

interface QuizGeneratorProps {
  settings: UserSettings;
  bookmarks: Bookmark[];
  onComplete: (topic: MathTopic, isCorrect: boolean) => void;
  onToggleBookmark: (question: Question, category?: string) => void;
  onExit: () => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  settings,
  bookmarks,
  onComplete,
  onToggleBookmark,
  onExit
}) => {
  // Setup States
  const [board, setBoard] = useState<ExamBoard>(settings.board);
  const [tier, setTier] = useState<Tier>(settings.tier);
  const [paperType, setPaperType] = useState<PaperType>(PAPER_TYPES[0]);
  const [selectedTopics, setSelectedTopics] = useState<MathTopic[]>(() => [...TOPICS]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isTimed, setIsTimed] = useState<boolean>(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);

  // Active Quiz States
  const [quizState, setQuizState] = useState<'setup' | 'generating' | 'active' | 'results'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(600);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Quiz Results States
  const [evaluations, setEvaluations] = useState<Record<string, { isCorrect: boolean; feedback: string }>>({});
  const [grade, setGrade] = useState<string>('');
  const [score, setScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [showBookmarkMenuId, setShowBookmarkMenuId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  // Timer Effect
  useEffect(() => {
    if (quizState === 'active' && isTimed) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto submit when time runs out
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quizState, isTimed]);

  const toggleTopic = (topic: MathTopic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic) 
        : [...prev, topic]
    );
  };

  const handleSelectAllTopics = () => setSelectedTopics([...TOPICS]);
  const handleDeselectAllTopics = () => setSelectedTopics([]);

  const handleGenerateQuiz = async () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic for your quiz.");
      return;
    }
    setQuizState('generating');
    try {
      const generated = await generateQuizQuestions(board, selectedTopics, tier, paperType, questionCount);
      if (generated && generated.length > 0) {
        setQuestions(generated);
        setAnswers({});
        setEvaluations({});
        setCurrentIdx(0);
        setTimeRemaining(timeLimitMinutes * 60);
        setQuizState('active');
      } else {
        alert("We had trouble generating the questions. Please try again.");
        setQuizState('setup');
      }
    } catch (err) {
      console.error(err);
      alert("Error generating quiz questions. Please try again.");
      setQuizState('setup');
    }
  };

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: val
    }));
  };

  const handleAutoSubmit = () => {
    alert("Time's up! Your quiz answers are being submitted automatically.");
    submitQuiz();
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    const evals: Record<string, { isCorrect: boolean; feedback: string }> = {};
    let correctCount = 0;

    try {
      const evalPromises = questions.map(async (q) => {
        const ans = answers[q.id] || '';
        try {
          const result = await evaluateAnswer(q, ans);
          evals[q.id] = result;
          if (result.isCorrect) {
            correctCount++;
          }
        } catch (err) {
          console.error("Error evaluating answer for question", q.id, err);
          evals[q.id] = {
            isCorrect: false,
            feedback: "Evaluation timeout or error. Please check the model answer below."
          };
        }
      });

      await Promise.all(evalPromises);
      setEvaluations(evals);
      setScore({ correct: correctCount, total: questions.length });

      // Grade threshold logic
      const pct = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
      let quizGrade = 'Fail';
      if (pct >= 90) quizGrade = 'Grade 9 (Exceptional)';
      else if (pct >= 80) quizGrade = 'Grade 8 (Excellent)';
      else if (pct >= 70) quizGrade = 'Grade 7 (Very Good)';
      else if (pct >= 60) quizGrade = 'Grade 6 (Good)';
      else if (pct >= 50) quizGrade = 'Grade 5 (Strong Pass)';
      else if (pct >= 40) quizGrade = 'Grade 4 (Standard Pass)';
      else quizGrade = 'Grade 3 (Revision Recommended)';

      setGrade(quizGrade);

      // Report individual complete triggers
      questions.forEach(q => {
        onComplete(q.topic, evals[q.id]?.isCorrect || false);
      });

      setQuizState('results');
    } catch (err) {
      console.error(err);
      alert("Error submitting answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup View
  if (quizState === 'setup') {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fade-in">
        <header className="text-center space-y-3">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-extrabold tracking-wider uppercase">
            Custom Assessment
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">AI Quiz Generator</h1>
          <p className="text-gray-500 font-medium">Design and generate a unique, board-aligned quiz on topics of your choice.</p>
        </header>

        <div className="bg-white rounded-[32px] apple-shadow p-8 md:p-10 space-y-8 border border-gray-100">
          {/* Exam Board & Tier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Board</label>
              <select 
                value={board} 
                onChange={(e) => setBoard(e.target.value as ExamBoard)} 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-gray-700 cursor-pointer transition-colors"
              >
                {EXAM_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tier Level</label>
              <select 
                value={tier} 
                onChange={(e) => setTier(e.target.value as Tier)} 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-gray-700 cursor-pointer transition-colors"
              >
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculator Policy</label>
              <select 
                value={paperType} 
                onChange={(e) => setPaperType(e.target.value as PaperType)} 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none font-bold text-gray-700 cursor-pointer transition-colors"
              >
                {PAPER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          {/* Topics Multiselection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Syllabus Topics</label>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={handleSelectAllTopics} 
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold transition-colors"
                >
                  Select All
                </button>
                <button 
                  type="button" 
                  onClick={handleDeselectAllTopics} 
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOPICS.map(topic => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-500'
                    }`}
                  >
                    <span className="text-xs md:text-sm">{topic}</span>
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count & Timed options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Number of Questions</label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-3.5 rounded-xl font-bold transition-all border-2 ${
                      questionCount === count 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quiz Timer</label>
              <div className="flex gap-4 items-center h-[54px] px-6 bg-gray-50 rounded-2xl border-2 border-gray-100">
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Timed Quiz</span>
                  <button 
                    type="button"
                    onClick={() => setIsTimed(!isTimed)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isTimed ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isTimed ? 'right-0.5' : 'left-0.5'} shadow-sm`} />
                  </button>
                </div>
                {isTimed && (
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <input 
                      type="number" 
                      min="1" 
                      max="60" 
                      value={timeLimitMinutes} 
                      onChange={(e) => setTimeLimitMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 bg-transparent text-center font-bold text-gray-700 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-gray-400">mins</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerateQuiz} 
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all"
          >
            Generate Unique Quiz &rarr;
          </button>
        </div>
      </div>
    );
  }

  // Loading / Generating View
  if (quizState === 'generating') {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
        <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h3 className="text-3xl font-black text-gray-900">Assembling Exam Board Paper...</h3>
        <p className="text-gray-500 max-w-md mx-auto font-medium">
          Our AI is synthesizing a unique, custom-graded math curriculum from the <span className="font-bold text-gray-800">{board} {tier}</span> syllabus.
        </p>
      </div>
    );
  }

  // Active Quiz View
  if (quizState === 'active') {
    const activeQuestion = questions[currentIdx];
    const isAnswered = !!answers[activeQuestion.id];
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-6">
        {/* Quiz Banner info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white px-8 py-5 rounded-[24px] border border-gray-100 apple-shadow">
          <div>
            <h3 className="font-extrabold text-gray-800 text-lg">
              {board} Custom Assessment • {tier} Tier
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
              {paperType} • {questions.length} Questions
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {isTimed && (
              <div className={`px-5 py-2 rounded-2xl flex items-center gap-2.5 ${timeRemaining < 60 ? 'bg-red-50 text-red-600 animate-pulse border border-red-100' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Time Left</span>
                <span className="font-mono font-black text-base">{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            <button 
              onClick={() => {
                if(window.confirm("Are you sure you want to end this quiz early? Unsaved progress will be lost.")) {
                  onExit();
                }
              }} 
              className="text-xs text-gray-400 hover:text-black font-extrabold uppercase tracking-widest transition-colors"
            >
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Progress Grid and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Question map sidebar */}
          <div className="bg-white rounded-[28px] border border-gray-100 p-6 apple-shadow space-y-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quiz Progress</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300" 
                  style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-gray-500 mt-2">
                {Object.keys(answers).length} of {questions.length} completed
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Question Navigator</p>
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => {
                  const answered = !!answers[q.id];
                  const isActive = currentIdx === idx;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-105' 
                          : answered 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 text-[10px] font-bold text-gray-400 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                <span>Active Question</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-900 inline-block"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-50 border border-gray-200 inline-block"></span>
                <span>Unanswered</span>
              </div>
            </div>
          </div>

          {/* Active Question Panel */}
          <div className="lg:col-span-3 bg-white rounded-[32px] border border-gray-100 apple-shadow overflow-hidden min-h-[420px] flex flex-col justify-between">
            {/* Header */}
            <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${TOPIC_COLORS[activeQuestion.topic as MathTopic] || 'bg-gray-100 text-gray-700'}`}>
                {activeQuestion.topic}
              </span>
              <span className="text-xs font-bold text-gray-400">
                Marks: {activeQuestion.marks || 4}
              </span>
            </div>

            {/* Question Text */}
            <div className="p-8 md:p-10 space-y-8 flex-1">
              <p className="text-gray-400 font-extrabold text-[10px] tracking-widest uppercase">Question {currentIdx + 1} of {questions.length}</p>
              <div className="prose prose-blue max-w-none">
                <MathRenderer 
                  content={activeQuestion.questionText} 
                  className="text-xl md:text-2xl text-gray-800 leading-relaxed font-semibold"
                />
              </div>

              {/* Input section */}
              <div className="pt-6 relative max-w-xl">
                <label className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-black text-blue-600 uppercase tracking-widest">Your Solution</label>
                <input
                  type="text"
                  value={answers[activeQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(activeQuestion.id, e.target.value)}
                  placeholder="Enter final answer (e.g. 14, 3/5, or formula)..."
                  className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:border-blue-500 bg-gray-50/30 focus:bg-white focus:outline-none transition-all font-bold text-gray-800 text-lg"
                />
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="bg-gray-50/50 px-8 py-5 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="px-5 py-3 text-xs font-bold text-gray-600 hover:text-black border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                &larr; Previous Question
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="px-6 py-3 text-xs font-bold bg-black text-white hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Next Question &rarr;
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm("Submit your complete quiz answers for AI grading?")) {
                      submitQuiz();
                    }
                  }}
                  className="px-6 py-3 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl uppercase tracking-wider transition-colors"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grading State (submitting evaluates)
  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
        <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h3 className="text-3xl font-black text-gray-900">Grading Answers...</h3>
        <p className="text-gray-500 max-w-md mx-auto font-medium">
          Our AI is examining each solution you submitted, assessing step-by-step logic, mathematical equivalents, and generating constructive coaching feedback.
        </p>
      </div>
    );
  }

  // Results View
  if (quizState === 'results') {
    const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-6">
        {/* Results Hero Card */}
        <div className="bg-black text-white rounded-[36px] apple-shadow p-8 md:p-12 text-center space-y-8 relative overflow-hidden">
          {/* Subtle geometric circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10 space-y-4">
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400">
              Quiz Completed
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight">Assessment Dashboard</h2>
            <div className="text-6xl font-black text-blue-400 py-3">{grade}</div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4 max-w-lg mx-auto pt-4 border-t border-white/10">
            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Questions</p>
              <p className="text-2xl font-bold mt-1">{score.total}</p>
            </div>
            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Correct</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{score.correct}</p>
            </div>
            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Accuracy</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{accuracy}%</p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setQuestions([]);
              setAnswers({});
              setEvaluations({});
              setQuizState('setup');
            }} 
            className="flex-1 py-4 bg-black text-white rounded-2xl font-bold transition-all hover:bg-gray-800 uppercase tracking-wider text-xs shadow-lg"
          >
            New Custom Quiz
          </button>
          
          <button 
            onClick={onExit} 
            className="flex-1 py-4 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-2xl transition-all uppercase tracking-wider text-xs"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Detailed Solutions Review list */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">Quiz Solutions & AI Feedback</h3>
          
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const evalResult = evaluations[q.id] || { isCorrect: false, feedback: "No feedback" };
              const userAnswer = answers[q.id] || '(Skipped)';
              const isSaved = bookmarks.some(b => b.question.id === q.id);
              
              return (
                <div key={q.id} className="bg-white rounded-[32px] border border-gray-100 p-8 apple-shadow space-y-6">
                  {/* Title Bar */}
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center ${
                        evalResult.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${TOPIC_COLORS[q.topic as MathTopic] || 'bg-gray-100 text-gray-700'}`}>
                        {q.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Bookmark button */}
                      <div className="relative">
                        <button
                          onClick={() => isSaved ? onToggleBookmark(q) : setShowBookmarkMenuId(q.id)}
                          className={`p-2 rounded-xl transition-all hover:bg-gray-50 ${isSaved ? 'text-yellow-400' : 'text-gray-300 hover:text-gray-400'}`}
                          title="Bookmark this challenge"
                        >
                          {isSaved ? '★ Bookmarked' : '☆ Save Question'}
                        </button>
                        
                        {showBookmarkMenuId === q.id && (
                          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-[20px] shadow-2xl z-[150] py-3 overflow-hidden apple-shadow animate-fade-in">
                            <p className="px-5 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Assign Folder</p>
                            {BOOKMARK_CATEGORIES.map(cat => (
                              <button 
                                key={cat}
                                onClick={() => {
                                  onToggleBookmark(q, cat);
                                  setShowBookmarkMenuId(null);
                                }}
                                className="w-full text-left px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 transition-colors"
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="prose max-w-none">
                    <MathRenderer content={q.questionText} className="text-gray-800 leading-relaxed font-semibold text-lg" />
                  </div>

                  {/* Submission Answers Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Your Answer</p>
                      <p className={`text-base font-bold mt-1 ${evalResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {userAnswer}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                      <p className="text-[9px] font-black uppercase text-blue-400 tracking-wider">Correct Answer</p>
                      <p className="text-base font-bold text-blue-900 mt-1">
                        {q.correctAnswer}
                      </p>
                    </div>
                  </div>

                  {/* Master explanation */}
                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">AI Evaluation Feedback</h4>
                      <MathRenderer content={evalResult.feedback} className="text-sm text-gray-700 leading-relaxed font-medium" />
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step-by-Step Solution</h4>
                      <MathRenderer content={q.explanation} className="text-xs text-gray-600 leading-relaxed" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return null;
};

export default QuizGenerator;
