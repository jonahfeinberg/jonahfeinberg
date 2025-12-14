export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  createdAt: number;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: number;
  cardCount?: number;
}

export interface QuizQuestion {
  cardId: string;
  question: string;
  correctAnswer: string;
  options?: string[]; // for multiple choice
  type: 'multiple-choice' | 'short-answer';
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface StudySession {
  deckIds: string[];
  currentIndex: number;
  cards: Flashcard[];
  completed: number;
  correct: number;
}

export type View = 'dashboard' | 'deck' | 'create' | 'study' | 'quiz';

// Deck color options
export const DECK_COLORS = [
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#22c55e', // green
  '#8b5cf6', // violet
  '#ef4444', // red
  '#3b82f6', // blue
] as const;
