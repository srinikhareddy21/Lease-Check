import { motion } from "framer-motion";

const COLORS: Record<string, string> = {
  low: "#22C55E",
  medium: "#F97316",
  high: "#EF4444",
};

const LABELS: Record<string, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export default function RiskGauge({
  score,
  level,
  size = 160,
}: {
  score: number;
  level: "low" | "medium" | "high";
  size?: number;
}) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = COLORS[level] || COLORS.medium;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={14}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-semibold text-slate-800 dark:text-white">{Math.round(clamped)}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      <span
        className="mt-3 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ color, backgroundColor: `${color}1A` }}
      >
        {LABELS[level] || "Unknown risk"}
      </span>
    </div>
  );
}
