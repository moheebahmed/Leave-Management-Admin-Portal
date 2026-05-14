import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  if (score <= 4) return "text-danger";
  if (score <= 7) return "text-amber";
  return "text-emerald";
}

function strokeColor(score: number) {
  if (score <= 4) return "#ef4444";
  if (score <= 7) return "#f59e0b";
  return "#10b981";
}

type ScoreRingProps = {
  score: number;
  max?: number;
  size?: number;
  stroke?: number;
  className?: string;
};

/** Circular progress for 0–10 style scores (clamped). */
export function ScoreRing({ score, max = 10, size = 112, stroke = 8, className }: ScoreRingProps) {
  const pct = Math.min(1, Math.max(0, score / max));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - pct);
  const col = strokeColor(score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={dash}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold tabular-nums", scoreColor(score))}>{score.toFixed(1)}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Overall</span>
      </div>
    </div>
  );
}

export function ScoreLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
      <span>
        <span className="font-semibold text-danger">0–4</span> Poor
      </span>
      <span>
        <span className="font-semibold text-amber">5–7</span> Average
      </span>
      <span>
        <span className="font-semibold text-emerald">8–10</span> Good
      </span>
    </div>
  );
}
