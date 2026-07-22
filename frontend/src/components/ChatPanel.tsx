import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Send, Sparkles } from "lucide-react";
import { streamChat } from "@/lib/stream";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Can I terminate early?",
  "Explain the security deposit.",
  "Who pays for utilities?",
  "Summarize this lease in one paragraph.",
  "What happens if I pay rent late?",
];

export default function ChatPanel({ documentId }: { documentId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (question: string) => {
    if (!question.trim() || streaming) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    await streamChat(documentId, question, history, {
      onText: (chunk) => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + chunk };
          return copy;
        });
      },
      onDone: () => setStreaming(false),
      onError: (message) => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: `Sorry — ${message}` };
          return copy;
        });
        setStreaming(false);
      },
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="glass-card flex flex-col h-[520px]">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <MessageSquareText className="w-4.5 h-4.5 text-secondary" />
        <h3 className="font-semibold text-slate-800 dark:text-white">Ask about this lease</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-3">Try asking:</p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-secondary/10 hover:text-secondary transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "brand-gradient text-white rounded-br-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm"
              }`}
            >
              {m.content ||
                (streaming && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                  </span>
                ) : (
                  m.content
                ))}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this lease…"
          disabled={streaming}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 focus-ring text-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="w-10 h-10 shrink-0 rounded-xl brand-gradient text-white flex items-center justify-center disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
