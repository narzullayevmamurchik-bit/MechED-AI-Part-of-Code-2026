import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Assignment } from "@/hooks/useAssignments";
import { Plus, Trash2, Edit2, Save, X, Calendar, Users, FileText, Download, ChevronLeft, Award, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { AIFeedbackBlock } from "@/components/assignments/AIFeedbackBlock";

interface Course {
  id: string;
  title: string;
  icon: string | null;
}

interface TeacherLink {
  id: string;
  course_id: string;
  teacher_id: string;
  display_name?: string | null;
  email?: string | null;
}

interface PlagiarismMatch {
  peer_submission_id: string;
  peer_name: string;
  similarity_pct: number;
}

interface SubmissionWithProfile {
  id: string;
  student_id: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  status: string;
  ai_score: number | null;
  ai_feedback: any;
  teacher_score: number | null;
  teacher_feedback: string | null;
  plagiarism_score: number | null;
  plagiarism_matches: PlagiarismMatch[] | null;
  submitted_at: string;
  display_name?: string | null;
}

export const AdminAssignmentsManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teacherLinks, setTeacherLinks] = useState<TeacherLink[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allProfiles, setAllProfiles] = useState<{ user_id: string; display_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "submissions">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  /* form state */
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    course_id: "",
    title: "",
    description: "",
    assigned_at: "",
    deadline: "",
    max_score: 100,
  });

  /* teacher assignment state */
  const [teacherEmail, setTeacherEmail] = useState("");
  const [assignTeacherCourse, setAssignTeacherCourse] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: c }, { data: tl }, { data: a }, { data: p }] = await Promise.all([
        supabase.from("courses").select("id, title, icon").order("title"),
        supabase.from("course_teachers").select("id, course_id, teacher_id"),
        supabase.from("assignments").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, display_name"),
      ]);
      setCourses(c || []);
      const profileMap = new Map((p || []).map((pp) => [pp.user_id, pp.display_name]));
      setAllProfiles(p || []);
      setTeacherLinks(
        (tl || []).map((link) => ({
          ...link,
          display_name: profileMap.get(link.teacher_id) || null,
        }))
      );
      setAssignments(a || []);
    } catch (error) {
      console.warn("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const createAssignment = async () => {
    if (!form.title.trim() || !form.course_id || !user) {
      toast({ title: "Missing info", description: "Title and course are required", variant: "destructive" });
      return;
    }
    const payload = {
      course_id: form.course_id,
      title: form.title.trim(),
      description: form.description.trim(),
      assigned_at: form.assigned_at ? new Date(form.assigned_at).toISOString() : new Date().toISOString(),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      max_score: Number(form.max_score) || 100,
      created_by: user.id,
    };
    const { error } = await supabase.from("assignments").insert(payload);
    if (error) {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Assignment created" });
    setForm({ course_id: "", title: "", description: "", assigned_at: "", deadline: "", max_score: 100 });
    setCreating(false);
    void loadAll();
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment and all its submissions?")) return;
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Assignment deleted" });
    void loadAll();
  };

  const assignTeacher = async () => {
    if (!teacherEmail.trim() || !assignTeacherCourse) return;
    // Find user by display_name (since we can't query auth.users directly we use profiles)
    const profile = allProfiles.find(
      (p) => p.display_name?.toLowerCase() === teacherEmail.trim().toLowerCase()
    );
    if (!profile) {
      toast({
        title: "Teacher not found",
        description: "Enter the exact display name of the teacher (must already have signed up).",
        variant: "destructive",
      });
      return;
    }
    // Ensure they have teacher role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("role", "teacher")
      .maybeSingle();
    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: profile.user_id, role: "teacher" });
    }
    const { error } = await supabase
      .from("course_teachers")
      .insert({ course_id: assignTeacherCourse, teacher_id: profile.user_id });
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Teacher assigned" });
    setTeacherEmail("");
    setAssignTeacherCourse("");
    void loadAll();
  };

  const removeTeacher = async (linkId: string) => {
    const { error } = await supabase.from("course_teachers").delete().eq("id", linkId);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    void loadAll();
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>;
  }

  if (view === "submissions" && selectedAssignment) {
    return (
      <SubmissionsView
        assignment={selectedAssignment}
        onBack={() => {
          setView("list");
          setSelectedAssignment(null);
        }}
      />
    );
  }

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title || "—";

  return (
    <div className="space-y-8">
      {/* Teacher Assignments */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Teachers per Course</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Assign a registered user as a teacher for a specific course. They&apos;ll get the teacher role automatically.
        </p>

        <div className="flex flex-wrap gap-2 items-end bg-secondary/30 p-3 rounded-xl">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Teacher display name</label>
            <input
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="e.g. Aliyeva Nodira"
              className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground mb-1 block">Course</label>
            <select
              value={assignTeacherCourse}
              onChange={(e) => setAssignTeacherCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={assignTeacher}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Assign
          </button>
        </div>

        <div className="space-y-1">
          {teacherLinks.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">No teachers assigned yet.</p>
          )}
          {teacherLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 text-sm"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{link.display_name || "Unknown"}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground flex-1">{courseTitle(link.course_id)}</span>
              <button
                onClick={() => removeTeacher(link.id)}
                className="p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Assignments */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Assignments ({assignments.length})</h3>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> New Assignment
          </button>
        </div>

        {creating && (
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Course *</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
                >
                  <option value="">Select…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Assigned at</label>
                <input
                  type="datetime-local"
                  value={form.assigned_at}
                  onChange={(e) => setForm((p) => ({ ...p, assigned_at: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Defaults to now if blank</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max score</label>
                <input
                  type="number"
                  value={form.max_score}
                  onChange={(e) => setForm((p) => ({ ...p, max_score: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createAssignment}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
              >
                <Save className="w-4 h-4" /> Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {assignments.length === 0 && !creating && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No assignments yet. Create the first one to get started.
            </p>
          )}
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              <FileText className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {courseTitle(a.course_id)} · Max {a.max_score} pts
                  {a.deadline && (
                    <>
                      {" · "}
                      <Calendar className="w-3 h-3 inline" /> {format(new Date(a.deadline), "PPp")}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedAssignment(a);
                  setView("submissions");
                }}
                className="text-xs text-accent hover:underline"
              >
                View Submissions
              </button>
              <button
                onClick={() => deleteAssignment(a.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ───────────────────── Submissions sub-view ───────────────────── */
const SubmissionsView = ({
  assignment,
  onBack,
}: {
  assignment: Assignment;
  onBack: () => void;
}) => {
  const { toast } = useToast();
  const [subs, setSubs] = useState<SubmissionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ score: 0, feedback: "" });
  const [grading, setGrading] = useState<string | null>(null);
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);

  const regrade = async (submissionId: string) => {
    setGrading(submissionId);
    const { error } = await supabase.functions.invoke("grade-submission", {
      body: { submission_id: submissionId },
    });
    setGrading(null);
    if (error) {
      toast({ title: "AI grading failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "AI evaluation updated" });
    void load();
  };

  const runPlagiarismCheck = async () => {
    setCheckingPlagiarism(true);
    const { data, error } = await supabase.functions.invoke("check-plagiarism", {
      body: { assignment_id: assignment.id },
    });
    setCheckingPlagiarism(false);
    if (error) {
      toast({ title: "Plagiarism check failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Plagiarism check complete",
      description:
        data?.flagged_pairs > 0
          ? `${data.flagged_pairs} suspicious pair(s) flagged across ${data.checked} submissions.`
          : `No matches above ${Math.round((data?.threshold ?? 0.7) * 100)}% across ${data?.checked ?? 0} submissions.`,
    });
    void load();
  };

  const load = async () => {
    setLoading(true);
    const { data: subData } = await supabase
      .from("submissions")
      .select("*")
      .eq("assignment_id", assignment.id)
      .order("submitted_at", { ascending: false });

    const userIds = Array.from(new Set((subData || []).map((s) => s.student_id)));
    const { data: profiles } =
      userIds.length > 0
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : { data: [] };
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

    setSubs(
      (subData || []).map((s) => ({
        ...s,
        plagiarism_matches: (s.plagiarism_matches as unknown as PlagiarismMatch[] | null) ?? null,
        display_name: nameMap.get(s.student_id) || "Unknown",
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [assignment.id]);

  const downloadFile = async (path: string, filename: string) => {
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

  const saveGrade = async (submissionId: string) => {
    const { error } = await supabase
      .from("submissions")
      .update({
        teacher_score: editForm.score,
        teacher_feedback: editForm.feedback,
        status: "graded",
        graded_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Grade saved" });
    setEditing(null);
    void load();
  };

  const flaggedCount = subs.filter((s) => (s.plagiarism_matches?.length ?? 0) > 0).length;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-accent hover:underline">
        <ChevronLeft className="w-4 h-4" /> Back to assignments
      </button>

      <div className="bg-secondary/30 p-4 rounded-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Max score: {assignment.max_score} ·{" "}
              {assignment.deadline
                ? `Due ${format(new Date(assignment.deadline), "PPp")}`
                : "No deadline"}
            </p>
          </div>
          <button
            onClick={runPlagiarismCheck}
            disabled={checkingPlagiarism || subs.length < 2}
            title={subs.length < 2 ? "Need at least 2 submissions" : "Re-embed and compare all submissions"}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50"
          >
            {checkingPlagiarism ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {checkingPlagiarism ? "Analyzing…" : "Run Plagiarism Check"}
          </button>
        </div>
        {flaggedCount > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/15 border border-destructive/30 text-xs text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <span className="font-semibold">{flaggedCount}</span> submission(s) have suspicious similarity (≥70%) with at least one peer. Review the matches below.
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading submissions…</p>
      ) : subs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {format(new Date(s.submitted_at), "PPp")} · Status:{" "}
                    <span className={s.status === "graded" ? "text-success" : "text-amber-500"}>
                      {s.status}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.teacher_score !== null && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-success/20 text-success text-xs font-semibold">
                      <Award className="w-3 h-3" /> {s.teacher_score}/{assignment.max_score}
                    </span>
                  )}
                  {(s.plagiarism_matches?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/20 text-destructive text-xs font-semibold">
                      <AlertCircle className="w-3 h-3" /> {s.plagiarism_score ?? 0}% match
                    </span>
                  )}
                </div>
              </div>

              {(s.plagiarism_matches?.length ?? 0) > 0 && (
                <div className="border-l-2 border-destructive pl-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Similar to:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.plagiarism_matches!.map((m) => (
                      <span
                        key={m.peer_submission_id}
                        className="px-2 py-0.5 rounded bg-destructive/15 text-destructive font-medium"
                      >
                        {m.peer_name} — {m.similarity_pct}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {s.content && (
                <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {s.content}
                </div>
              )}

              {s.file_path && (
                <button
                  onClick={() => downloadFile(s.file_path!, s.file_name || "submission")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/70 w-fit"
                >
                  <Download className="w-3.5 h-3.5" /> {s.file_name}
                </button>
              )}

              {s.ai_feedback ? (
                <AIFeedbackBlock feedback={s.ai_feedback} score={s.ai_score} />
              ) : (
                <p className="text-xs text-muted-foreground italic">No AI evaluation yet.</p>
              )}

              <button
                onClick={() => regrade(s.id)}
                disabled={grading === s.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 w-fit disabled:opacity-50"
              >
                {grading === s.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {s.ai_feedback ? "Re-grade with AI" : "Grade with AI"}
              </button>

              {editing === s.id ? (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex gap-2 items-end">
                    <div className="w-32">
                      <label className="text-xs text-muted-foreground block">Score</label>
                      <input
                        type="number"
                        max={assignment.max_score}
                        value={editForm.score}
                        onChange={(e) => setEditForm((p) => ({ ...p, score: Number(e.target.value) }))}
                        className="w-full px-3 py-1.5 rounded bg-background text-sm border border-border"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground pb-1.5">/ {assignment.max_score}</span>
                  </div>
                  <textarea
                    value={editForm.feedback}
                    onChange={(e) => setEditForm((p) => ({ ...p, feedback: e.target.value }))}
                    rows={3}
                    placeholder="Teacher feedback…"
                    className="w-full px-3 py-2 rounded bg-background text-sm border border-border resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveGrade(s.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-accent text-accent-foreground text-xs font-medium"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Grade
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-3 py-1.5 rounded bg-muted text-muted-foreground text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditing(s.id);
                    setEditForm({
                      score: s.teacher_score ?? s.ai_score ?? 0,
                      feedback: s.teacher_feedback ?? "",
                    });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-secondary text-xs text-foreground hover:bg-secondary/70 w-fit"
                >
                  <Edit2 className="w-3.5 h-3.5" /> {s.teacher_score !== null ? "Edit Grade" : "Grade"}
                </button>
              )}

              {s.teacher_feedback && editing !== s.id && (
                <div className="border-l-2 border-success pl-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-success mb-1">Teacher Feedback</p>
                  <p className="whitespace-pre-wrap">{s.teacher_feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
