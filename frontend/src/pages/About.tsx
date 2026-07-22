import { ShieldCheck, Sparkles, Users } from "lucide-react";

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-display font-semibold text-slate-800 dark:text-white">About LeaseCheck</h1>
        <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Most renters sign a lease without fully understanding it — not because they don't care, but because
          lease language is dense, unfamiliar, and easy to skim past. LeaseCheck uses AI to translate that
          language into plain English, so renters can make informed decisions before they sign.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mb-16">
        <div className="glass-card p-6 text-center">
          <Sparkles className="w-8 h-8 text-secondary mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-white mb-1">AI-first</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Built on Google Gemini, tuned specifically to surface lease risk.
          </p>
        </div>
        <div className="glass-card p-6 text-center">
          <ShieldCheck className="w-8 h-8 text-secondary mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-white mb-1">Private by default</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your documents and analyses are tied to your account only.
          </p>
        </div>
        <div className="glass-card p-6 text-center">
          <Users className="w-8 h-8 text-secondary mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-white mb-1">Built for renters</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Designed around the questions renters actually ask before signing.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8">
        <h2 className="font-display text-xl font-semibold text-slate-800 dark:text-white mb-3">A note on legal advice</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          LeaseCheck is an informational tool, not a law firm, and doesn't provide legal advice. It helps you
          understand what a lease document says and flags terms that are commonly worth double-checking. For
          questions about your specific legal rights or obligations, please consult a licensed attorney or a
          local tenant rights organization.
        </p>
      </div>
    </div>
  );
}
