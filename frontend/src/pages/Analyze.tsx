import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCcw, Sparkles } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import AnalysisLoader from "@/components/AnalysisLoader";
import { documentsApi } from "@/lib/api";
import { streamDemoAnalysis, streamUploadAnalysis } from "@/lib/stream";

export default function Analyze() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: demoDocs } = useQuery({ queryKey: ["demo-documents"], queryFn: documentsApi.listDemoDocuments });

  const runAnalysis = async (kind: "upload" | "demo", demoId?: string) => {
    setAnalyzing(true);
    setStreamDone(false);
    setError(null);

    const handlers = {
      onText: () => {},
      onDone: () => setStreamDone(true),
      onError: (message: string) => {
        setError(message);
        setAnalyzing(false);
      },
    };

    try {
      let documentId: string | null = null;
      if (kind === "upload" && file) {
        documentId = await streamUploadAnalysis(file, handlers);
      } else if (kind === "demo" && demoId) {
        documentId = await streamDemoAnalysis(demoId, handlers);
      }

      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      if (documentId) {
        setTimeout(() => navigate(`/documents/${documentId}`), 500);
      } else {
        setError("Something went wrong — we couldn't identify the created document.");
        setAnalyzing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-2xl font-display font-semibold text-slate-800 dark:text-white mb-8">
          Analyzing your lease…
        </h1>
        <AnalysisLoader done={streamDone} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-semibold text-slate-800 dark:text-white">Upload your lease</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          We'll extract the text and have Gemini walk through every clause.
        </p>
      </div>

      {error && (
        <div className="mb-6 glass-card border-l-4 border-l-danger p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Analysis failed</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-sm font-medium text-secondary hover:underline flex items-center gap-1 shrink-0"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      <UploadZone file={file} onFileSelected={setFile} onClear={() => setFile(null)} />

      <button
        disabled={!file}
        onClick={() => runAnalysis("upload")}
        className="w-full mt-4 py-3 rounded-xl brand-gradient text-white font-medium shadow-soft hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4.5 h-4.5" /> Analyze Lease
      </button>

      <div className="flex items-center gap-3 my-10">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <span className="text-xs text-slate-400">or try a sample lease</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {(demoDocs || []).map((doc) => (
          <motion.button
            key={doc.id}
            whileHover={{ y: -2 }}
            onClick={() => runAnalysis("demo", doc.id)}
            className="glass-card p-5 text-left hover:shadow-glass transition-shadow"
          >
            <p className="font-medium text-slate-700 dark:text-slate-200">{doc.label}</p>
            <p className="text-xs text-slate-400 mt-1">Sample lease · instant analysis</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
