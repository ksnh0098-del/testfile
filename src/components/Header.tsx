import React from 'react';
import { ShieldCheck, Volume2, VolumeX, RotateCcw, Atom, Camera } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface HeaderProps {
  currentIndex: number;
  totalQuestions: number;
  score: number;
  cameraActive: boolean;
  onToggleCamera: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentIndex,
  totalQuestions,
  score,
  cameraActive,
  onToggleCamera,
  onRestart,
  isMuted,
  onToggleMute,
}) => {
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Atom className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                중학 과학 제스처 퀴즈
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MediaPipe AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              손가락 1~4개 1.5초 유지 또는 마우스 클릭으로 풀이
            </p>
          </div>
        </div>

        {/* Privacy Shield Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">100% 온디바이스 로컬 처리</span>
          <span className="text-emerald-400/70 text-[11px]">(영상 서버 미전송)</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Camera toggle */}
          <button
            onClick={onToggleCamera}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              cameraActive
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={cameraActive ? '웹캠 일시 정지' : '웹캠 켜기'}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{cameraActive ? '카메라 ON' : '카메라 OFF'}</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              onToggleMute();
              soundManager.setMuted(!isMuted);
            }}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition text-xs font-medium"
            title="퀴즈 다시 시작"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">다시 시작</span>
          </button>

          {/* Score Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs font-bold">
            <span>정답</span>
            <span className="text-cyan-400 font-extrabold text-sm">{score}</span>
            <span className="text-indigo-400">/ {totalQuestions}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-7xl mx-auto mt-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>
            진행 상황: <strong className="text-white">{currentIndex + 1}</strong> / {totalQuestions} 문제
          </span>
          <span className="font-semibold text-cyan-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
};
