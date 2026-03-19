// ═══════════════════════════════════════════════════════════════════════════
// PROJECT EXECUTOR — Handles project AI chat.
// Session-aware, scaffold-aware, project-type-aware.
// Owns the /api/project-chat/:id/chat SSE endpoint and its stream parsing.
// Called by streamProjectChat() in PlatformController — not via streamEngine().
// ═══════════════════════════════════════════════════════════════════════════

export interface ProjectChatOpts {
  projectId:      string;
  message:        string;
  history:        { role: "user" | "assistant"; content: string }[];
  scaffoldFiles?: string[];
  projectType?:   string;
  signal?:        AbortSignal;
  onChunk:        (text: string) => void;
  onDone?:        (fullText: string) => void;
}

export class ProjectExecutor {
  readonly domain = "project";

  async executeProjectChat(opts: ProjectChatOpts): Promise<void> {
    try {
      const res = await fetch(`/api/project-chat/${opts.projectId}/chat`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:       opts.message,
          history:       opts.history,
          projectType:   opts.projectType,
          scaffoldFiles: opts.scaffoldFiles,
        }),
        signal: opts.signal,
      });

      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let   acc    = "";
      let   full   = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        const parts = acc.split("\n\n");
        acc = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const raw = part.slice(6).trim();
          if (raw === "[DONE]") { opts.onDone?.(full); return; }
          try {
            const p = JSON.parse(raw) as { content?: string };
            if (p.content) { full += p.content; opts.onChunk(p.content); }
          } catch { /* skip malformed */ }
        }
      }
      opts.onDone?.(full);
    } catch (err) {
      if ((err as Error).name !== "AbortError") throw err;
    }
  }
}
