export type ScienceDomain = '물리' | '화학' | '생명과학' | '지구과학';

export interface QuizQuestion {
  id: number;
  domain: ScienceDomain;
  targetGrade: '중1' | '중2' | '중3';
  topic: string; // 예: 빛과 렌즈, 원소와 불꽃반응
  question: string;
  context?: string; // 추가 설명이나 보기 박스
  options: [string, string, string, string]; // 4지선다
  correctAnswer: 0 | 1 | 2 | 3; // 0-indexed (0 = 1번, 1 = 2번, 2 = 3번, 3 = 4번)
  explanation: string;
  keyConcept: string; // 핵심 요약
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number; // 0, 1, 2, 3
  isCorrect: boolean;
  timeSpentMs: number;
  confirmedBy: 'gesture' | 'click';
}

export interface QuizResult {
  score: number; // 맞힌 개수 (0~10)
  totalQuestions: number;
  percentage: number;
  domainStats: Record<ScienceDomain, { correct: number; total: number }>;
  userAnswers: UserAnswer[];
  evaluationTitle: string;
  evaluationMessage: string;
}
