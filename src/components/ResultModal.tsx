import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, CheckCircle2, XCircle, Award, ChevronDown, ChevronUp, Sparkles, Hand, MousePointer } from 'lucide-react';
import { QuizQuestion, UserAnswer, ScienceDomain } from '../types/quiz';
import { soundManager } from '../utils/soundEffects';

interface ResultModalProps {
  questions: QuizQuestion[];
  userAnswers: UserAnswer[];
  onRestart: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  questions,
  userAnswers,
  onRestart,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'wrong'>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const totalQuestions = questions.length;
  const correctCount = userAnswers.filter((a) => a.isCorrect).length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // Domain breakdown
  const domainStats: Record<ScienceDomain, { correct: number; total: number }> = {
    물리: { correct: 0, total: 0 },
    화학: { correct: 0, total: 0 },
    생명과학: { correct: 0, total: 0 },
    지구과학: { correct: 0, total: 0 },
  };

  questions.forEach((q) => {
    const answer = userAnswers.find((a) => a.questionId === q.id);
    domainStats[q.domain].total += 1;
    if (answer?.isCorrect) {
      domainStats[q.domain].correct += 1;
    }
  });

  useEffect(() => {
    // Play completion sound and launch confetti
    soundManager.playComplete();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  }, []);

  let evaluationTitle = '🔬 호기심 가득한 과학 탐험가!';
  let evaluationMsg = '기초 과학 개념을 천천히 복습해보면 더 멋진 과학 실력을 쌓을 수 있어요.';

  if (correctCount === 10) {
    evaluationTitle = '🏆 최우수 과학 마스터! (만점)';
    evaluationMsg = '중학교 과학의 물리, 화학, 생물, 지구과학 전 영역을 완벽하게 마스터하셨습니다!';
  } else if (correctCount >= 8) {
    evaluationTitle = '🌟 우수 과학 탐구자!';
    evaluationMsg = '핵심 과학 개념이 아주 탄탄합니다. 상위권 과학 실력을 입증하셨어요!';
  } else if (correctCount >= 6) {
    evaluationTitle = '🌱 성장하는 과학 꿈나무!';
    evaluationMsg = '어려운 과학 문제들도 훌륭하게 해결했습니다. 틀린 문제 해설을 확인해보세요.';
  }

  const displayedQuestions = questions.filter((q) => {
    if (filterType === 'wrong') {
      const ans = userAnswers.find((a) => a.questionId === q.id);
      return !ans?.isCorrect;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-auto p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header Hero Banner */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3 text-white">
            <Trophy className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            10문제 퀴즈 탐구 완료
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {evaluationTitle}
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-md">
            {evaluationMsg}
          </p>

          {/* Big Score Card */}
          <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-md">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block font-medium">최종 점수</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                {scorePercent}점
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block font-medium">정답 수</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {correctCount}
                <span className="text-sm font-normal text-slate-400"> / {totalQuestions}</span>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block font-medium">정답률</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-400">
                {scorePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Science Domain Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            과학 영역별 정답 성취도 분석
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(domainStats) as ScienceDomain[]).map((domain) => {
              const stat = domainStats[domain];
              const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
              return (
                <div key={domain} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{domain}</span>
                    <span className="text-slate-400 font-mono">
                      {stat.correct}/{stat.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-cyan-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block text-right font-medium">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review & Answers List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>문제별 복습 & 해설 확인</span>
              <span className="text-xs font-normal text-slate-400">
                ({questions.length}문항)
              </span>
            </h3>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                전체 보기 ({questions.length})
              </button>
              <button
                onClick={() => setFilterType('wrong')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterType === 'wrong'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                오답만 ({totalQuestions - correctCount})
              </button>
            </div>
          </div>

          {displayedQuestions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
              오답이 없습니다! 모든 문제를 맞히셨습니다 🎉
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {displayedQuestions.map((q) => {
                const answer = userAnswers.find((a) => a.questionId === q.id);
                const isCorrect = answer?.isCorrect ?? false;
                const isExpanded = expandedIndex === q.id;

                return (
                  <div
                    key={q.id}
                    className="rounded-xl bg-slate-950/70 border border-slate-800/80 overflow-hidden text-xs transition"
                  >
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : q.id)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900/60 transition gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-200 truncate">
                          Q{q.id}. {q.question}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {q.domain}
                        </span>

                        {answer && (
                          <span
                            className="text-[11px] text-slate-400 flex items-center gap-1"
                            title={`선택 방식: ${answer.confirmedBy === 'gesture' ? '손가락 제스처' : '마우스 클릭'}`}
                          >
                            {answer.confirmedBy === 'gesture' ? (
                              <Hand className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <MousePointer className="w-3 h-3 text-slate-400" />
                            )}
                            <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                              {answer.selectedOption + 1}번 선택
                            </span>
                          </span>
                        )}

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2 text-slate-300">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-semibold">
                            정답: {q.correctAnswer + 1}번 ({q.options[q.correctAnswer]})
                          </span>
                          {answer && answer.selectedOption !== q.correctAnswer && (
                            <span className="text-rose-400">
                              내 답: {answer.selectedOption + 1}번 ({q.options[answer.selectedOption]})
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed text-slate-300">
                          {q.explanation}
                        </p>
                        <p className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                          💡 <strong>핵심 개념:</strong> {q.keyConcept}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>퀴즈 다시 풀기 (처음부터)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
