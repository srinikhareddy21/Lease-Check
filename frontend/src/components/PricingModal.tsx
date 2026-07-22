import { Check, Sparkles } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

export interface PricingPlanDetail {
  name: string;
  price: string;
  period: string;
  features: string[];
  ctaLabel: string;
}

export default function PricingModal({
  open,
  onClose,
  plan,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  plan: PricingPlanDetail | null;
  onConfirm: () => void;
  submitting?: boolean;
}) {
  if (!plan) return null;

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shrink-0">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </span>
        <h2 className="font-display text-xl font-semibold text-slate-800 dark:text-white">{plan.name}</h2>
      </div>
      <div className="flex items-baseline gap-1 mt-3 mb-5">
        <span className="text-3xl font-display font-semibold text-slate-800 dark:text-white">{plan.price}</span>
        <span className="text-slate-400">{plan.period}</span>
      </div>

      <ul className="space-y-2.5 mb-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Check className="w-4 h-4 mt-0.5 text-success shrink-0" /> {f}
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-400 mb-5">
        Billing isn't live yet — confirming here lets us know you're interested and we'll follow up by email when
        it opens up.
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Maybe later
        </Button>
        <Button variant="primary" onClick={onConfirm} loading={submitting} className="flex-1">
          {plan.ctaLabel}
        </Button>
      </div>
    </Modal>
  );
}
