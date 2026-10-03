import { useState, type CSSProperties } from "react";
import type { WheelAppearance } from "../features/wheel/types";
import { choiceColors, labelColor, validGifURL } from "../features/wheel/appearance";
import { PICKLAH_EMOJI } from "./ChoiceIcon";

type WheelVisualProps = {
  options: string[];
  appearances: WheelAppearance[];
  rotation: number;
  winnerIndex: number | null;
  spinning: boolean;
  onSpinEnd: () => void;
};

function point(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function sectorPath(index: number, count: number, radius: number) {
  const cx = 300;
  const cy = 300;
  const angle = 360 / count;
  if (count === 1) return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`;
  const start = point(cx, cy, radius, -90 + index * angle);
  const end = point(cx, cy, radius, -90 + (index + 1) * angle);
  const largeArc = angle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function WheelIcon({ appearance, x, y, fontSize }: { appearance: WheelAppearance; x: number; y: number; fontSize: number }) {
  const [failedURL, setFailedURL] = useState("");
  if (appearance.gifUrl && validGifURL(appearance.gifUrl) && failedURL !== appearance.gifUrl) {
    return <image className="wheel-gif" href={appearance.gifUrl} x={x - 20} y={y - fontSize - 32} width="40" height="40" preserveAspectRatio="xMidYMid meet" onError={() => setFailedURL(appearance.gifUrl)} />;
  }
  return appearance.emoji ? <text x={x} y={y - fontSize} textAnchor="middle" fontSize={Math.min(fontSize * 1.35, 26)}>{appearance.emoji}</text>
    : <image href={PICKLAH_EMOJI} x={x - 18} y={y - fontSize - 28} width="36" height="36" />;
}

export function WheelVisual({ options, appearances, rotation, winnerIndex, spinning, onSpinEnd }: WheelVisualProps) {
  const count = Math.max(options.length, 1);
  const segmentAngle = 360 / count;
  const fontSize = Math.max(10, Math.min(26, segmentAngle * 0.4));
  const labelRadius = count > 14 ? 0 : 174;

  return (
    <div className="wheel-stage" aria-label={spinning ? "Wheel is spinning" : "Wheel of choices"}>
      <span className="wheel-pointer" aria-hidden="true" />
      <div className="wheel-rotation-frame">
      <svg
        className={"wheel-rotor" + (spinning ? " wheel-rotor-spinning" : "")}
        onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === "transform") onSpinEnd(); }}
        viewBox="0 0 600 600"
        style={{ "--wheel-rotation": `${rotation}deg` } as CSSProperties}
        aria-hidden="true"
      >
        <circle cx="300" cy="300" r="292" fill="#ffffff" />
        {options.length === 0 ? (
          <circle cx="300" cy="300" r="282" fill="#f1f1f1" />
        ) : options.map((option, index) => {
          const mid = -90 + (index + 0.5) * segmentAngle;
          const label = point(300, 300, labelRadius, mid);
          const visibleLabel = count <= 14;
          const appearance = appearances[index];
          const color = appearance?.color || choiceColors[index % choiceColors.length];
          return (
            <g key={index}>
              <path
                d={sectorPath(index, count, 282)}
                fill={color}
                stroke="#fff"
                strokeWidth={Math.min(winnerIndex === index ? 7 : 3, 100 / count)}
                className="wheel-slice"
              />
              {visibleLabel && (
                <>
                  <WheelIcon appearance={appearance} x={label.x} y={label.y} fontSize={fontSize} />
                  <text
                    x={label.x}
                    y={label.y + fontSize * 0.75}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight="800"
                    fill={labelColor(color)}
                    stroke={color}
                    strokeWidth="2.2"
                    paintOrder="stroke"
                  >
                    {option.length > 16 ? `${option.slice(0, 15)}…` : option}
                  </text>
                </>
              )}
            </g>
          );
        })}
        <circle cx="300" cy="300" r="38" fill="#fff" />
        <image href={PICKLAH_EMOJI} x="275" y="275" width="50" height="50" />
      </svg>
      </div>
      <span className="wheel-shadow" aria-hidden="true" />
    </div>
  );
}
