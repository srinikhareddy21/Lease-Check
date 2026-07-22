import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      setDevLink(res.dev_reset_link || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <span className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center shadow-soft mb-3">
            <FileText className="w-6 h-6 text-white" />
          </span>
          <h1 className="text-2xl font-display font-semibold text-slate-800 dark:text-white">Reset your password</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center">
            Enter your email and we'll generate a password reset link.
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              If an account exists for <strong>{email}</strong>, a reset link has been generated.
            </p>
            {devLink && (
              <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/30 text-left">
                <p className="text-xs font-medium text-warning mb-1">Dev mode — no email provider configured yet</p>
                <a href={devLink} className="text-xs text-secondary break-all hover:underline">
                  {devLink}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl brand-gradient text-white font-medium shadow-soft hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          <Link to="/login" className="text-secondary font-medium hover:underline">
            Back to log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
