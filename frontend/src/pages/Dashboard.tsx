import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { lazy, Suspense } from "react";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Star,
  UploadCloud,
  Sparkles,
  FolderOpen,
  ArrowUpRight,
  PieChart,
} from "lucide-react";
import { dashboardApi, documentsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CardSkeleton, RowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Badge, { riskTone } from "@/components/ui/Badge";

const RiskDistributionChart = lazy(() => import("@/components/RiskDistributionChart"));

const statCards = [
  { key: "total_analyses", label: "Total Analyses", icon: FileText, color: "text-secondary", bg: "bg-secondary/10" },
  { key: "high_risk_count", label: "High Risk Leases", icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10" },
  { key: "safe_count", label: "Safe Leases", icon: ShieldCheck, color: "text-success", bg: "bg-success/10" },
  { key: "favorites_count", label: "Saved Reports", icon: Star, color: "text-accent", bg: "bg-accent/10" },
] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboardApi.stats });
  const { data: recentDocs, isLoading: docsLoading } = useQuery({
    queryKey: ["documents", "recent"],
    queryFn: () => documentsApi.list({ sort: "created_at", order: "desc", page_size: 6 }),
  });

  const mediumCount =
    stats && stats.total_analyses > 0
      ? Math.max(0, stats.total_analyses - stats.high_risk_count - stats.safe_count)
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-secondary font-medium mb-1">{greeting()}</p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-slate-800 dark:text-white">
            {user?.name?.split(" ")[0]}'s workspace
          </h1>
        </div>
        <Link
          to="/analyze"
          className="px-5 py-2.5 rounded-xl brand-gradient text-white text-sm font-medium shadow-soft hover:opacity-90 transition-opacity flex items-center gap-2 w-fit"
        >
          <UploadCloud className="w-4 h-4" /> Upload Lease
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map((card, i) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className="glass-card p-6 hover:shadow-glass transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </span>
                </div>
                <p className="text-3xl font-display font-semibold text-slate-800 dark:text-white tabular-nums">
                  {stats ? stats[card.key] : 0}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
              </motion.div>
            ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">Recent Activity</h2>
            <Link to="/documents" className="text-sm text-secondary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {docsLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : recentDocs && recentDocs.items.length > 0 ? (
            <div className="space-y-1">
              {recentDocs.items.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/documents/${doc.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <span className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-danger" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-secondary transition-colors">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge tone={riskTone(doc.latest_analysis?.risk_level)}>
                      {doc.latest_analysis?.status === "pending" ? "processing" : doc.latest_analysis?.risk_level || "n/a"}
                    </Badge>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No leases analyzed yet"
              description="Upload your first lease to see it show up here."
              action={
                <Link to="/analyze" className="text-sm font-medium text-secondary hover:underline">
                  Upload your first lease
                </Link>
              }
            />
          )}
        </div>

        {/* Side column: risk breakdown + quick actions */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-4.5 h-4.5 text-secondary" /> Risk Breakdown
            </h2>
            {statsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="h-32 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </div>
                }
              >
                <RiskDistributionChart low={stats?.safe_count ?? 0} medium={mediumCount} high={stats?.high_risk_count ?? 0} />
              </Suspense>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-2.5">
              <Link
                to="/analyze"
                className="flex items-center gap-3 p-3.5 rounded-xl brand-gradient text-white hover:opacity-90 transition-opacity group"
              >
                <UploadCloud className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Upload Lease</span>
              </Link>
              <Link
                to="/analyze"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-secondary/10 hover:text-secondary transition-colors group"
              >
                <Sparkles className="w-4.5 h-4.5 text-secondary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-secondary">
                  Try a Sample Lease
                </span>
              </Link>
              <Link
                to="/documents"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-secondary/10 hover:text-secondary transition-colors group"
              >
                <FolderOpen className="w-4.5 h-4.5 text-secondary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-secondary">
                  Browse Documents
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
