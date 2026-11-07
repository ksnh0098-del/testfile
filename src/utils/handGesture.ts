export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FingerDetectionResult {
  hasHand: boolean;
  fingerCount: number; // 0 to 5
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  targetChoice: number | null; // 0, 1, 2, 3 (corresponding to 1, 2, 3, 4 fingers), or null
  handCenter: { x: number; y: number } | null;
  isFist: boolean; // all 4 fingers folded into a fist (count 0 or thumb tucked)
}

// MediaPipe hand connection pairs for visualization
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
];

/**
 * Analyzes normalized 21 hand landmarks to detect extended fingers
 */
export function analyzeHandGestures(landmarks: HandLandmark[] | undefined): FingerDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      hasHand: false,
      fingerCount: 0,
      extendedFingers: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      targetChoice: null,
      handCenter: null,
      isFist: false,
    };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  // Helper to check 4 main fingers: tip distance to wrist vs pip distance to wrist
  const isExtended = (
    tip: HandLandmark,
    pip: HandLandmark,
    mcp: HandLandmark
  ): boolean => {
    const distTipWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const distPipWrist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
    const distTipMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
    const distPipMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);

    // Finger is straight/extended if tip is significantly farther from wrist & MCP than PIP is
    return distTipWrist > distPipWrist * 1.12 && distTipMcp > distPipMcp * 1.15;
  };

  const isIndex = isExtended(indexTip, indexPip, indexMcp);
  const isMiddle = isExtended(middleTip, middlePip, middleMcp);
  const isRing = isExtended(ringTip, ringPip, ringMcp);
  const isPinky = isExtended(pinkyTip, pinkyPip, pinkyMcp);

  // Thumb check: distance from thumb tip to pinky MCP compared to thumb IP to pinky MCP,
  // and distance from thumb tip to index MCP (not tucked into palm)
  const distThumbTipPinkyMcp = Math.hypot(thumbTip.x - pinkyMcp.x, thumbTip.y - pinkyMcp.y);
  const distThumbIpPinkyMcp = Math.hypot(thumbIp.x - pinkyMcp.x, thumbIp.y - pinkyMcp.y);
  const distThumbTipIndexMcp = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y);
  const distThumbTipMcp = Math.hypot(thumbTip.x - thumbMcp.x, thumbTip.y - thumbMcp.y);

  const isThumb = distThumbTipPinkyMcp > distThumbIpPinkyMcp * 1.15 &&
                  distThumbTipIndexMcp > 0.08 &&
                  distThumbTipMcp > 0.07;

  let count = 0;
  if (isThumb) count++;
  if (isIndex) count++;
  if (isMiddle) count++;
  if (isRing) count++;
  if (isPinky) count++;

  let targetChoice: number | null = null;
  if (count >= 1 && count <= 4) {
    targetChoice = count - 1; // 1->0, 2->1, 3->2, 4->3
  }

  // Fist detection: all 4 main fingers folded
  const isFist = !isIndex && !isMiddle && !isRing && !isPinky;

  // Calculate approximate center of palm
  const handCenter = {
    x: (wrist.x + indexMcp.x + middleMcp.x + pinkyMcp.x) / 4,
    y: (wrist.y + indexMcp.y + middleMcp.y + pinkyMcp.y) / 4,
  };

  return {
    hasHand: true,
    fingerCount: count,
    extendedFingers: {
      thumb: isThumb,
      index: isIndex,
      middle: isMiddle,
      ring: isRing,
      pinky: isPinky
    },
    targetChoice,
    handCenter,
    isFist,
  };
}

/**
 * Draws hand landmarks and connections with neon glowing theme
 */
export function drawHandOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  width: number,
  height: number,
  detection: FingerDetectionResult
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Draw connections (skeleton lines)
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'; // sky-400 with glow
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    if (!p1 || !p2) continue;

    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }

  // Draw joints
  const tipIndices = [4, 8, 12, 16, 20];
  const tipsExtended = [
    detection.extendedFingers.thumb,
    detection.extendedFingers.index,
    detection.extendedFingers.middle,
    detection.extendedFingers.ring,
    detection.extendedFingers.pinky
  ];

  landmarks.forEach((pt, idx) => {
    const x = pt.x * width;
    const y = pt.y * height;
    const isTip = tipIndices.indexOf(idx);

    ctx.beginPath();
    if (isTip !== -1 && tipsExtended[isTip]) {
      // Extended tip - vibrant neon green glow
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      // Normal joint
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 4;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  });

  ctx.restore();
}
