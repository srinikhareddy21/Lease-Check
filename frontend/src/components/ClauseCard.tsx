import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ClauseCard as ClauseCardType } from "@/lib/types";

const RISK_STYLES: Record<string, { border: string; badge: string; icon: any; color: string }> = {
  low: { border: "border-l-success", badge: "bg-success/10 text-success", icon: CheckCircle2, color: "#22C55E" },
  medium: { border: "border-l-warning", badge: "bg-warning/10 text-warning", icon: AlertTriangle, color: "#F97316" },
  high: { border: "border-l-danger", badge: "bg-danger/10 text-danger", icon: AlertCircle, color: "#EF4444" },
};

export default function ClauseCard({ clause }: { clause: ClauseCardType }) {
  const style = RISK_STYLES[clause.riskLevel] || RISK_STYLES.medium;
  const Icon = style.icon;

  return (
    <div className={`glass-card border-l-4 ${style.border} p-5`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-slate-800 dark:text-white">{clause.name}</h4>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${style.badge}`}>
          <Icon className="w-3.5 h-3.5" /> {clause.riskLevel}
        </span>
      </div>
      {clause.original && (
        <p className="text-xs text-slate-400 italic mb-2 line-clamp-2">"{clause.original}"</p>
      )}
      <p className="text-sm text-slate-600 dark:text-slate-300">{clause.plainEnglish}</p>
      {clause.suggestion && (
        <p className="text-xs text-secondary mt-2.5 flex gap-1.5">
          <span className="font-semibold shrink-0">Suggestion:</span> {clause.suggestion}
        </p>
      )}
    </div>
  );
}
