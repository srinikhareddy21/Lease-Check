import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Filter,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { documentsApi, type DocumentListParams } from "@/lib/api";
import { streamReanalysis } from "@/lib/stream";
import { useToast } from "@/context/ToastContext";
import Badge, { riskTone } from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { DocumentCardSkeleton } from "@/components/ui/Skeleton";

export default function Documents() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [q, setQ] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [sort, setSort] = useState<DocumentListParams["sort"]>("created_at");
  const [order, setOrder] = useState<DocumentListParams["order"]>("desc");
  const [page, setPage] = useState(1);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; filename: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const params: DocumentListParams = {
    q: q || undefined,
    favorite: favoriteOnly ? true : undefined,
    risk_level: riskLevel || undefined,
    sort,
    order,
    page,
    page_size: 9,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["documents", params],
    queryFn: () => documentsApi.list(params),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  const handleFavorite = async (id: string) => {
    await documentsApi.toggleFavorite(id);
    invalidate();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    await documentsApi.remove(pendingDelete.id);
    invalidate();
    showToast("Document deleted.", "success");
    setDeleting(false);
    setPendingDelete(null);
  };

  const handleReanalyze = async (id: string) => {
    setReanalyzingId(id);
    await streamReanalysis(id, {
      onText: () => {},
      onDone: () => {
        setReanalyzingId(null);
        invalidate();
        showToast("Re-analysis complete.", "success");
      },
      onError: (message) => {
        setReanalyzingId(null);
        showToast(message, "error");
      },
    });
  };

  const handleExport = async (id: string, filename: string) => {
    try {
      await documentsApi.export(id, "pdf", filename);
      showToast("Report downloaded.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-800 dark:text-white">Your Documents</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{data?.total ?? 0} lease{data?.total === 1 ? "" : "s"} analyzed</p>
        </div>
        <Link to="/analyze">
          <Button variant="primary">
            <UploadCloud className="w-4 h-4" /> Upload Lease
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by filename…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setFavoriteOnly((v) => !v);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
              favoriteOnly ? "bg-accent/15 text-accent" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}
          >
            <Star className="w-3.5 h-3.5" fill={favoriteOnly ? "currentColor" : "none"} /> Favorites
          </button>

          <Select
            value={riskLevel}
            onChange={(e) => {
              setRiskLevel(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </Select>

          <Select
            value={`${sort}-${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-") as [DocumentListParams["sort"], DocumentListParams["order"]];
              setSort(s);
              setOrder(o);
              setPage(1);
            }}
          >
            <option value="created_at-desc">Newest first</option>
            <option value="created_at-asc">Oldest first</option>
            <option value="filename-asc">Filename A–Z</option>
            <option value="risk-desc">Highest risk first</option>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {data.items.map((doc) => (
            <motion.div
              key={doc.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -3 }}
              className="glass-card p-5 flex flex-col hover:shadow-glass transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-danger" />
                  </span>
                  <div className="min-w-0">
                    <Link to={`/documents/${doc.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate block hover:text-secondary">
                      {doc.filename}
                    </Link>
                    <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => handleFavorite(doc.id)} className={doc.is_favorite ? "text-accent" : "text-slate-300 hover:text-accent"}>
                  <Star className="w-4 h-4" fill={doc.is_favorite ? "currentColor" : "none"} />
                </button>
              </div>

              <Badge tone={riskTone(doc.latest_analysis?.risk_level)} className="w-fit mb-4">
                {doc.latest_analysis?.status === "pending"
                  ? "processing"
                  : doc.latest_analysis?.status === "failed"
                  ? "failed"
                  : `${doc.latest_analysis?.risk_level || "n/a"} risk`}
              </Badge>

              <div className="mt-auto flex items-center gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to={`/documents/${doc.id}`}
                  className="flex-1 text-center text-xs font-medium py-2 rounded-lg text-secondary hover:bg-secondary/10"
                >
                  Open
                </Link>
                <Tooltip label="Download report">
                  <button
                    onClick={() => handleExport(doc.id, doc.filename)}
                    disabled={doc.latest_analysis?.status !== "complete"}
                    className="p-2 rounded-lg text-slate-400 hover:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip label="Analyze again">
                  <button
                    onClick={() => handleReanalyze(doc.id)}
                    disabled={reanalyzingId === doc.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RefreshCcw className={`w-3.5 h-3.5 ${reanalyzingId === doc.id ? "animate-spin" : ""}`} />
                  </button>
                </Tooltip>
                <Tooltip label="Delete">
                  <button
                    onClick={() => setPendingDelete({ id: doc.id, filename: doc.filename })}
                    className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="glass-card">
          <EmptyState
            icon={Filter}
            title="No documents match your filters"
            description="Try adjusting your search or filters, or upload a new lease."
            action={
              <Link to="/analyze" className="text-sm font-medium text-secondary hover:underline">
                Upload a lease
              </Link>
            }
          />
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg glass-card disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg glass-card disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this document?"
        message={pendingDelete ? `"${pendingDelete.filename}" will be moved out of your library. You can restore it later.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
