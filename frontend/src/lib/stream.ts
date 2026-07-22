import { API_BASE, getToken } from "./api";
import { notifyUnauthorized } from "./authEvents";

export interface StreamHandlers {
  onText: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

async function consumeSSE(response: Response, handlers: StreamHandlers) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && getToken()) {
      notifyUnauthorized();
    }
    handlers.onError(body.detail || `Request failed (${response.status})`);
    return;
  }
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.text) handlers.onText(parsed.text);
        else if (parsed.error) handlers.onError(parsed.error);
        else if (parsed.done) handlers.onDone();
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function streamUploadAnalysis(
  file: File,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/analyze/upload`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
    signal,
  });
  const documentId = res.headers.get("X-Document-Id");
  await consumeSSE(res, handlers);
  return documentId;
}

export async function streamDemoAnalysis(
  demoId: string,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<string | null> {
  const res = await fetch(`${API_BASE}/api/analyze/demo/${demoId}`, {
    headers: authHeaders(),
    signal,
  });
  const documentId = res.headers.get("X-Document-Id");
  await consumeSSE(res, handlers);
  return documentId;
}

export async function streamReanalysis(documentId: string, handlers: StreamHandlers, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/api/documents/${documentId}/reanalyze`, {
    method: "POST",
    headers: authHeaders(),
    signal,
  });
  await consumeSSE(res, handlers);
}

export async function streamChat(
  documentId: string,
  question: string,
  history: { role: string; content: string }[],
  handlers: StreamHandlers,
  signal?: AbortSignal
) {
  const res = await fetch(`${API_BASE}/api/documents/${documentId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question, history }),
    signal,
  });
  await consumeSSE(res, handlers);
}
