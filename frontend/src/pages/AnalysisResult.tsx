import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  HelpCircle,
  Lightbulb,
  RefreshCcw,
  Star,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { documentsApi } from "@/lib/api";
import { streamReanalysis } from "@/lib/stream";
import { useToast } from "@/context/ToastContext";
import RiskGauge from "@/components/RiskGauge";
import Timeline from "@/components/Timeline";
import FinancialBreakdown from "@/components/FinancialBreakdown";
import ClauseCard from "@/components/ClauseCard";
import ChatPanel from "@/components/ChatPanel";
import AnalysisLoader from "@/components/AnalysisLoader";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [exportOpen, setExportOpen] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeDone, setReanalyzeDone] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsApi.get(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["document", id] });
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const handleFavorite = async () => {
    if (!id) return;
    await documentsApi.toggleFavorite(id);
    invalidate();
  };

  const handleReanalyze = async () => {
    if (!id) return;
    setReanalyzing(true);
    setReanalyzeDone(false);
    await streamReanalysis(id, {
      onText: () => {},
      onDone: () => {
        setReanalyzeDone(true);
        setTimeout(() => {
          setReanalyzing(false);
          invalidate();
          showToast("Re-analysis complete.", "success");
        }, 500);
      },
      onError: (message) => {
        setReanalyzing(false);
        showToast(message, "error");
      },
    });
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    await documentsApi.remove(id);
    // Without this, the documents/dashboard-stats queries stay cached as
    // "fresh" for their 15s staleTime, so navigating back would keep
    // showing the just-deleted document until a manual page reload.
    invalidate();
    showToast("Document deleted.", "success");
    navigate("/documents");
  };

  const handleExport = async (format: "pdf" | "markdown" | "text") => {
    if (!id || !doc) return;
    setExportOpen(false);
    try {
      await documentsApi.export(id, format, doc.filename);
      showToast(`Exported as ${format.toUpperCase()}.`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-10 h-10 text-danger mb-3" />
        <p className="text-slate-600 dark:text-slate-300">This document couldn't be found.</p>
        <Link to="/documents" className="mt-4 text-secondary hover:underline text-sm">
          Back to documents
        </Link>
      </div>
    );
  }

  if (reanalyzing) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-2xl font-display font-semibold text-slate-800 dark:text-white mb-8">
          Re-analyzing your lease…
        </h1>
        <AnalysisLoader done={reanalyzeDone} />
      </div>
    );
  }

  const analysis = doc.latest_analysis;
  const result = analysis?.result_json;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/documents" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-secondary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to documents
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-danger" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-display font-semibold text-slate-800 dark:text-white truncate">{doc.filename}</h1>
            <p className="text-xs text-slate-400">
              {doc.source === "demo" ? "Sample lease" : "Uploaded"} · {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip label={doc.is_favorite ? "Remove favorite" : "Add to favorites"}>
            <button
              onClick={handleFavorite}
              className={`p-2.5 rounded-xl glass-card transition-colors ${doc.is_favorite ? "text-accent" : "text-slate-400 hover:text-accent"}`}
            >
              <Star className="w-4.5 h-4.5" fill={doc.is_favorite ? "currentColor" : "none"} />
            </button>
          </Tooltip>
          <Tooltip label="Re-analyze">
            <button onClick={handleReanalyze} className="p-2.5 rounded-xl glass-card text-slate-500 hover:text-secondary">
              <RefreshCcw className="w-4.5 h-4.5" />
            </button>
          </Tooltip>

          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={analysis?.status !== "complete"}
              className="px-4 py-2.5 rounded-xl brand-gradient text-white text-sm font-medium shadow-soft disabled:opacity-40 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-40 glass-card p-1.5 z-20">
                {(["pdf", "markdown", "text"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 capitalize"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Tooltip label="Delete">
            <button onClick={() => setConfirmingDelete(true)} className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-danger">
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this document?"
        message="You can restore it later from the Documents page."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />

      {analysis?.status === "failed" && (
        <div className="glass-card border-l-4 border-l-danger p-5 flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">This analysis failed</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{analysis.error}</p>
          </div>
          <button onClick={handleReanalyze} className="text-sm font-medium text-secondary hover:underline flex items-center gap-1 shrink-0">
            <RefreshCcw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {result && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Executive summary + risk */}
            <div className="glass-panel p-6 sm:p-8 grid sm:grid-cols-[auto_1fr] gap-8 items-center">
              <RiskGauge score={result.riskScore} level={result.riskLevel} />
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-800 dark:text-white mb-2">Executive Summary</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Key terms */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Key Terms</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(result.keyTerms || {}).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <FinancialBreakdown financial={result.financial} />
            <Timeline dates={result.importantDates} />

            {/* Clause cards */}
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 px-1">Flagged Clauses</h3>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                className="grid sm:grid-cols-2 gap-4"
              >
                {(result.clauses || []).map((clause, i) => (
                  <motion.div key={i} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                    <ClauseCard clause={clause} />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Questions */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-secondary" /> Questions to Ask Your Landlord
              </h3>
              <ul className="space-y-2">
                {(result.questions || []).map((q, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                    <span className="text-secondary font-semibold">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-4.5 h-4.5 text-accent" /> Recommendations
              </h3>
              <ul className="space-y-2">
                {(result.recommendations || []).map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-slate-400 text-center pb-4">
              This is an informational summary, not legal advice. For legal questions, consult a licensed attorney.
            </p>
          </div>

          {/* Chat sidebar */}
          <div className="lg:sticky lg:top-20 h-fit">
            <ChatPanel documentId={doc.id} />
          </div>
        </div>
      )}
    </div>
  );
}
