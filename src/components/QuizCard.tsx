import React from 'react';
import { QuizQuestion } from '../types/quiz';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, BookOpen, Sparkles, MousePointer } from 'lucide-react';

interface QuizCardProps {
  question: QuizQuestion;
  selectedOption: number | null; // 0, 1, 2, 3
  isConfirmed: boolean;
  activeGestureOption: number | null; // currently detected finger choice (0~3)
  holdProgress: number; // 0 to 1
  onSelectOption: (optionIndex: number, confirmedBy: 'click' | 'gesture') => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  isHoldingFist?: boolean;
  fistProgress?: number;
}

const DOMAIN_STYLES: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  물리: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: '물리 (Physics)',
  },
  화학: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: '화학 (Chemistry)',
  },
  생명과학: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    label: '생명과학 (Biology)',
  },
  지구과학: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: '지구과학 (Earth Science)',
  },
};

const GESTURE_ICONS = ['☝ 1번', '✌ 2번', '🤟 3번', '🖖 4번'];

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  selectedOption,
  isConfirmed,
  activeGestureOption,
  holdProgress,
  onSelectOption,
  onNextQuestion,
  isLastQuestion,
  isHoldingFist = false,
  fistProgress = 0,
}) => {
  const domainStyle = DOMAIN_STYLES[question.domain] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    label: question.domain,
  };

  const isUserCorrect = isConfirmed && selectedOption === question.correctAnswer;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      {/* Question Header & Meta */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold border ${domainStyle.bg} ${domainStyle.text} ${domainStyle.border}`}
            >
              {domainStyle.label}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {question.targetGrade}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {question.topic}
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
            <span>손가락 유지 또는 마우스 클릭</span>
          </div>
        </div>

        {/* Question Title */}
        <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-3">
          <span className="text-cyan-400 mr-1.5">Q{question.id}.</span>
          {question.question}
        </h2>

        {/* Context / Hint Box if provided */}
        {question.context && (
          <div className="mb-5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-cyan-300 font-semibold mr-1">탐구 조건:</strong>
              {question.context}
            </div>
          </div>
        )}

        {/* 4 Choices */}
        <div className="grid grid-cols-1 gap-3 mb-5">
          {question.options.map((optionText, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = question.correctAnswer === idx;
            const isHoldingThis = activeGestureOption === idx && !isConfirmed;

            let buttonStyles = 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700';
            let badgeStyles = 'bg-slate-800 text-slate-300 border-slate-700';

            if (isConfirmed) {
              if (isCorrect) {
                buttonStyles = 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg shadow-emerald-500/10';
                badgeStyles = 'bg-emerald-500 text-white border-emerald-400';
              } else if (isSelected && !isCorrect) {
                buttonStyles = 'bg-rose-950/70 border-rose-500 text-slate-200 shadow-lg shadow-rose-500/10';
                badgeStyles = 'bg-rose-500 text-white border-rose-400';
              } else {
                buttonStyles = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
              }
            } else if (isHoldingThis) {
              buttonStyles =
                'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/30 scale-[1.01]';
              badgeStyles = 'bg-cyan-500 text-slate-950 border-cyan-300 font-extrabold';
            } else if (isSelected) {
              buttonStyles = 'bg-indigo-950/70 border-indigo-500 text-white';
              badgeStyles = 'bg-indigo-500 text-white border-indigo-400';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isConfirmed}
                onClick={() => onSelectOption(idx, 'click')}
                className={`relative w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-150 flex items-center justify-between group overflow-hidden ${buttonStyles} ${
                  !isConfirmed ? 'cursor-pointer hover:bg-slate-800/60' : 'cursor-default'
                }`}
              >
                {/* Hold Progress Bar for Active Gesture on this option */}
                {isHoldingThis && (
                  <div
                    className="absolute inset-y-0 left-0 bg-cyan-500/20 transition-all duration-75 pointer-events-none"
                    style={{ width: `${Math.min(100, holdProgress * 100)}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                  {/* Number Badge */}
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border shrink-0 transition-colors ${badgeStyles}`}
                  >
                    {idx + 1}
                  </span>

                  {/* Option Text */}
                  <span className="text-sm sm:text-base font-medium break-words leading-snug">
                    {optionText}
                  </span>
                </div>

                {/* Right Status / Gesture Helper */}
                <div className="relative z-10 shrink-0 flex items-center gap-2">
                  {!isConfirmed && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md border hidden sm:inline-block font-semibold transition ${
                        isHoldingThis
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:text-cyan-300'
                      }`}
                    >
                      {GESTURE_ICONS[idx]}
                    </span>
                  )}

                  {isConfirmed && isCorrect && (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs sm:text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="hidden sm:inline">정답</span>
                    </div>
                  )}

                  {isConfirmed && isSelected && !isCorrect && (
                    <div className="flex items-center gap-1 text-rose-400 text-xs sm:text-sm font-bold">
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <span className="hidden sm:inline">오답</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation & Next Button Drawer when Answer is Confirmed */}
      {isConfirmed && (
        <div className="mt-3 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Result Alert Header */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isUserCorrect
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isUserCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-sm font-bold">
                {isUserCorrect
                  ? '정답입니다! 훌륭한 과학적 추론이에요 👏'
                  : `아쉽네요! 정답은 ${question.correctAnswer + 1}번입니다.`}
              </span>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-900/80 font-semibold border border-slate-700 text-slate-300">
              정답: {question.correctAnswer + 1}번 ({question.options[question.correctAnswer]})
            </span>
          </div>

          {/* Detailed Explanation */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              정답 상세 해설
            </div>
            <p className="leading-relaxed pl-1 text-slate-200">
              {question.explanation}
            </p>

            {/* Key Concept Tip */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-indigo-300">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="text-amber-400 font-semibold mr-1">핵심 개념 요약:</strong>
                {question.keyConcept}
              </div>
            </div>
          </div>

          {/* Advance Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-2 rounded-xl w-full sm:w-auto">
              <span className="text-lg">✊</span>
              <div>
                <strong className="text-amber-200 block">제스처로 넘어가기</strong>
                <span className="text-[11px] text-amber-300/80">
                  주먹을 1.2초간 쥐면 다음 문제로 이동합니다.
                </span>
              </div>
            </div>

            <button
              onClick={onNextQuestion}
              className={`relative overflow-hidden w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer border ${
                isHoldingFist
                  ? 'bg-amber-600 border-amber-400 text-white shadow-amber-500/30 ring-2 ring-amber-400/50'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 border-indigo-400/30 text-white shadow-indigo-500/25'
              }`}
            >
              {/* Fist Progress Bar on Next Button */}
              {isHoldingFist && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-75 pointer-events-none"
                  style={{ width: `${Math.min(100, fistProgress * 100)}%` }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                {isHoldingFist ? (
                  <>
                    <span>✊ 다음 문제로 이동 중... ({Math.round(fistProgress * 100)}%)</span>
                  </>
                ) : (
                  <>
                    <span>{isLastQuestion ? '최종 결과 확인하기' : '다음 문제로 이동'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
