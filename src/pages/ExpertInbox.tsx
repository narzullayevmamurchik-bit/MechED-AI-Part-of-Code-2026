import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useMyExpertProfile } from "@/hooks/useExpertsDb";
import { useExpertInbox, answerQuestion, uploadQuestionAttachment, ExpertQuestion } from "@/hooks/useExpertQA";
import { useExpertChats } from "@/hooks/useExpertChat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Inbox, CheckCircle2, Clock, Eye, EyeOff, Send, Loader2, Upload, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ExpertInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { expert, loading: expLoading } = useMyExpertProfile();
  const { questions, loading, reload } = useExpertInbox(expert?.id);
  const { chats } = useExpertChats(expert?.id);
  const [tab, setTab] = useState("open");

  if (expLoading) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-md text-center space-y-2">
            <Inbox className="w-10 h-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">No expert profile linked</h2>
            <p className="text-sm text-muted-foreground">
              An admin needs to link your account to an expert profile before you can access the inbox.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const open = questions.filter((q) => q.status === "open");
  const answered = questions.filter((q) => q.status === "answered");

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Inbox className="w-5 h-5" /> Expert Inbox
          </h1>
          <p className="text-sm text-muted-foreground">Questions sent to {expert.name}</p>
        </header>

        <div className="p-6 md:p-8 max-w-4xl">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="open" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Open ({open.length})</TabsTrigger>
                <TabsTrigger value="answered" className="gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Answered ({answered.length})</TabsTrigger>
                <TabsTrigger value="chats" className="gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Chats ({chats.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="open" className="space-y-4 mt-4">
                {open.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No open questions.</p>
                ) : open.map((q) => (
                  <InboxCard key={q.id} q={q} expertId={expert.id} userId={user!.id} onAnswered={reload} />
                ))}
              </TabsContent>
              <TabsContent value="answered" className="space-y-4 mt-4">
                {answered.map((q) => <InboxCard key={q.id} q={q} expertId={expert.id} userId={user!.id} onAnswered={reload} readOnly />)}
              </TabsContent>
              <TabsContent value="chats" className="space-y-2 mt-4">
                {chats.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No chats yet.</p>
                ) : chats.map((c) => (
                  <Card key={c.id} className="cursor-pointer hover:bg-secondary/30" onClick={() => navigate(`/experts/chat/${c.expert_id}`)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-base overflow-hidden">
                        {c.student?.avatar_url ? <img src={c.student.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.student?.display_name?.[0]?.toUpperCase() ?? "?")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground truncate">{c.student?.display_name ?? "Student"}</p>
                          <span className="text-[10px] text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.last_message_preview || "No messages yet"}</p>
                      </div>
                      {c.expert_unread > 0 && <Badge variant="default">{c.expert_unread}</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

const InboxCard = ({
  q, expertId, userId, onAnswered, readOnly,
}: { q: ExpertQuestion; expertId: string; userId: string; onAnswered: () => void; readOnly?: boolean }) => {
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!reply.trim()) { toast.error("Write an answer first"); return; }
    setSending(true);
    try {
      const attachments = [];
      for (const f of files) attachments.push(await uploadQuestionAttachment(f, userId));
      await answerQuestion({
        question_id: q.id, expert_id: expertId, author_id: userId,
        body: reply.trim(), attachments,
      });
      toast.success("Answer sent");
      setReply(""); setFiles([]);
      onAnswered();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
            <Badge
              variant={q.priority === "urgent" || q.priority === "high" ? "destructive" : "outline"}
              className="text-[10px]"
            >{q.priority}</Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              {q.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {q.is_public ? "public" : "private"}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()}</span>
        </div>

        <h3 className="font-semibold text-foreground mb-1">{q.title}</h3>
        {q.student && (
          <p className="text-xs text-muted-foreground mb-2">from {q.student.display_name || "Anonymous"}</p>
        )}
        <p className="text-sm text-muted-foreground whitespace-pre-line">{q.body}</p>

        {q.attachments && q.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {q.attachments.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                 className="text-xs text-primary underline">{a.name}</a>
            ))}
          </div>
        )}

        {q.answers && q.answers.length > 0 && (
          <div className="mt-4 space-y-2 pl-3 border-l-2 border-primary/40">
            {q.answers.map((a) => (
              <div key={a.id}>
                <p className="text-xs text-muted-foreground">Your answer · {new Date(a.created_at).toLocaleString()}</p>
                <p className="text-sm text-foreground whitespace-pre-line">{a.body}</p>
              </div>
            ))}
          </div>
        )}

        {!readOnly && (
          <div className="mt-4 space-y-2">
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your answer…" rows={3} />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <Upload className="w-3.5 h-3.5" />
                <span>{files.length > 0 ? `${files.length} file(s)` : "Attach files"}</span>
                <input type="file" multiple className="hidden" onChange={(e) => {
                  setFiles(Array.from(e.target.files ?? []));
                }} />
              </label>
              <Button size="sm" onClick={handleSend} disabled={sending} className="gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send answer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpertInbox;
