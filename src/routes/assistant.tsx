import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaywallCard } from "@/components/PaywallCard";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Health Assistant — CycleNova" },
      { name: "description", content: "Chat with an AI assistant trained on women's health: cycles, ovulation, PMS, fertility, and reproductive wellness." },
      { property: "og:title", content: "CycleNova AI Health Assistant" },
      { property: "og:description", content: "Get evidence-based answers on cycles, ovulation, PMS, fertility, and reproductive health — anytime." },
      { property: "og:image", content: "/og/assistant.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CycleNova AI Health Assistant" },
      { name: "twitter:description", content: "Evidence-based answers on women's health, anytime." },
      { name: "twitter:image", content: "/og/assistant.jpg" },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why are my cramps worse this month?",
  "What's actually happening during ovulation?",
  "How can I ease PMS naturally?",
  "Is spotting between periods normal?",
];

function AssistantPage() {
  const { user, loading } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (subLoading) return <AppShell><div className="text-center text-muted-foreground py-20">Loading…</div></AppShell>;

  if (!isPremium) {
    return (
      <AppShell>
        <div className="mb-5">
          <h1 className="font-display text-3xl font-bold">AI Health Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">Ask anything about your cycle, ovulation, PMS, and women's health.</p>
        </div>
        <PaywallCard
          feature="AI Health Assistant"
          description="Chat with a knowledgeable, evidence-based AI trained on women's reproductive health. Ask about cycles, symptoms, fertility, and more — anytime."
        />
      </AppShell>
    );
  }

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setStreaming(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
        return [...prev, { role: "assistant", content: acc }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (resp.status === 429) { toast.error("Too many messages. Please wait a moment."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add credits in workspace settings."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      toast.error((e as Error).message || "Something went wrong");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">AI Health Assistant</h1>
            <p className="text-xs text-muted-foreground">Balanced, evidence-based women's health guidance</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="bg-card border rounded-3xl p-4 shadow-soft min-h-[400px] max-h-[60vh] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">Ask me anything — I'm here to help you understand your body.</p>
            <div className="grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-4 py-3 rounded-2xl border bg-primary-soft/30 hover:bg-primary-soft transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : null)}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your cycle, symptoms, or health…"
          className="rounded-full h-12 bg-card"
          disabled={streaming}
        />
        <Button type="submit" disabled={streaming || !input.trim()} className="rounded-full h-12 w-12 p-0 bg-gradient-primary">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      <p className="text-[10px] text-muted-foreground text-center mt-2">Not medical advice. For urgent concerns, contact a healthcare provider.</p>
    </AppShell>
  );
}
