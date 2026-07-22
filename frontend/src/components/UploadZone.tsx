import { useCallback, useRef, useState, type DragEvent } from "react";
import { motion } from "framer-motion";
import { FileText, UploadCloud, X, RefreshCw } from "lucide-react";

const MAX_BYTES = 15 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({
  file,
  onFileSelected,
  onClear,
  disabled,
}: {
  file: File | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (f: File) => {
      setError(null);
      if (!f.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a PDF file.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setError("File is too large. Maximum size is 15MB.");
        return;
      }
      onFileSelected(f);
    },
    [onFileSelected]
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSet(f);
  };

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 flex items-center gap-4"
      >
        <span className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 text-danger" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)} · PDF</p>
        </div>
        {!disabled && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => inputRef.current?.click()}
              className="p-2 rounded-lg text-slate-400 hover:text-secondary hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Replace file"
              title="Replace file"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClear}
              className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Remove file"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && validateAndSet(e.target.files[0])}
        />
      </motion.div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
          dragging
            ? "border-secondary bg-secondary/5 scale-[1.01]"
            : "border-slate-300 dark:border-slate-700 hover:border-secondary/60 hover:bg-slate-50 dark:hover:bg-slate-900/40"
        }`}
      >
        <motion.div
          animate={dragging ? { y: [-4, 0, -4] } : { y: 0 }}
          transition={{ repeat: dragging ? Infinity : 0, duration: 1.2 }}
          className="mx-auto w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mb-4 shadow-soft"
        >
          <UploadCloud className="w-7 h-7 text-white" />
        </motion.div>
        <p className="font-medium text-slate-700 dark:text-slate-200">
          {dragging ? "Drop your lease here" : "Drag & drop your lease PDF here"}
        </p>
        <p className="text-sm text-slate-400 mt-1">or click to browse — PDF only, up to 15MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && validateAndSet(e.target.files[0])}
        />
      </div>
      {error && <p className="mt-2 text-sm text-danger text-center">{error}</p>}
    </div>
  );
}
