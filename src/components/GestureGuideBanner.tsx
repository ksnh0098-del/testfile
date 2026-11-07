import React, { useState } from 'react';
import { HelpCircle, ChevronRight, X, ShieldCheck, Sparkles, MousePointer } from 'lucide-react';

export const GestureGuideBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Small informative bar above the main layout */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>
              <strong className="text-white">제스처 방법:</strong> 손가락 1~4개(1.5초)로 답안 선택 후, <strong className="text-amber-300">주먹(✊ 1.2초)</strong>을 쥐면 다음 문제로 넘어갑니다!
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>사용 가이드 & 개인정보 안내</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">제스처 퀴즈 이용 가이드</h3>
                <p className="text-xs text-slate-400">손가락과 주먹 모션으로 푸는 스마트 과학 퀴즈</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  손가락 개수로 보기 선택 (1~4번)
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-base block">☝</span>
                    <strong className="text-cyan-400">1번</strong>
                    <span className="text-[10px] text-slate-400 block">검지 1개</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-base block">✌</span>
                    <strong className="text-cyan-400">2번</strong>
                    <span className="text-[10px] text-slate-400 block">V사인 2개</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-base block">🤟</span>
                    <strong className="text-cyan-400">3번</strong>
                    <span className="text-[10px] text-slate-400 block">손가락 3개</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-base block">🖖</span>
                    <strong className="text-cyan-400">4번</strong>
                    <span className="text-[10px] text-slate-400 block">손가락 4개</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  1.5초간 유지하면 답안 확정!
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  원하는 번호의 손가락을 펼치면 원형 카운트다운 게이지가 차오르며, <strong>1.5초간 유지</strong>하면 답안이 확정되고 정답 및 상세 해설이 나타납니다.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-1.5 text-amber-200">
                <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  주먹(✊)을 쥐면 다음 문제로 이동!
                </h4>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  정답과 해설을 확인한 후, 카메라를 향해 <strong>주먹을 1.2초간 쥐면</strong> 자동으로 다음 문제로 이동합니다. 마우스 없이 제스처만으로 연속 풀이가 가능합니다!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <MousePointer className="w-4 h-4 text-cyan-400" />
                  카메라가 없거나 손 인식이 불편할 땐 마우스 클릭!
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  카메라 권한을 허용하지 않았거나 조명이 어두운 경우에도 문제 보기나 다음 버튼을 마우스로 직접 클릭하여 언제든지 풀 수 있습니다.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  개인정보 안심 보호 (영상 외부 전송 없음)
                </div>
                <p className="text-xs leading-relaxed text-emerald-200/90">
                  웹캠으로 캡처된 영상은 Google MediaPipe WebAssembly 기술을 통해 오직 귀하의 <strong>브라우저 메모리 안에서만 실시간 분석</strong>됩니다. 어떠한 영상도 외부 서버나 클라우드로 전송되거나 저장되지 않으므로 안심하고 이용하세요.
                </p>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
