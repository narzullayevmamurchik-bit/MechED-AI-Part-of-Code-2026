import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAssignments, useMySubmissions, type Assignment, type Submission } from "@/hooks/useAssignments";
import { AIFeedbackBlock } from "@/components/assignments/AIFeedbackBlock";
import { CalendarView } from "@/components/assignments/calendar/CalendarView";
import { SelfCheckPanel } from "@/components/assignments/SelfCheckPanel";
import {
  FileText,
  Calendar as CalendarIcon,
  List as ListIcon,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Download,
  Loader2,
  X,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Debounce plagiarism checks per assignment so a burst of submissions only
// triggers one cross-comparison run a few seconds later.
const plagiarismTimers = new Map<string, ReturnType<typeof setTimeout>>();
const schedulePlagiarismCheck = (assignmentId: string) => {
  const existing = plagiarismTimers.get(assignmentId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    plagiarismTimers.delete(assignmentId);
    void supabase.functions.invoke("check-plagiarism", {
      body: { assignment_id: assignmentId },
    });
  }, 4000);
  plagiarismTimers.set(assignmentId, timer);
};

const Assignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { assignments, loading: aLoading, refetch: refetchA } = useAssignments();
  const { submissions, loading: sLoading, refetch: refetchS } = useMySubmissions();
  const [courses, setCourses] = useState<Record<string, { title: string; icon: string }>>({});
  const [active, setActive] = useState<Assignment | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [mode, setMode] = useState<"class" | "self">("class");

  /* submission form */
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("courses").select("id, title, icon");
      const map: Record<string, { title: string; icon: string }> = {};
      (data || []).forEach((c) => {
        map[c.id] = { title: c.title, icon: c.icon || "📚" };
      });
      setCourses(map);
    })();
  }, []);

  const submissionByAssignmentId = (id: string): Submission | undefined =>
    submissions.find((s) => s.assignment_id === id);

  const handleSubmit = async () => {
    if (!user || !active) return;
    if (!content.trim() && !file) {
      toast({ title: "Empty submission", description: "Add text or upload a file", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      if (file) {
        const path = `${user.id}/${active.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("submissions").upload(path, file);
        if (upErr) throw upErr;
        filePath = path;
        fileName = file.name;
      }

      const existing = submissionByAssignmentId(active.id);
      if (existing) {
        const { error } = await supabase
          .from("submissions")
          .update({
            content: content.trim() || null,
            file_path: filePath ?? existing.file_path,
            file_name: fileName ?? existing.file_name,
            submitted_at: new Date().toISOString(),
            status: "submitted",
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("submissions").insert({
          assignment_id: active.id,
          student_id: user.id,
          content: content.trim() || null,
          file_path: filePath,
          file_name: fileName,
          status: "submitted",
        });
        if (error) throw error;
      }

      toast({ title: "Submitted!", description: "AI is grading your work…" });
      setContent("");
      setFile(null);
      setActive(null);
      await refetchS();

      // Trigger AI grading in the background. Find the freshly-saved submission id.
      const { data: latest } = await supabase
        .from("submissions")
        .select("id")
        .eq("assignment_id", active.id)
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest?.id) {
        const assignmentIdForCheck = active.id;
        supabase.functions
          .invoke("grade-submission", { body: { submission_id: latest.id } })
          .then(({ error }) => {
            if (error) {
              toast({ title: "AI grading failed", description: error.message, variant: "destructive" });
            } else {
              toast({ title: "AI feedback ready", description: "Refresh to see your score." });
              void refetchS();
            }
            // Always schedule a plagiarism sweep after grading attempt — debounced
            // so simultaneous student submits collapse into one comparison run.
            schedulePlagiarismCheck(assignmentIdForCheck);
          });
      }
    } catch (error: any) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const downloadOwnFile = async (path: string, filename: string) => {
    const { data, error } = await supabase.storage.from("submissions").download(path);
    if (error) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = aLoading || sLoading;

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Assignments
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "class" ? "Track deadlines, submit your work, and review feedback" : "Upload your own work and get instant AI engineering review"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-lg bg-secondary p-0.5">
                <button
                  onClick={() => setMode("class")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    mode === "class" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Class Assignments
                </button>
                <button
                  onClick={() => setMode("self")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    mode === "self" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Self-Check
                </button>
              </div>
              {mode === "class" && (
                <div className="inline-flex rounded-lg bg-secondary p-0.5">
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      viewMode === "calendar" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" /> Calendar
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ListIcon className="w-3.5 h-3.5" /> List
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl space-y-6">
          {mode === "self" ? (
            <SelfCheckPanel />
          ) : viewMode === "calendar" ? (
            <CalendarView
              courses={Object.entries(courses).map(([id, c]) => ({
                id,
                title: c.title,
                icon: c.icon,
              }))}
              onSubmit={(event) => {
                const a = assignments.find((x) => x.id === event.id);
                if (!a) return;
                const sub = submissionByAssignmentId(a.id);
                setActive(a);
                setContent(sub?.content || "");
                setFile(null);
              }}
            />
          ) : loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No assignments yet. Check back later when your teachers post one.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const sub = submissionByAssignmentId(a.id);
                const submitted = !!sub;
                const overdue = a.deadline && isPast(new Date(a.deadline)) && !submitted;
                const course = courses[a.course_id];
                return (
                  <div
                    key={a.id}
                    className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl shrink-0">{course?.icon || "📚"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{course?.title || "Course"}</p>
                            <h3 className="text-base font-semibold text-foreground">{a.title}</h3>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {submitted && sub.status === "graded" && sub.teacher_score !== null && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/20 text-success text-xs font-semibold">
                                <Award className="w-3 h-3" /> {sub.teacher_score}/{a.max_score}
                              </span>
                            )}
                            {submitted && sub.status !== "graded" && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/20 text-accent text-xs font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Submitted
                              </span>
                            )}
                            {overdue && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/20 text-destructive text-xs font-semibold">
                                <AlertTriangle className="w-3 h-3" /> Overdue
                              </span>
                            )}
                          </div>
                        </div>

                        {a.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.description}</p>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                          {a.assigned_at && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              Assigned {format(new Date(a.assigned_at), "MMM d")}
                            </span>
                          )}
                          {a.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {isPast(new Date(a.deadline))
                                ? `Closed ${formatDistanceToNow(new Date(a.deadline))} ago`
                                : `Due in ${formatDistanceToNow(new Date(a.deadline))}`}
                            </span>
                          )}
                          <span>Max {a.max_score} pts</span>
                        </div>

                        {sub?.teacher_feedback && (
                          <div className="mt-3 border-l-2 border-success pl-3 text-xs text-muted-foreground">
                            <p className="font-semibold text-success mb-1">Teacher Feedback</p>
                            <p className="whitespace-pre-wrap">{sub.teacher_feedback}</p>
                          </div>
                        )}

                        {sub?.ai_feedback && (
                          <AIFeedbackBlock feedback={sub.ai_feedback} score={sub.ai_score} />
                        )}

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              setActive(a);
                              setContent(sub?.content || "");
                              setFile(null);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium"
                          >
                            <Upload className="w-3.5 h-3.5" /> {submitted ? "Resubmit" : "Submit Work"}
                          </button>
                          {sub?.file_path && (
                            <button
                              onClick={() => downloadOwnFile(sub.file_path!, sub.file_name || "submission")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground hover:bg-secondary/70"
                            >
                              <Download className="w-3.5 h-3.5" /> {sub.file_name}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submission Modal */}
        {active && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
                <div>
                  <h2 className="font-semibold text-foreground">{active.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {courses[active.course_id]?.title} ·{" "}
                    {active.deadline ? `Due ${format(new Date(active.deadline), "PPp")}` : "No deadline"}
                  </p>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {active.description && (
                  <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg whitespace-pre-wrap">
                    {active.description}
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Your answer (text)</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    placeholder="Type your answer here…"
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Attach file (any type — PDF, DOCX, code, image, zip…)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-foreground file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-accent file:text-accent-foreground file:text-xs file:font-medium file:cursor-pointer"
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.name} · {(file.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setActive(null)}
                    className="px-4 py-2 rounded-lg bg-secondary text-sm text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Assignments;
