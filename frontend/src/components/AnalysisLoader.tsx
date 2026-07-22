import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, ScanText, ListChecks, Landmark, FileText, Gauge, PackageCheck } from "lucide-react";

const STEPS = [
  { label: "Uploading PDF", icon: UploadCloud },
  { label: "Extracting text", icon: ScanText },
  { label: "Finding important clauses", icon: ListChecks },
  { label: "Analyzing financial terms", icon: Landmark },
  { label: "Generating plain-English summary", icon: FileText },
  { label: "Calculating risk score", icon: Gauge },
  { label: "Preparing report", icon: PackageCheck },
];

export default function AnalysisLoader({ done }: { done: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (done) {
      setStepIndex(STEPS.length - 1);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 2 ? i + 1 : i));
    }, 1600);
    return () => clearInterval(interval);
  }, [done]);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="glass-panel p-8 max-w-lg mx-auto">
      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-8">
        <motion.div
          className="h-full brand-gradient rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isDone = i < stepIndex || done;
          const isActive = i === stepIndex && !done;
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              initial={false}
              animate={{ opacity: i <= stepIndex || done ? 1 : 0.35 }}
              className="flex items-center gap-3"
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone ? "bg-success/15 text-success" : isActive ? "brand-gradient text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {isActive ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                    <Icon className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </span>
              <span className={`text-sm ${isDone || isActive ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-400"}`}>
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
