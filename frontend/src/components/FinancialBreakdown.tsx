import { DollarSign, Home, AlertTriangle, CalendarClock, Receipt } from "lucide-react";

interface Financial {
  monthlyRent?: string;
  deposit?: string;
  lateFee?: string;
  earlyTerminationFee?: string;
  otherFees?: { name: string; amount: string }[];
}

const rows = [
  { key: "monthlyRent", label: "Monthly Rent", icon: Home },
  { key: "deposit", label: "Security Deposit", icon: DollarSign },
  { key: "lateFee", label: "Late Fee", icon: CalendarClock },
  { key: "earlyTerminationFee", label: "Early Termination Fee", icon: AlertTriangle },
] as const;

export default function FinancialBreakdown({ financial }: { financial: Financial }) {
  if (!financial) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
        <Receipt className="w-4.5 h-4.5 text-secondary" /> Financial Breakdown
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {rows.map(({ key, label, icon: Icon }) => {
          const value = financial[key];
          if (!value) return null;
          return (
            <div key={key} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
                <Icon className="w-4.5 h-4.5 text-secondary" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white break-words">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {financial.otherFees && financial.otherFees.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Other fees</p>
          <div className="flex flex-wrap gap-2">
            {financial.otherFees.map((fee, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs bg-warning/10 text-warning border border-warning/20"
              >
                {fee.name}: {fee.amount}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
