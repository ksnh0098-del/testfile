import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SCIENCE_QUESTIONS } from './data/scienceQuestions';
import { UserAnswer } from './types/quiz';
import { FingerDetectionResult } from './utils/handGesture';
import { soundManager } from './utils/soundEffects';
import { Header } from './components/Header';
import { WebcamHandTracker } from './components/WebcamHandTracker';
import { QuizCard } from './components/QuizCard';
import { ResultModal } from './components/ResultModal';
import { GestureGuideBanner } from './components/GestureGuideBanner';

const HOLD_REQUIRED_MS = 1500; // 1.5 seconds hold to confirm choice
const FIST_HOLD_REQUIRED_MS = 1200; // 1.2 seconds hold for fist to advance
const GRACE_PERIOD_MS = 200; // brief grace period for tracking jitter

export default function App() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Gesture hold state for choice
  const [activeGestureChoice, setActiveGestureChoice] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  // Gesture hold state for fist (next question)
  const [fistProgress, setFistProgress] = useState<number>(0);
  const [isHoldingFist, setIsHoldingFist] = useState<boolean>(false);

  // App settings
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Tracking refs for timing
  const holdStartRef = useRef<number | null>(null);
  const currentTargetRef = useRef<number | null>(null);
  const lastDetectedTimeRef = useRef<number>(0);

  const fistHoldStartRef = useRef<number | null>(null);
  const lastFistDetectedTimeRef = useRef<number>(0);

  const questionStartTimeRef = useRef<number>(Date.now());

  const currentQuestion = SCIENCE_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === SCIENCE_QUESTIONS.length - 1;

  // Reset timer on question change
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setSelectedOption(null);
    setIsConfirmed(false);
    setActiveGestureChoice(null);
    setHoldProgress(0);
    setFistProgress(0);
    setIsHoldingFist(false);
    holdStartRef.current = null;
    currentTargetRef.current = null;
    fistHoldStartRef.current = null;
  }, [currentIndex]);

  // Move to next question or complete quiz
  const handleNextQuestion = useCallback(() => {
    fistHoldStartRef.current = null;
    setFistProgress(0);
    setIsHoldingFist(false);

    if (currentIndex >= SCIENCE_QUESTIONS.length - 1) {
      setShowResults(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex]);

  // Handle confirming an answer (via gesture 1.5s or direct mouse click)
  const confirmAnswer = useCallback(
    (optionIndex: number, confirmedBy: 'gesture' | 'click') => {
      if (isConfirmed) return;

      setSelectedOption(optionIndex);
      setIsConfirmed(true);
      setActiveGestureChoice(null);
      setHoldProgress(0);
      holdStartRef.current = null;
      currentTargetRef.current = null;

      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      if (isCorrect) {
        soundManager.playCorrect();
      } else {
        soundManager.playIncorrect();
      }

      const timeSpent = Date.now() - questionStartTimeRef.current;
      setUserAnswers((prev) => [
        ...prev.filter((a) => a.questionId !== currentQuestion.id),
        {
          questionId: currentQuestion.id,
          selectedOption: optionIndex,
          isCorrect,
          timeSpentMs: timeSpent,
          confirmedBy,
        },
      ]);
    },
    [isConfirmed, currentQuestion]
  );

  // Hand gesture callback from WebcamHandTracker
  const handleGestureDetected = useCallback(
    (detection: FingerDetectionResult) => {
      const now = performance.now();

      // If already confirmed: check for FIST (주먹 ✊) to advance to next question!
      if (isConfirmed) {
        if (detection.hasHand && detection.isFist) {
          lastFistDetectedTimeRef.current = now;

          if (!fistHoldStartRef.current) {
            fistHoldStartRef.current = now;
          }

          const elapsed = now - fistHoldStartRef.current;
          const progress = Math.min(1, elapsed / FIST_HOLD_REQUIRED_MS);
          setFistProgress(progress);
          setIsHoldingFist(true);

          // Subtle audio ticking while holding fist
          soundManager.playHoldTick();

          // If held for 1.2 seconds, advance to next question!
          if (elapsed >= FIST_HOLD_REQUIRED_MS) {
            fistHoldStartRef.current = null;
            setFistProgress(0);
            setIsHoldingFist(false);
            handleNextQuestion();
          }
        } else {
          // Hand not detected as fist
          const timeSinceFist = now - lastFistDetectedTimeRef.current;
          if (timeSinceFist > GRACE_PERIOD_MS) {
            fistHoldStartRef.current = null;
            setFistProgress(0);
            setIsHoldingFist(false);
          }
        }
        return;
      }

      // Not confirmed yet: check 1~4 finger count to select option
      const target = detection.targetChoice; // 0, 1, 2, 3 for fingers 1, 2, 3, 4

      if (target !== null && detection.hasHand) {
        lastDetectedTimeRef.current = now;

        if (currentTargetRef.current === target) {
          // Continuing hold on the same choice
          if (!holdStartRef.current) {
            holdStartRef.current = now;
          }

          const elapsed = now - holdStartRef.current;
          const progress = Math.min(1, elapsed / HOLD_REQUIRED_MS);
          setHoldProgress(progress);
          setActiveGestureChoice(target);

          // Subtle audio ticking while holding
          soundManager.playHoldTick();

          // Check if 1.5s has elapsed!
          if (elapsed >= HOLD_REQUIRED_MS) {
            confirmAnswer(target, 'gesture');
          }
        } else {
          // Switched to a new finger count: restart hold timer
          currentTargetRef.current = target;
          holdStartRef.current = now;
          setActiveGestureChoice(target);
          setHoldProgress(0);
        }
      } else {
        // No valid 1~4 finger choice detected
        // Allow grace period for quick jitter
        const timeSinceLast = now - lastDetectedTimeRef.current;
        if (timeSinceLast > GRACE_PERIOD_MS) {
          currentTargetRef.current = null;
          holdStartRef.current = null;
          setActiveGestureChoice(null);
          setHoldProgress(0);
        }
      }
    },
    [isConfirmed, confirmAnswer, handleNextQuestion]
  );

  // Handle direct mouse click selection
  const handleSelectOption = (optionIndex: number, confirmedBy: 'click' | 'gesture') => {
    confirmAnswer(optionIndex, confirmedBy);
  };

  // Restart quiz from beginning
  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setIsConfirmed(false);
    setShowResults(false);
    setActiveGestureChoice(null);
    setHoldProgress(0);
    setFistProgress(0);
    setIsHoldingFist(false);
    holdStartRef.current = null;
    currentTargetRef.current = null;
    fistHoldStartRef.current = null;
  };

  // Current score count
  const score = userAnswers.filter((a) => a.isCorrect).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* Top App Header with Stats, Camera & Mute Controls */}
      <div>
        <Header
          currentIndex={currentIndex}
          totalQuestions={SCIENCE_QUESTIONS.length}
          score={score}
          cameraActive={isCameraActive}
          onToggleCamera={() => setIsCameraActive((prev) => !prev)}
          onRestart={handleRestartQuiz}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted((prev) => !prev)}
        />

        {/* Quick Instructions & Privacy Banner */}
        <GestureGuideBanner />

        {/* Main Quiz & Tracker: Side-by-Side balanced 50:50 grid */}
        <main className="max-w-7xl mx-auto px-4 py-5 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left Column: My Webcam Screen & MediaPipe Gesture HUD */}
            <div className="flex flex-col h-full min-h-[480px]">
              <WebcamHandTracker
                onGestureDetected={handleGestureDetected}
                holdProgress={holdProgress}
                selectedChoice={activeGestureChoice}
                isHolding={activeGestureChoice !== null && holdProgress > 0}
                isConfirmed={isConfirmed}
                isCameraActive={isCameraActive}
                onToggleCamera={() => setIsCameraActive((prev) => !prev)}
                fistProgress={fistProgress}
                isHoldingFist={isHoldingFist}
              />
            </div>

            {/* Right Column: Quiz Question Card & Choices & Explanations */}
            <div className="flex flex-col h-full min-h-[480px]">
              <QuizCard
                question={currentQuestion}
                selectedOption={selectedOption}
                isConfirmed={isConfirmed}
                activeGestureOption={activeGestureChoice}
                holdProgress={holdProgress}
                onSelectOption={handleSelectOption}
                onNextQuestion={handleNextQuestion}
                isLastQuestion={isLastQuestion}
                isHoldingFist={isHoldingFist}
                fistProgress={fistProgress}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            중학교 과학 4지선다 제스처 퀴즈 • Google MediaPipe Hand Landmarker 브라우저 온디바이스
          </span>
          <span className="text-slate-400">
            손가락 1~4개 1.5초 유지 확정 | 마우스 클릭 대체 지원
          </span>
        </div>
      </footer>

      {/* Results & Review Modal */}
      {showResults && (
        <ResultModal
          questions={SCIENCE_QUESTIONS}
          userAnswers={userAnswers}
          onRestart={handleRestartQuiz}
        />
      )}
    </div>
  );
}
