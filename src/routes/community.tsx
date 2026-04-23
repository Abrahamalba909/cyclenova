import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Heart, Plus, Flag, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community — CycleNova" },
      { name: "description", content: "Join anonymous discussions on cycles, PMS, fertility, and women's wellness in a safe, supportive community." },
      { property: "og:title", content: "CycleNova Community — Anonymous women's health discussions" },
      { property: "og:description", content: "Talk openly about cycles, PMS, fertility, and wellness with a supportive anonymous community." },
      { property: "og:image", content: "/og/community.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CycleNova Community" },
      { name: "twitter:description", content: "Anonymous discussions on cycles, PMS, fertility, and wellness." },
      { name: "twitter:image", content: "/og/community.jpg" },
    ],
  }),
  component: CommunityPage,
});

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cycles", label: "Cycles" },
  { id: "pms", label: "PMS" },
  { id: "fertility", label: "Fertility" },
  { id: "questions", label: "Questions" },
  { id: "wellness", label: "Wellness" },
];

interface Post {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  anonymous_handle: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

function CommunityPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postCategory, setPostCategory] = useState("cycles");
  const [submitting, setSubmitting] = useState(false);
  const [handle, setHandle] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void load();
    void loadHandle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, category]);

  const loadHandle = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("anonymous_handle").eq("user_id", user.id).maybeSingle();
    if (data?.anonymous_handle) setHandle(data.anonymous_handle);
  };

  const load = async () => {
    let q = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (category !== "all") q = q.eq("category", category);
    const { data } = await q;
    setPosts((data ?? []) as Post[]);
    if (user && data) {
      const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
      setLikedIds(new Set((likes ?? []).map((l: any) => l.post_id)));
    }
  };

  const submit = async () => {
    if (!user || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        title: title.trim(),
        body: body.trim(),
        category: postCategory,
        anonymous_handle: handle || "Anonymous",
      });
      if (error) throw error;
      toast.success("Posted anonymously");
      setOpen(false);
      setTitle(""); setBody("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSubmitting(false); }
  };

  const toggleLike = async (post: Post) => {
    if (!user) return;
    if (likedIds.has(post.id)) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLikedIds((s) => { const n = new Set(s); n.delete(post.id); return n; });
      setPosts((p) => p.map((x) => x.id === post.id ? { ...x, likes_count: Math.max(0, x.likes_count - 1) } : x));
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      setLikedIds((s) => new Set(s).add(post.id));
      setPosts((p) => p.map((x) => x.id === post.id ? { ...x, likes_count: x.likes_count + 1 } : x));
    }
  };

  const report = async (post: Post) => {
    if (!user) return;
    await supabase.from("post_reports").insert({ post_id: post.id, reporter_id: user.id, reason: "User reported" });
    toast.success("Reported. Our team will review.");
  };

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Community
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Anonymous discussions on women's health</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-gradient-primary"><Plus className="h-4 w-4 mr-1" /> Post</Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>New post (anonymous as {handle})</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter(c => c.id !== "all").map((c) => (
                  <button key={c.id} onClick={() => setPostCategory(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${postCategory === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="rounded-xl h-11" />
              <Textarea placeholder="Share your thoughts…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={5} className="rounded-xl" />
              <Button onClick={submit} disabled={submitting || !title.trim() || !body.trim()} className="w-full h-11 rounded-full bg-gradient-primary">
                {submitting ? "Posting…" : "Post anonymously"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${category === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="bg-card border rounded-3xl p-8 text-center text-muted-foreground">
            No posts yet. Be the first to start a conversation.
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="bg-card border rounded-2xl p-4 shadow-soft">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-semibold text-primary">{p.anonymous_handle}</span>
              <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
            </div>
            <Link to="/community/$postId" params={{ postId: p.id }}>
              <h3 className="font-display text-lg font-semibold leading-tight">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.body}</p>
            </Link>
            <div className="flex items-center gap-4 mt-3 text-xs">
              <button onClick={() => toggleLike(p)} className={`flex items-center gap-1 ${likedIds.has(p.id) ? "text-primary" : "text-muted-foreground"}`}>
                <Heart className="h-3.5 w-3.5" fill={likedIds.has(p.id) ? "currentColor" : "none"} /> {p.likes_count}
              </button>
              <Link to="/community/$postId" params={{ postId: p.id }} className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" /> {p.comments_count}
              </Link>
              <button onClick={() => report(p)} className="ml-auto text-muted-foreground hover:text-destructive">
                <Flag className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
