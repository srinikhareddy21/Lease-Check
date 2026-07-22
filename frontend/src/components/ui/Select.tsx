import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export default function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative inline-block">
      <select
        {...props}
        className={`appearance-none pl-3 pr-8 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none focus-ring cursor-pointer ${className}`}
      />
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
