import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Heart, Send, Flag } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/community/$postId")({
  component: PostDetail,
});

interface Post { id: string; title: string; body: string; anonymous_handle: string; likes_count: number; comments_count: number; created_at: string; category: string; user_id: string; }
interface Comment { id: string; body: string; anonymous_handle: string; created_at: string; user_id: string; }

function PostDetail() {
  const { postId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [handle, setHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, postId]);

  const load = async () => {
    const { data: p } = await supabase.from("posts").select("*").eq("id", postId).maybeSingle();
    setPost(p as Post);
    const { data: c } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at");
    setComments((c ?? []) as Comment[]);
    const { data: prof } = await supabase.from("profiles").select("anonymous_handle").eq("user_id", user!.id).maybeSingle();
    if (prof?.anonymous_handle) setHandle(prof.anonymous_handle);
    const { data: like } = await supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user!.id).maybeSingle();
    setLiked(!!like);
  };

  const submitComment = async () => {
    if (!user || !body.trim() || !post) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: post.id,
        user_id: user.id,
        body: body.trim(),
        anonymous_handle: handle || "Anonymous",
      });
      if (error) throw error;
      setBody("");
      await load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSubmitting(false); }
  };

  const toggleLike = async () => {
    if (!user || !post) return;
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setLiked(false);
      setPost({ ...post, likes_count: Math.max(0, post.likes_count - 1) });
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      setLiked(true);
      setPost({ ...post, likes_count: post.likes_count + 1 });
    }
  };

  const report = async () => {
    if (!user || !post) return;
    await supabase.from("post_reports").insert({ post_id: post.id, reporter_id: user.id, reason: "User reported" });
    toast.success("Reported. Our team will review.");
  };

  if (!post) return <AppShell><div className="text-center py-20 text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell>
      <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="bg-card border rounded-3xl p-5 shadow-soft">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="font-semibold text-primary">{post.anonymous_handle}</span>
          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
        </div>
        <h1 className="font-display text-2xl font-bold leading-tight">{post.title}</h1>
        <p className="text-sm mt-3 whitespace-pre-wrap leading-relaxed">{post.body}</p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
          <button onClick={toggleLike} className={`flex items-center gap-1.5 ${liked ? "text-primary" : "text-muted-foreground"}`}>
            <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} /> {post.likes_count} likes
          </button>
          <button onClick={report} className="ml-auto text-muted-foreground hover:text-destructive flex items-center gap-1">
            <Flag className="h-3.5 w-3.5" /> Report
          </button>
        </div>
      </div>

      <h2 className="font-display text-lg font-semibold mt-6 mb-3">{comments.length} comments</h2>
      <div className="space-y-2 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-card border rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-semibold text-primary">{c.anonymous_handle}</span>
              <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 sticky bottom-24 bg-background/80 backdrop-blur-sm py-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Reply as ${handle}…`} rows={2} maxLength={1000} className="rounded-2xl resize-none" />
        <Button onClick={submitComment} disabled={submitting || !body.trim()} className="rounded-full h-auto px-4 bg-gradient-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </AppShell>
  );
}
