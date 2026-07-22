import { useState, type ReactNode } from "react";

export default function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium shadow-lg z-50 animate-fade-in">
          {label}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
        </span>
      )}
    </span>
  );
}
