import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, AlertTriangle, ShieldCheck, RefreshCw, Hand, MousePointer } from 'lucide-react';
import { analyzeHandGestures, drawHandOverlay, FingerDetectionResult } from '../utils/handGesture';

interface WebcamHandTrackerProps {
  onGestureDetected: (detection: FingerDetectionResult) => void;
  holdProgress: number; // 0 to 1 (0% to 100%)
  selectedChoice: number | null; // 0, 1, 2, 3
  isHolding: boolean;
  isConfirmed: boolean;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  fistProgress?: number; // 0 to 1 for next question hold
  isHoldingFist?: boolean;
}

export const WebcamHandTracker: React.FC<WebcamHandTrackerProps> = ({
  onGestureDetected,
  holdProgress,
  selectedChoice,
  isHolding,
  isConfirmed,
  isCameraActive,
  onToggleCamera,
  fistProgress = 0,
  isHoldingFist = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentDetection, setCurrentDetection] = useState<FingerDetectionResult>({
    hasHand: false,
    fingerCount: 0,
    extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
    targetChoice: null,
    handCenter: null,
    isFist: false,
  });

  // 1. Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    const initMediaPipe = async () => {
      try {
        setIsLoadingModel(true);
        setModelError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        if (isCancelled) return;
        landmarkerRef.current = handLandmarker;
        setIsLoadingModel(false);
      } catch (err: unknown) {
        console.warn('GPU delegate failed or initial load error, attempting CPU fallback...', err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          if (isCancelled) return;
          const fallbackLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.5,
          });
          if (isCancelled) return;
          landmarkerRef.current = fallbackLandmarker;
          setIsLoadingModel(false);
        } catch (fallbackErr: unknown) {
          console.error('Failed to load MediaPipe model:', fallbackErr);
          if (!isCancelled) {
            setModelError('제스처 인식 모델을 불러오지 못했습니다. 마우스 클릭으로 퀴즈를 진행해주세요.');
            setIsLoadingModel(false);
          }
        }
      }
    };

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // 2. Start / Stop Camera Stream
  const stopCameraStream = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);

    if (!isCameraActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Camera stream error:', err);
      const errorObj = err as { name?: string; message?: string };
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setCameraError('카메라 권한이 차단되었습니다. 주소창 좌측 사이트 설정에서 카메라를 허용하거나, 마우스 클릭으로 문제를 풀어주세요.');
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        setCameraError('연결된 웹캠 카메라를 찾을 수 없습니다. 마우스 클릭으로 퀴즈를 즐기실 수 있습니다.');
      } else {
        setCameraError('카메라를 실행할 수 없습니다. 마우스 클릭 대체 수단으로 진행해주세요.');
      }
    }
  }, [isCameraActive, stopCameraStream]);

  useEffect(() => {
    startCameraStream();
    return () => {
      stopCameraStream();
    };
  }, [startCameraStream, stopCameraStream]);

  // 3. Vision Detection Loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (
      video &&
      canvas &&
      landmarker &&
      video.readyState >= 2 &&
      !video.paused &&
      !video.ended
    ) {
      // Sync canvas dimensions with video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const startTimeMs = performance.now();
      try {
        const results = landmarker.detectForVideo(video, startTimeMs);
        const ctx = canvas.getContext('2d');

        if (ctx) {
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const detection = analyzeHandGestures(landmarks);
            setCurrentDetection(detection);
            onGestureDetected(detection);

            drawHandOverlay(ctx, landmarks, canvas.width, canvas.height, detection);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const emptyDetection: FingerDetectionResult = {
              hasHand: false,
              fingerCount: 0,
              extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
              targetChoice: null,
              handCenter: null,
              isFist: false,
            };
            setCurrentDetection(emptyDetection);
            onGestureDetected(emptyDetection);
          }
        }
      } catch (detectErr) {
        // Frame dropped or busy
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [onGestureDetected]);

  useEffect(() => {
    if (isCameraActive && !cameraError && !isLoadingModel) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isCameraActive, cameraError, isLoadingModel, processFrame]);

  // Hold progress calculation (percentage & remaining seconds)
  const remainingSeconds = Math.max(0, (1.5 * (1 - holdProgress))).toFixed(1);
  const progressPercent = Math.min(100, Math.round(holdProgress * 100));

  const fistRemainingSeconds = Math.max(0, (1.2 * (1 - fistProgress))).toFixed(1);
  const fistProgressPercent = Math.min(100, Math.round(fistProgress * 100));

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between h-full gap-3">
      {/* Tracker Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-cyan-400" />
            내 웹캠 화면 & 모션 인식 HUD
          </h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
          {isConfirmed ? '✊ 주먹 = 다음 문제' : '손가락 1~4개 = 답안 선택'}
        </span>
      </div>

      {/* Main Viewport Container */}
      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center flex-1 min-h-[260px] sm:min-h-[320px]">
        {/* Loading Spinner */}
        {isLoadingModel && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <p className="text-sm font-semibold text-slate-200">MediaPipe AI 모델 준비 중...</p>
            <p className="text-xs text-slate-400 mt-1">로컬 WebAssembly 비전 엔진을 불러오고 있습니다.</p>
          </div>
        )}

        {/* Model Load Error */}
        {modelError && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-slate-200">{modelError}</p>
            <p className="text-xs text-slate-400 mt-2">
              우측 보기에 있는 선택지를 마우스로 직접 클릭하여 문제를 푸실 수 있습니다.
            </p>
          </div>
        )}

        {/* Camera Permission or Device Error Fallback */}
        {cameraError && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3">
              <CameraOff className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-100 mb-1">카메라 연결 안내</h4>
            <p className="text-xs text-slate-300 mb-4 max-w-xs leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={startCameraStream}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                카메라 다시 시도
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
                마우스 클릭 풀이 가능
              </div>
            </div>
          </div>
        )}

        {/* Camera Off State */}
        {!isCameraActive && !cameraError && (
          <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <CameraOff className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">웹캠이 꺼져 있습니다.</p>
            <p className="text-xs text-slate-500 mt-1 mb-3">마우스로 정답을 클릭하거나 카메라를 켜세요.</p>
            <button
              onClick={onToggleCamera}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              웹캠 켜기
            </button>
          </div>
        )}

        {/* Video Element (mirrored for natural gesture experience) */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            !isCameraActive || cameraError ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Overlay Canvas (mirrored to align perfectly with mirrored video) */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100 ${
            !isCameraActive || cameraError ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* HUD: Real-time Gesture State Overlay */}
        {isCameraActive && !cameraError && !isLoadingModel && (
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs shadow-md">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentDetection.hasHand ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-200 font-medium">
                {currentDetection.hasHand
                  ? currentDetection.isFist
                    ? '주먹(✊) 감지됨'
                    : `손 감지됨 (${currentDetection.fingerCount}손가락)`
                  : '카메라에 손을 보여주세요'}
              </span>
            </div>

            {currentDetection.hasHand && currentDetection.targetChoice !== null && !isConfirmed && (
              <div className="bg-indigo-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-indigo-500/50 text-indigo-200 text-xs font-bold animate-pulse shadow-md">
                👉 {currentDetection.targetChoice + 1}번 선택 중
              </div>
            )}

            {isConfirmed && currentDetection.hasHand && currentDetection.isFist && (
              <div className="bg-amber-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-amber-500/50 text-amber-200 text-xs font-bold animate-pulse shadow-md">
                ✊ 다음 문제로 이동 중...
              </div>
            )}
          </div>
        )}

        {/* HUD: Choice Selection Hold Timer Ring */}
        {isHolding && selectedChoice !== null && !isConfirmed && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-indigo-950/30 backdrop-blur-[1px]">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Radial Progress Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800/80"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 * (1 - holdProgress)}
                  strokeLinecap="round"
                  className="text-cyan-400 transition-all duration-75"
                />
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {selectedChoice + 1}번
                </span>
                <span className="text-[11px] font-bold text-cyan-300">
                  {remainingSeconds}초
                </span>
              </div>
            </div>

            <span className="mt-2 text-xs font-semibold text-white bg-slate-900/90 px-3 py-1 rounded-full border border-cyan-400/40 shadow-lg animate-bounce">
              1.5초 유지 시 정답 확정! ({progressPercent}%)
            </span>
          </div>
        )}

        {/* HUD: Fist Next Question Progress Ring */}
        {isConfirmed && isHoldingFist && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-amber-950/40 backdrop-blur-[1px] animate-in fade-in duration-100">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Radial Progress Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800/80"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 * (1 - fistProgress)}
                  strokeLinecap="round"
                  className="text-amber-400 transition-all duration-75"
                />
              </svg>

              {/* Center Fist Icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl filter drop-shadow-md animate-pulse">
                  ✊
                </span>
                <span className="text-[11px] font-bold text-amber-300">
                  {fistRemainingSeconds}초
                </span>
              </div>
            </div>

            <span className="mt-2 text-xs font-bold text-amber-200 bg-slate-900/95 px-3.5 py-1 rounded-full border border-amber-400/50 shadow-xl">
              ✊ 주먹 유지: 다음 문제로 이동 ({fistProgressPercent}%)
            </span>
          </div>
        )}

        {/* Answer Confirmed Flash Overlay & Fist Guidance */}
        {isConfirmed && !isHoldingFist && (
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none space-y-1.5">
            <div className="bg-amber-950/90 border border-amber-500/70 rounded-xl px-3 py-2 text-center text-amber-200 text-xs font-bold shadow-lg flex items-center justify-center gap-2 animate-bounce">
              <span className="text-base">✊</span>
              <span>주먹을 쥐면 다음 문제로 넘어갑니다!</span>
            </div>
            <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-xl px-3 py-1.5 text-center text-emerald-200 text-[11px] font-medium shadow-md flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              답안 확정 완료 • 우측 해설을 확인하세요
            </div>
          </div>
        )}
      </div>

      {/* Gesture Quick Guide Chips */}
      {isConfirmed ? (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">✊</span>
            <div>
              <strong className="text-amber-300 font-bold block">다음 문제 제스처: 주먹 쥐기</strong>
              <span className="text-[11px] text-amber-200/80">카메라를 향해 주먹을 쥐고 1.2초간 유지하세요.</span>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
            주먹 ✊ 인식
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
          {[
            { num: 1, label: '검지 (1개)', icon: '☝' },
            { num: 2, label: 'V사인 (2개)', icon: '✌' },
            { num: 3, label: '3손가락', icon: '🤟' },
            { num: 4, label: '4손가락', icon: '🖖' },
          ].map((item, idx) => {
            const isActive = currentDetection.targetChoice === idx && currentDetection.hasHand;
            return (
              <div
                key={item.num}
                className={`p-1.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold scale-105'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-sm">{item.icon}</div>
                <div className="text-[10px] text-slate-300 font-semibold">{item.num}번</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Guarantee Note */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong className="text-emerald-300 font-semibold">100% 로컬 보안:</strong> 웹캠 영상은 브라우저 내에서만 MediaPipe WebAssembly로 실시간 처리되며 외부 서버로 전송되지 않습니다.
        </p>
      </div>
    </div>
  );
};
