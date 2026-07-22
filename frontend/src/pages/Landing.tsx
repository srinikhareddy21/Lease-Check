import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Sparkles,
  Clock,
  DollarSign,
  MessageSquareText,
  UploadCloud,
  ScanSearch,
  Gauge,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    icon: ScanSearch,
    title: "Plain-English breakdowns",
    text: "Every clause translated out of legalese, so you know exactly what you're agreeing to.",
  },
  {
    icon: Gauge,
    title: "Risk score, at a glance",
    text: "A single 0–100 score plus a clause-by-clause risk rating for rent, fees, and termination terms.",
  },
  {
    icon: DollarSign,
    title: "Full financial breakdown",
    text: "Rent, deposit, late fees, and hidden charges laid out in one place, before you sign anything.",
  },
  {
    icon: MessageSquareText,
    title: "Ask follow-up questions",
    text: "Chat with an AI assistant that has already read your lease and can answer specifics.",
  },
];

const steps = [
  { icon: UploadCloud, title: "Upload your lease", text: "Drop in a PDF, or try one of our sample leases." },
  { icon: Sparkles, title: "AI reads every clause", text: "Gemini extracts key terms, dates, fees, and risk factors." },
  { icon: ShieldCheck, title: "Review your report", text: "Get a clear risk score, a timeline, and questions worth asking." },
];

const testimonials = [
  {
    name: "Priya M.",
    role: "First-time renter",
    text: "I had no idea my lease auto-renewed until LeaseCheck flagged it. Asked my landlord and they let me switch to month-to-month.",
  },
  {
    name: "Daniel O.",
    role: "Grad student",
    text: "The risk score made it easy to compare two apartments side by side instead of guessing which lease was worse.",
  },
  {
    name: "Sarah K.",
    role: "Relocating for work",
    text: "The chat feature answered my question about subletting in seconds instead of me re-reading twelve pages.",
  },
];

const faqs = [
  {
    q: "Is this legal advice?",
    a: "No. LeaseCheck helps you understand what your lease says in plain language and flags things worth double-checking. For legal questions specific to your situation, talk to a licensed attorney or local tenant rights organization.",
  },
  {
    q: "What file types are supported?",
    a: "PDF only, up to 15MB per file. If your lease is a scanned image without selectable text, extraction may not work — try a text-based PDF where possible.",
  },
  {
    q: "Is my lease data private?",
    a: "Your uploaded leases and analyses are tied to your account and are never visible to other users.",
  },
  {
    q: "Can I re-analyze a lease later?",
    a: "Yes — every document in your library can be re-analyzed at any time, and your analysis history is kept.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card p-5">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
        <span className="font-medium text-slate-700 dark:text-slate-200">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{a}</p>}
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/10 via-paper to-paper dark:from-secondary/10 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-secondary/20 blur-3xl -z-10" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl -z-10" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-medium text-secondary mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl sm:text-6xl font-display font-semibold tracking-tight text-slate-800 dark:text-white"
          >
            Understand Your Lease <span className="brand-gradient-text">Before You Sign</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Upload any rental lease and get a plain-English breakdown, a clear risk score, and a list of
            questions worth asking — in under a minute.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to={isAuthenticated ? "/analyze" : "/signup"}
              className="px-7 py-3.5 rounded-xl brand-gradient text-white font-medium shadow-soft hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <UploadCloud className="w-4.5 h-4.5" /> Upload Lease
            </Link>
            <Link
              to={isAuthenticated ? "/analyze" : "/signup"}
              className="px-7 py-3.5 rounded-xl glass-card font-medium text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-slate-800/70 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4.5 h-4.5" /> Try a Demo Lease
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-semibold text-slate-800 dark:text-white">
            Everything you need to read a lease with confidence
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass-card p-6 hover:shadow-glass hover:-translate-y-1 transition-all"
            >
              <span className="w-11 h-11 rounded-xl brand-gradient flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-white" />
              </span>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-display font-semibold text-slate-800 dark:text-white">How it works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4">
                <s.icon className="w-7 h-7 text-secondary" />
              </div>
              <p className="text-xs font-semibold text-accent mb-1">STEP {i + 1}</p>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits banner */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-panel p-10 grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-display font-semibold brand-gradient-text">60s</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Average time to a full report</p>
          </div>
          <div>
            <p className="text-3xl font-display font-semibold brand-gradient-text">12+</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Clause categories checked every time</p>
          </div>
          <div>
            <p className="text-3xl font-display font-semibold brand-gradient-text">100%</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Private — your leases, your account only</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-semibold text-slate-800 dark:text-white">What renters say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white text-sm font-semibold">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">"{t.text}"</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">Illustrative renter feedback.</p>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-semibold text-slate-800 dark:text-white">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="glass-panel p-10 text-center brand-gradient !bg-none bg-gradient-to-br from-primary to-secondary text-white">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold">Ready to understand your lease?</h2>
          <p className="mt-2 text-white/80">It takes less than a minute to get your first report.</p>
          <Link
            to={isAuthenticated ? "/analyze" : "/signup"}
            className="inline-flex mt-6 px-7 py-3 rounded-xl bg-white text-primary font-medium shadow-soft hover:opacity-90 transition-opacity"
          >
            Get started free
          </Link>
        </div>
      </section>
    </div>
  );
}
