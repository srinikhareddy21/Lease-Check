import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import PricingModal, { type PricingPlanDetail } from "@/components/PricingModal";

type PlanId = "free" | "premium" | "business";

const plans: (PricingPlanDetail & { id: PlanId; description: string; highlighted: boolean })[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For renters checking a single lease.",
    features: ["3 analyses per month", "Risk score & clause breakdown", "AI chat about your lease", "Markdown & text export"],
    ctaLabel: "Get started",
    highlighted: false,
  },
  {
    id: "premium",
    name: "Renter Pro",
    price: "$9",
    period: "/month",
    description: "For anyone actively apartment hunting.",
    features: [
      "Unlimited analyses",
      "Full analysis history",
      "PDF report export",
      "Priority AI response times",
      "Favorites & advanced search",
    ],
    ctaLabel: "Start free trial",
    highlighted: true,
  },
  {
    id: "business",
    name: "Property Teams",
    price: "Custom",
    period: "",
    description: "For agencies reviewing leases at scale.",
    features: ["Everything in Renter Pro", "Team seats", "Shared document library", "Priority support"],
    ctaLabel: "Talk to sales",
    highlighted: false,
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [modalPlan, setModalPlan] = useState<(typeof plans)[number] | null>(null);
  const [activating, setActivating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePlanClick = async (plan: (typeof plans)[number]) => {
    if (plan.id === "free") {
      if (!isAuthenticated) {
        navigate("/login", { state: { from: { pathname: "/pricing" } } });
        return;
      }
      // Purely client-side "activation" — there's no plan/billing field on the
      // backend yet, so this just confirms the choice and takes you in.
      setActivating(true);
      await new Promise((r) => setTimeout(r, 500));
      setActivating(false);
      showToast("You're all set on the Free plan.", "success");
      navigate("/dashboard");
      return;
    }

    // Premium / Business never jump straight to the dashboard — show details
    // and let the person actually confirm interest first.
    setModalPlan(plan);
  };

  const handleModalConfirm = async () => {
    if (!modalPlan) return;
    if (!isAuthenticated) {
      setModalPlan(null);
      navigate("/login", { state: { from: { pathname: "/pricing" } } });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setModalPlan(null);
    showToast(
      modalPlan.id === "premium"
        ? "Thanks! We'll email you as soon as Renter Pro billing is live."
        : "Thanks! Our team will reach out about Property Teams shortly.",
      "success"
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-display font-semibold text-slate-800 dark:text-white">Simple, transparent pricing</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">Start free. Upgrade only if you need more.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className={`rounded-2xl p-8 flex flex-col transition-transform hover:-translate-y-1 ${
              plan.highlighted ? "brand-gradient text-white shadow-glass scale-[1.03]" : "glass-card"
            }`}
          >
            <h3 className={`font-display text-xl font-semibold ${plan.highlighted ? "text-white" : "text-slate-800 dark:text-white"}`}>
              {plan.name}
            </h3>
            <p className={`text-sm mt-1 ${plan.highlighted ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
              {plan.description}
            </p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-display font-semibold">{plan.price}</span>
              <span className={plan.highlighted ? "text-white/70" : "text-slate-400"}>{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlighted ? "text-white" : "text-success"}`} />
                  <span className={plan.highlighted ? "text-white/90" : "text-slate-600 dark:text-slate-300"}>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePlanClick(plan)}
              disabled={plan.id === "free" && activating}
              className={`mt-8 text-center py-2.5 rounded-xl font-medium transition-opacity hover:opacity-90 disabled:opacity-60 ${
                plan.highlighted ? "bg-white text-primary" : "brand-gradient text-white"
              }`}
            >
              {plan.id === "free" && activating ? "Activating…" : plan.ctaLabel}
            </button>
          </motion.div>
        ))}
      </div>

      <PricingModal
        open={!!modalPlan}
        onClose={() => setModalPlan(null)}
        plan={modalPlan}
        onConfirm={handleModalConfirm}
        submitting={submitting}
      />
    </div>
  );
}
