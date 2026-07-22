import type { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  neutral: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function Badge({
  tone = "neutral",
  icon: Icon,
  children,
  className = "",
}: {
  tone?: Tone;
  icon?: any;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TONE_CLASSES[tone]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}

export function riskTone(level: string | null | undefined): Tone {
  if (level === "high") return "danger";
  if (level === "medium") return "warning";
  if (level === "low") return "success";
  return "neutral";
}
