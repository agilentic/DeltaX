
import { MathTopic, ExamBoard, Tier, PaperType, LeaderboardEntry } from './types';

export const EXAM_BOARDS: ExamBoard[] = ['AQA', 'Edexcel', 'OCR'];
export const TIERS: Tier[] = ['Foundation', 'Higher'];
export const PAPER_TYPES: PaperType[] = ['Calculator', 'Non-Calculator'];
export const BOOKMARK_CATEGORIES = ["General", "Weak Areas", "Revision", "Exam Practice"];

export const TOPICS = Object.values(MathTopic);

// Fix: Added missing Calculus topic color to satisfy the Record<MathTopic, string> type requirement
export const TOPIC_COLORS: Record<MathTopic, string> = {
  [MathTopic.Number]: 'bg-blue-100 text-blue-700',
  [MathTopic.Algebra]: 'bg-purple-100 text-purple-700',
  [MathTopic.Ratio]: 'bg-orange-100 text-orange-700',
  [MathTopic.Geometry]: 'bg-green-100 text-green-700',
  [MathTopic.Probability]: 'bg-red-100 text-red-700',
  [MathTopic.Statistics]: 'bg-indigo-100 text-indigo-700',
  [MathTopic.Calculus]: 'bg-pink-100 text-pink-700',
};

export const INITIAL_STATS = {
  totalQuestions: 0,
  correctAnswers: 0,
  streak: 0,
  lastActive: new Date().toISOString(),
  topicBreakdown: TOPICS.reduce((acc, topic) => {
    acc[topic] = { correct: 0, total: 0, lastAttempted: null };
    return acc;
  }, {} as any),
  bookmarks: [],
  transactions: []
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "AlphaDelta", score: 2450 },
  { rank: 2, name: "MathWiz99", score: 2120 },
  { rank: 3, name: "Pythagoras_Fan", score: 1980 },
  { rank: 4, name: "GCSE_Hero", score: 1850 },
  { rank: 5, name: "BinaryStar", score: 1720 },
];
