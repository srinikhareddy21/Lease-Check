import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, FileCheck2, FileWarning, Download, Trash2 } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

const ICONS: Record<string, any> = {
  analysis_complete: FileCheck2,
  report_ready: FileCheck2,
  upload_failed: FileWarning,
  export_complete: Download,
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: isAuthenticated ? 20000 : false,
    enabled: isAuthenticated,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    invalidate();
  };

  const items = data?.items ?? [];
  const unread = data?.unread_count ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 focus-ring transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger text-[10px] leading-4 text-white text-center font-semibold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 w-80 max-h-[26rem] overflow-y-auto glass-card p-2 z-50"
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</p>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-secondary hover:underline flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-slate-400 px-2 py-6 text-center">You're all caught up.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {items.map((n) => {
                    const Icon = ICONS[n.type] || Bell;
                    return (
                      <Link
                        key={n.id}
                        to={n.document_id ? `/documents/${n.document_id}` : "/documents"}
                        onClick={async () => {
                          setOpen(false);
                          if (!n.is_read) {
                            await notificationsApi.markRead(n.id);
                            invalidate();
                          }
                        }}
                        className={`flex gap-2.5 p-2.5 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                          !n.is_read ? "bg-secondary/5" : ""
                        }`}
                      >
                        <Icon className="w-4 h-4 mt-0.5 text-secondary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await notificationsApi.remove(n.id);
                            invalidate();
                          }}
                          className="text-slate-300 hover:text-danger shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
