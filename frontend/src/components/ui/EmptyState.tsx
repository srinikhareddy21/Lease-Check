import type { ReactNode } from "react";
import { motion } from "framer-motion";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center py-16 px-6"
    >
      <span className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
        <Icon className="w-6.5 h-6.5 text-secondary" />
      </span>
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">{title}</p>
      {description && <p className="text-sm text-slate-400 max-w-sm mb-5">{description}</p>}
      {action}
    </motion.div>
  );
}
