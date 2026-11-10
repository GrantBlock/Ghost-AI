"use client";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAiStatus } from "@/hooks/use-ai-status";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Project (= Liveblocks room) the design agent edits. */
  projectId?: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const TEXTAREA_MIN_HEIGHT = 72;
const TEXTAREA_MAX_HEIGHT = 160;

const tabTriggerClass =
  "text-copy-muted hover:text-copy-secondary data-active:bg-accent-ai/15 data-active:text-accent-ai-text dark:text-copy-muted dark:hover:text-copy-secondary dark:data-active:border-transparent dark:data-active:bg-accent-ai/15 dark:data-active:text-accent-ai-text";

function ArchitectTab({ projectId }: { projectId?: string }) {
  const [isSending, setIsSending] = useState(false);
  const { isGenerating, latest } = useAiStatus();
  const isBusy = isSending || isGenerating;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  // Auto-resize the textarea between the min and max height as content changes.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(
      Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT
    )}px`;
  }, [draft]);

  function addMessage(role: ChatMessage["role"], content: string) {
    setMessages((prev) => [...prev, { id: nextId.current++, role, content }]);
  }

  async function submit(text: string) {
    const content = text.trim();
    if (!content || isBusy) return;
    addMessage("user", content);
    setDraft("");
    if (!projectId) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId: projectId, projectId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Request failed");
      }
      addMessage("assistant", "On it. Watch the canvas as I build the design.");
    } catch (err) {
      addMessage(
        "assistant",
        `I couldn't start that: ${err instanceof Error ? err.message : "unknown error"}`
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(draft);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15 text-accent-ai-text">
              <Bot className="h-8 w-8" />
            </span>
            <p className="text-sm font-medium text-copy-primary">
              Start designing with Ghost AI
            </p>
            <p className="text-xs text-copy-muted">
              Describe a system and the AI Architect will help you map it out on
              the canvas.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submit(prompt)}
                  className="rounded-full bg-subtle px-3 py-1.5 text-xs text-accent-ai-text transition-colors hover:bg-elevated focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <p
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                    message.role === "user"
                      ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                      : "border border-surface-border bg-elevated text-accent-ai-text"
                  )}
                >
                  {message.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="shrink-0 border-t border-surface-border p-3">
        {latest?.text ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 flex items-center gap-2 rounded-xl bg-subtle px-3 py-1.5 text-xs text-copy-primary"
          >
            {latest.kind === "error" ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-state-error" />
            ) : latest.kind === "complete" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-ai-text" />
            ) : (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent-ai-text" />
            )}
            <span className="truncate">{latest.text}</span>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? "Ghost AI is working…" : "Describe your architecture…"}
            aria-label="Message Ghost AI"
            disabled={isBusy}
            rows={1}
            style={{ minHeight: TEXTAREA_MIN_HEIGHT, maxHeight: TEXTAREA_MAX_HEIGHT }}
            className="min-h-0 resize-none rounded-xl text-sm"
          />
          <Button
            size="icon"
            onClick={() => void submit(draft)}
            disabled={!draft.trim() || isBusy}
            aria-busy={isBusy}
            aria-label="Send message"
            className="shrink-0 rounded-xl bg-accent-ai text-white hover:bg-accent-ai/90"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-copy-faint">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}

function SpecsTab() {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      <Button className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/90">
        <Sparkles className="h-4 w-4" />
        Generate Spec
      </Button>
      <div className="rounded-2xl border border-surface-border bg-elevated p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-copy-primary">
              System Architecture Spec
            </p>
            <p className="mt-1 text-xs text-copy-muted">
              Overview of services, data stores and the key flows between them.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="mt-3 w-full rounded-xl"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}

/** Floating AI chat sidebar that slides in from the right. Open state is owned by the parent. */
export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  return (
    <aside
      aria-label="AI assistant"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute top-3 right-3 bottom-3 z-20 flex w-96 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-2xl shadow-black/40 backdrop-blur-md transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-border px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15 text-accent-ai-text">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-copy-primary">
            AI Workspace
          </h2>
          <p className="truncate text-xs text-copy-muted">
            Collaborate with Ghost AI
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="ml-auto text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 p-3">
          <TabsList className="w-full">
            <TabsTrigger value="architect" className={tabTriggerClass}>
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className={tabTriggerClass}>
              Specs
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="architect" className="flex min-h-0 flex-col">
          <ArchitectTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="specs" className="min-h-0">
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
