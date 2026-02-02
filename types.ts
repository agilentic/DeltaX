
export type ExamBoard = 'AQA' | 'Edexcel' | 'OCR';
export type Tier = 'Foundation' | 'Higher';
export type PaperType = 'Calculator' | 'Non-Calculator';

export enum MathTopic {
  Number = 'Number',
  Algebra = 'Algebra',
  Ratio = 'Ratio, Proportion and Rates of Change',
  Geometry = 'Geometry and Measures',
  Probability = 'Probability',
  Statistics = 'Statistics',
  Calculus = 'Calculus (Advanced)'
}

export interface Question {
  id: string;
  topic: MathTopic;
  tier: Tier;
  paperType: PaperType;
  board: ExamBoard;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  marks: number;
}

export interface Bookmark {
  question: Question;
  category: string;
  savedAt: string;
}

export interface TopicStats {
  correct: number;
  total: number;
  lastAttempted: string | null;
}

export interface TutorTranscript {
  id: string;
  topic: string;
  tier: Tier;
  date: string;
  messages: { role: 'user' | 'ai'; text: string; feedback?: 'up' | 'down'; comment?: string }[];
}

export interface Wishlist {
  id: string;
  name: string;
  bookIds: string[];
}

export interface UserStats {
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  lastActive: string;
  topicBreakdown: Record<MathTopic, TopicStats>;
  bookmarks: Bookmark[];
  transactions: Transaction[];
  wishlists: Wishlist[];
  recentlyViewed: string[];
  tutorHistory: TutorTranscript[];
}

export interface UserSettings {
  board: ExamBoard;
  tier: Tier;
  dailyGoal: number;
  defaultTimedMode: boolean;
  ambientAudio: boolean;
}

export interface BookReview {
  user: string;
  rating: number;
  comment: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  image: string;
  category: 'Textbook' | 'Revision' | 'Workbook';
  rating: number;
  reviews: BookReview[];
  featured?: boolean;
  publishedDate: string;
}

export interface Transaction {
  id: string;
  item: string;
  amount: number;
  date: string;
  type: 'Lesson' | 'Book' | 'Generation';
  appointmentDetails?: {
    mentor: string;
    date: string;
    time: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isCurrentUser?: boolean;
}
