import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-primary dark:text-white">
            <span className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </span>
            LeaseCheck
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            AI-powered lease analysis that helps renters understand what they're signing.
            LeaseCheck is an informational tool, not a substitute for legal advice.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Product</p>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/analyze" className="hover:text-secondary">Upload a lease</Link></li>
            <li><Link to="/pricing" className="hover:text-secondary">Pricing</Link></li>
            <li><Link to="/dashboard" className="hover:text-secondary">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Company</p>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link to="/about" className="hover:text-secondary">About</Link></li>
            <li><Link to="/login" className="hover:text-secondary">Log in</Link></li>
            <li><Link to="/signup" className="hover:text-secondary">Sign up</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} LeaseCheck. Not legal advice.
      </div>
    </footer>
  );
}
