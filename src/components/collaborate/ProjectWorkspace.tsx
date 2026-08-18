import { useState, useRef, useEffect } from "react";
import { useProjectWorkspace, type CollabTaskStatus } from "@/hooks/useCollaboration";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Send, Loader2, Upload, Trash2, FileText, Plus, Sparkles,
  Users, MessageSquare, ListTodo, Folder, Check, X, AlertTriangle, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: string;
  onBack: () => void;
}

const STATUS_LABEL: Record<CollabTaskStatus, string> = { todo: "To do", doing: "Doing", done: "Done" };
const STATUS_NEXT: Record<CollabTaskStatus, CollabTaskStatus> = { todo: "doing", doing: "done", done: "todo" };

export const ProjectWorkspace = ({ projectId, onBack }: Props) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const ws = useProjectWorkspace(projectId);
  const [tab, setTab] = useState("chat");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<{ summary: string; decisions: string[]; next_steps: string[] } | null>(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ws.messages.length, tab]);

  if (ws.loading && !ws.project) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ws.project) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Project not found or you don't have access.
        <div className="mt-4">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </div>
      </div>
    );
  }

  const canParticipate = ws.isMember || isAdmin;

  const handleSend = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await ws.sendMessage(messageText);
      setMessageText("");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Failed";
      toast.error(m);
    } finally {
      setSending(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      await ws.createTask(taskTitle);
      setTaskTitle("");
    } catch (e) {
      toast.error("Failed to add task");
    }
  };

  const handleUpload = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Max file size 25MB");
      return;
    }
    setUploading(true);
    try {
      await ws.uploadFile(file);
      toast.success("File uploaded");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Failed";
      toast.error(m);
    } finally {
      setUploading(false);
    }
  };

  const handleSummarize = async () => {
    if (ws.messages.length === 0) {
      toast.error("No messages yet");
      return;
    }
    setSummaryBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("collaborate", {
        body: {
          action: "summarize",
          messages: ws.messages.map((m) => ({ author: m.display_name, text: m.message })),
        },
      });
      if (error) throw error;
      setSummary(data);
    } catch (e) {
      toast.error("Summary failed");
    } finally {
      setSummaryBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase font-semibold text-primary">{ws.project.topic}</p>
          <h2 className="text-xl font-bold text-foreground truncate">{ws.project.title}</h2>
        </div>
      </div>

      {!canParticipate && (
        <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
          You're viewing this project. Request to join from the marketplace to participate.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-1" /> Chat</TabsTrigger>
          <TabsTrigger value="tasks"><ListTodo className="w-4 h-4 mr-1" /> Tasks</TabsTrigger>
          <TabsTrigger value="files"><Folder className="w-4 h-4 mr-1" /> Files</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-4 h-4 mr-1" /> Team</TabsTrigger>
        </TabsList>

        {/* CHAT */}
        <TabsContent value="chat" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{ws.messages.length} messages</p>
            <Button variant="outline" size="sm" onClick={handleSummarize} disabled={summaryBusy}>
              {summaryBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              AI Summary
            </Button>
          </div>

          {summary && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Discussion summary</p>
                <button onClick={() => setSummary(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-foreground/80">{summary.summary}</p>
              {summary.decisions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Decisions</p>
                  <ul className="list-disc pl-5 text-sm text-foreground/80">{summary.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul>
                </div>
              )}
              {summary.next_steps.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Next steps</p>
                  <ul className="list-disc pl-5 text-sm text-foreground/80">{summary.next_steps.map((d, i) => <li key={i}>{d}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl flex flex-col h-[460px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {ws.messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Say hello!</p>
              )}
              {ws.messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl ${isOwn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"} ${msg.ai_flagged ? "ring-2 ring-destructive/60" : ""}`}>
                      {!isOwn && <p className="text-[10px] font-semibold opacity-70 mb-0.5">{msg.display_name}</p>}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      {msg.ai_flagged && (
                        <div className="mt-1.5 flex items-start gap-1 text-[10px] opacity-90">
                          <ShieldAlert className="w-3 h-3 mt-0.5" />
                          <span>AI flagged: {msg.ai_flag_reason}</span>
                        </div>
                      )}
                      <p className="text-[10px] opacity-50 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {canParticipate ? (
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Message your team..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  disabled={sending}
                  maxLength={2000}
                />
                <Button size="icon" onClick={handleSend} disabled={sending || !messageText.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">Join the team to chat</div>
            )}
          </div>
        </TabsContent>

        {/* TASKS */}
        <TabsContent value="tasks">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            {canParticipate && (
              <div className="flex gap-2">
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Add a task..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddTask(); } }}
                  maxLength={200}
                />
                <Button onClick={handleAddTask}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-4">
              {(["todo", "doing", "done"] as CollabTaskStatus[]).map((status) => (
                <div key={status} className="bg-secondary/30 rounded-xl p-3 space-y-2 min-h-[200px]">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{STATUS_LABEL[status]}</p>
                  {ws.tasks.filter((t) => t.status === status).map((task) => (
                    <div key={task.id} className="bg-card border border-border rounded-lg p-2.5 group">
                      <p className="text-sm text-foreground">{task.title}</p>
                      {canParticipate && (
                        <div className="flex gap-1 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary"
                            onClick={() => ws.updateTaskStatus(task.id, STATUS_NEXT[status])}
                          >
                            → {STATUS_LABEL[STATUS_NEXT[status]]}
                          </button>
                          <button
                            className="text-[10px] px-2 py-0.5 rounded text-destructive hover:bg-destructive/10"
                            onClick={() => ws.deleteTask(task.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {ws.tasks.filter((t) => t.status === status).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Empty</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* FILES */}
        <TabsContent value="files">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            {canParticipate && (
              <div>
                <input
                  ref={fileInput}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload file
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {ws.files.length === 0 && <p className="text-sm text-muted-foreground">No files shared yet.</p>}
              {ws.files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 group">
                  <FileText className="w-4 h-4 text-primary" />
                  <button
                    className="flex-1 text-left text-sm text-foreground hover:underline truncate"
                    onClick={() => ws.downloadFile(f.file_path, f.file_name)}
                  >
                    {f.file_name}
                  </button>
                  <span className="text-xs text-muted-foreground">{((f.size_bytes ?? 0) / 1024).toFixed(0)} KB</span>
                  {(f.uploaded_by === user?.id || ws.isLead || isAdmin) && (
                    <button onClick={() => ws.deleteFile(f)} className="opacity-0 group-hover:opacity-100 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Members ({ws.members.length})</p>
              <div className="space-y-2">
                {ws.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {(m.name ?? "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name ?? "Member"}</p>
                      <p className="text-xs text-muted-foreground">{m.role_label || m.role}</p>
                    </div>
                    {m.role === "lead" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary uppercase">Lead</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {(ws.isLead || isAdmin) && ws.joinRequests.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Join requests ({ws.joinRequests.length})</p>
                <div className="space-y-2">
                  {ws.joinRequests.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Wants role: {r.desired_role || "—"}</p>
                        {r.message && <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => ws.declineJoin(r.id).catch(() => toast.error("Failed"))}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => ws.approveJoin(r).then(() => toast.success("Approved")).catch(() => toast.error("Failed"))}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
