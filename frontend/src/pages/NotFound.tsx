import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <FileQuestion className="w-14 h-14 text-secondary mb-4" />
      <h1 className="text-3xl font-display font-semibold text-slate-800 dark:text-white">Page not found</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 px-5 py-2.5 rounded-lg brand-gradient text-white text-sm font-medium shadow-soft">
        Back to home
      </Link>
    </div>
  );
}
