import { CalendarDays } from "lucide-react";
import type { ImportantDate } from "@/lib/types";

export default function Timeline({ dates }: { dates: ImportantDate[] }) {
  if (!dates || dates.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
        <CalendarDays className="w-4.5 h-4.5 text-secondary" /> Important Dates
      </h3>
      <div className="relative pl-1">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-5">
          {dates.map((d, i) => (
            <div key={i} className="relative pl-6">
              <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full brand-gradient ring-4 ring-white dark:ring-slate-900" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{d.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{d.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
