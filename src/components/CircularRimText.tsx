import { useId } from "react";
import { createArcPath, rimTextGeometry, RIM_VIEWBOX_SIZE } from "../catalog/rimGeometry";

interface CircularRimTextProps { text: string }

export function CircularRimText({ text }: CircularRimTextProps) {
  const pathId = `rim-text-${useId().replace(/:/g, "")}`;
  if (!text.trim()) return null;
  const fontSize = text.length > 20 ? 34 : text.length > 15 ? 38 : rimTextGeometry.fontSize;
  return (
    <svg viewBox={`0 0 ${RIM_VIEWBOX_SIZE} ${RIM_VIEWBOX_SIZE}`} className="pointer-events-none absolute inset-0 z-40 h-full w-full" aria-hidden="true">
      <defs><path id={pathId} d={createArcPath(rimTextGeometry)} fill="none" /></defs>
      <text fill="#2d2d2a" stroke="#b8ae9d" strokeWidth="0.8" paintOrder="stroke" fontFamily="Georgia, 'Times New Roman', serif" fontSize={fontSize} fontWeight="700" letterSpacing="1.5">
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">{text}</textPath>
      </text>
    </svg>
  );
}
