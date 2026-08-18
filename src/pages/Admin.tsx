import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MechEdLogo } from "@/components/MechEdLogo";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminCourses, DbCourse, DbChapter, DbLesson } from "@/hooks/useAdminCourses";
import { useEngineeringFields } from "@/hooks/useEngineeringFields";
import { AdminResourceManagerDb } from "@/components/admin/AdminResourceManagerDb";
import { AdminExpertsManagerDb } from "@/components/admin/AdminExpertsManagerDb";
import { AdminFeedbackViewer } from "@/components/admin/AdminFeedbackViewer";
import { AdminAssignmentsManager } from "@/components/admin/AdminAssignmentsManager";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { AdminBonusGrants } from "@/components/admin/AdminBonusGrants";
import { AdminCompaniesManager } from "@/components/admin/AdminCompaniesManager";
import { AdminDashboardPanel } from "@/components/admin/AdminDashboardPanel";
import { AdminRolesManager } from "@/components/admin/AdminRolesManager";
import { AdminOcrManager } from "@/components/admin/AdminOcrManager";
import { AdminFieldsManager } from "@/components/admin/AdminFieldsManager";
import { Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, Eye, EyeOff, Video, FileText, HelpCircle, GripVertical, Upload, BookOpen, Library, Users, MessageSquare, ClipboardList, ShieldCheck, Trophy, Briefcase, LayoutDashboard, Shield, ScanLine, FolderTree } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─── tiny helpers ─── */
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const typeIcon = (t: string) => {
  if (t === "video") return <Video className="w-4 h-4 text-accent" />;
  if (t === "reading") return <FileText className="w-4 h-4 text-primary" />;
  return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
};

/* ─── Lesson Row ─── */
const LessonRow = ({ lesson, onUpdate, onDelete }: { lesson: DbLesson; onUpdate: (id: string, d: any) => void; onDelete: (id: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: lesson.title,
    type: lesson.type,
    duration: lesson.duration || "",
    video_url: lesson.video_url || "",
    pdf_url: lesson.pdf_url || "",
    content_md: lesson.content_md || "",
    summary: lesson.summary || "",
    xp_reward: lesson.xp_reward ?? 10,
  });

  const save = () => { onUpdate(lesson.id, form); setEditing(false); };

  if (editing) {
    return (
      <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Lesson title" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border">
            <option value="video">Video</option>
            <option value="reading">Reading / Markdown</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="Duration (e.g. 30m)" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
          <input type="number" min={0} value={form.xp_reward} onChange={e => setForm(p => ({ ...p, xp_reward: Number(e.target.value) }))} placeholder="XP reward" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
          {form.type === "video" ? (
            <input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="Video embed URL" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
          ) : (
            <input value={form.pdf_url} onChange={e => setForm(p => ({ ...p, pdf_url: e.target.value }))} placeholder="PDF URL (optional)" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
          )}
        </div>
        <input value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} placeholder="Short summary (one-liner)" className="w-full px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
        {form.type !== "video" && (
          <textarea value={form.content_md} onChange={e => setForm(p => ({ ...p, content_md: e.target.value }))} placeholder="Lesson content (Markdown supported: headings, lists, code, LaTeX $...$)" rows={8} className="w-full px-3 py-2 rounded bg-background text-xs font-mono text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent resize-y" />
        )}
        <div className="flex gap-2">
          <button onClick={save} className="flex items-center gap-1 px-3 py-1 rounded bg-accent text-accent-foreground text-xs font-medium"><Save className="w-3 h-3" /> Save</button>
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1 rounded bg-muted text-muted-foreground text-xs"><X className="w-3 h-3" /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 group">
      <GripVertical className="w-4 h-4 text-muted-foreground/30" />
      {typeIcon(lesson.type)}
      <span className="text-sm text-foreground flex-1">{lesson.title}</span>
      {lesson.xp_reward ? <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent">+{lesson.xp_reward} XP</span> : null}
      <span className="text-xs text-muted-foreground">{lesson.duration}</span>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"><Edit2 className="w-3.5 h-3.5" /></button>
      <button onClick={() => onDelete(lesson.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
};

/* ─── Chapter Card ─── */
const ChapterCard = ({ chapter, onUpdateChapter, onDeleteChapter, onCreateLesson, onUpdateLesson, onDeleteLesson }: {
  chapter: DbChapter;
  onUpdateChapter: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onCreateLesson: (chapterId: string, data: any) => void;
  onUpdateLesson: (id: string, d: any) => void;
  onDeleteLesson: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [adding, setAdding] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: "", type: "video", duration: "", video_url: "", pdf_url: "" });

  const saveChapter = () => { onUpdateChapter(chapter.id, title); setEditing(false); };
  const addLesson = () => {
    if (!newLesson.title.trim()) return;
    onCreateLesson(chapter.id, newLesson);
    setNewLesson({ title: "", type: "video", duration: "", video_url: "", pdf_url: "" });
    setAdding(false);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 cursor-pointer" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        {editing ? (
          <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
            <input value={title} onChange={e => setTitle(e.target.value)} className="px-2 py-1 rounded bg-background text-sm text-foreground border border-border flex-1 focus:outline-none focus:ring-1 focus:ring-accent" />
            <button onClick={saveChapter} className="p-1 text-accent"><Save className="w-4 h-4" /></button>
            <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            <span className="text-sm font-medium text-foreground flex-1">{chapter.title}</span>
            <span className="text-xs text-muted-foreground mr-2">{chapter.lessons.length} lessons</span>
            <button onClick={e => { e.stopPropagation(); setEditing(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={e => { e.stopPropagation(); onDeleteChapter(chapter.id); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </>
        )}
      </div>

      {open && (
        <div className="p-3 space-y-1">
          {chapter.lessons.map(l => (
            <LessonRow key={l.id} lesson={l} onUpdate={onUpdateLesson} onDelete={onDeleteLesson} />
          ))}

          {adding ? (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))} placeholder="Lesson title" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
                <select value={newLesson.type} onChange={e => setNewLesson(p => ({ ...p, type: e.target.value }))} className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border">
                  <option value="video">Video</option>
                  <option value="reading">Reading / PDF</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={newLesson.duration} onChange={e => setNewLesson(p => ({ ...p, duration: e.target.value }))} placeholder="Duration" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
                {newLesson.type === "video" ? (
                  <input value={newLesson.video_url} onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))} placeholder="YouTube embed URL" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
                ) : (
                  <input value={newLesson.pdf_url} onChange={e => setNewLesson(p => ({ ...p, pdf_url: e.target.value }))} placeholder="PDF URL" className="px-3 py-1.5 rounded bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={addLesson} className="flex items-center gap-1 px-3 py-1 rounded bg-accent text-accent-foreground text-xs font-medium"><Plus className="w-3 h-3" /> Add</button>
                <button onClick={() => setAdding(false)} className="flex items-center gap-1 px-3 py-1 rounded bg-muted text-muted-foreground text-xs"><X className="w-3 h-3" /> Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 mt-2 px-3 py-1">
              <Plus className="w-3 h-3" /> Add Lesson
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Course Editor ─── */
const CourseEditor = ({ course, onBack, hooks }: { course: DbCourse; onBack: () => void; hooks: ReturnType<typeof useAdminCourses> }) => {
  const { fields } = useEngineeringFields();
  const [form, setForm] = useState({
    title: course.title,
    description: course.description || "",
    icon: course.icon,
    duration: course.duration || "",
    slug: course.slug,
    field_id: course.field_id || "",
    specialization_id: course.specialization_id || "",
    level: course.level || "beginner",
    language: course.language || "en",
    thumbnail_url: course.thumbnail_url || "",
    estimated_hours: course.estimated_hours ?? 0,
    outcomesText: (course.learning_outcomes || []).join("\n"),
    skillsText: (course.skills || []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [newChapter, setNewChapter] = useState("");

  const specs = useMemo(() => {
    const f = fields.find((x) => x.id === form.field_id);
    return f?.specializations ?? [];
  }, [fields, form.field_id]);

  const save = async () => {
    setSaving(true);
    await hooks.updateCourse(course.id, {
      title: form.title,
      description: form.description,
      icon: form.icon,
      duration: form.duration,
      slug: form.slug,
      field_id: form.field_id || null,
      specialization_id: form.specialization_id || null,
      level: form.level,
      language: form.language,
      thumbnail_url: form.thumbnail_url || null,
      estimated_hours: Number(form.estimated_hours) || null,
      learning_outcomes: form.outcomesText.split("\n").map((s) => s.trim()).filter(Boolean),
      skills: form.skillsText.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
  };

  const togglePublish = () => hooks.updateCourse(course.id, { published: !course.published });
  const addChapter = async () => {
    if (!newChapter.trim()) return;
    await hooks.createChapter(course.id, newChapter);
    setNewChapter("");
  };

  const freshCourse = hooks.courses.find(c => c.id === course.id) || course;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-accent hover:underline">← Back to Courses</button>
        <div className="flex gap-2">
          <button onClick={togglePublish} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${freshCourse.published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
            {freshCourse.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {freshCourse.published ? "Published" : "Draft"}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Course Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
            <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Engineering Field</label>
            <select value={form.field_id} onChange={e => setForm(p => ({ ...p, field_id: e.target.value, specialization_id: "" }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">— None —</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.icon ? `${f.icon} ` : ""}{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Specialization</label>
            <select value={form.specialization_id} onChange={e => setForm(p => ({ ...p, specialization_id: e.target.value }))} disabled={!form.field_id} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50">
              <option value="">— None —</option>
              {specs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Level</label>
            <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Language</label>
            <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="en">English</option>
              <option value="uz">Uzbek</option>
              <option value="ru">Russian</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Icon (emoji)</label>
            <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Duration label</label>
            <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 18h 30m" className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Estimated hours</label>
            <input type="number" min={0} value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Thumbnail URL</label>
            <input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://…" className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Learning outcomes (one per line)</label>
            <textarea value={form.outcomesText} onChange={e => setForm(p => ({ ...p, outcomesText: e.target.value }))} rows={4} placeholder="Design a gear train…\nAnalyse stress concentrations…" className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Skills (comma-separated)</label>
            <textarea value={form.skillsText} onChange={e => setForm(p => ({ ...p, skillsText: e.target.value }))} rows={4} placeholder="CAD, FEA, GD&T" className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
          </div>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Chapters & Lessons</h3>
        </div>

        <div className="space-y-3">
          {freshCourse.chapters.map(ch => (
            <ChapterCard
              key={ch.id}
              chapter={ch}
              onUpdateChapter={hooks.updateChapter}
              onDeleteChapter={hooks.deleteChapter}
              onCreateLesson={hooks.createLesson}
              onUpdateLesson={hooks.updateLesson}
              onDeleteLesson={hooks.deleteLesson}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <input value={newChapter} onChange={e => setNewChapter(e.target.value)} placeholder="New chapter title" className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent" onKeyDown={e => e.key === "Enter" && addChapter()} />
          <button onClick={addChapter} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Chapter
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── File Upload Section ─── */
const FileUploadSection = () => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from("course-materials").list("", { limit: 100 });
      if (error) throw error;

      setFiles((data || []).map(f => ({
        name: f.name,
        url: supabase.storage.from("course-materials").getPublicUrl(f.name).data.publicUrl,
      })));
    } catch (error) {
      console.warn("Failed to load uploaded materials:", error);
      setFiles([]);
    }
  };

  useEffect(() => {
    void fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("course-materials").upload(path, file);
      if (error) throw error;
      await fetchFiles();
    } catch (error) {
      console.warn("Failed to upload course material:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Uploaded Materials</h3>
      <p className="text-xs text-muted-foreground">Upload PDFs, images, or other course materials. Copy the URL to use in lessons.</p>

      <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium cursor-pointer hover:bg-accent/90 w-fit">
        <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload File"}
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {files.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {files.map(f => (
            <div key={f.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground flex-1 truncate">{f.name}</span>
              <button onClick={() => navigator.clipboard.writeText(f.url)} className="text-xs text-accent hover:underline">Copy URL</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Admin Page ─── */
const Admin = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const hooks = useAdminCourses();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", icon: "📚", duration: "" });
  const [tab, setTab] = useState("dashboard");

  if (adminLoading || hooks.loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const course = hooks.courses.find(c => c.id === selectedCourse);

  const handleCreate = async () => {
    if (!newCourse.title.trim()) return;
    await hooks.createCourse({ ...newCourse, slug: slugify(newCourse.title) });
    setNewCourse({ title: "", description: "", icon: "📚", duration: "" });
    setCreating(false);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center gap-3">
          <MechEdLogo size="sm" />
          <div>
            <h1 className="text-xl font-bold text-foreground">MechED AI · Administration Center</h1>
            <p className="text-sm text-muted-foreground">Manage all platform content without coding</p>
          </div>
        </header>

        <div className="p-8 max-w-6xl">
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="bg-card border border-border h-auto p-1 gap-1 flex-wrap">
              <TabsTrigger value="dashboard" className="gap-1.5 text-xs"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</TabsTrigger>
              <TabsTrigger value="courses" className="gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5" /> Courses</TabsTrigger>
              <TabsTrigger value="fields" className="gap-1.5 text-xs"><FolderTree className="w-3.5 h-3.5" /> Fields</TabsTrigger>
              <TabsTrigger value="assignments" className="gap-1.5 text-xs"><ClipboardList className="w-3.5 h-3.5" /> Assignments</TabsTrigger>
              <TabsTrigger value="resources" className="gap-1.5 text-xs"><Library className="w-3.5 h-3.5" /> Resources</TabsTrigger>
              <TabsTrigger value="experts" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Experts</TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 text-xs"><ShieldCheck className="w-3.5 h-3.5" /> Users</TabsTrigger>
              <TabsTrigger value="files" className="gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" /> Files</TabsTrigger>
              <TabsTrigger value="feedback" className="gap-1.5 text-xs"><MessageSquare className="w-3.5 h-3.5" /> Feedback</TabsTrigger>
              <TabsTrigger value="gamification" className="gap-1.5 text-xs"><Trophy className="w-3.5 h-3.5" /> XP & Badges</TabsTrigger>
              <TabsTrigger value="companies" className="gap-1.5 text-xs"><Briefcase className="w-3.5 h-3.5" /> Companies</TabsTrigger>
              <TabsTrigger value="roles" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" /> Roles</TabsTrigger>
              <TabsTrigger value="ocr" className="gap-1.5 text-xs"><ScanLine className="w-3.5 h-3.5" /> OCR</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AdminDashboardPanel
                onQuickAction={(key) => {
                  if (key === "course") { setTab("courses"); setSelectedCourse(null); setCreating(true); }
                  else if (key === "expert") setTab("experts");
                  else if (key === "company" || key === "job") setTab("companies");
                  else if (key === "resource") setTab("resources");
                  else if (key === "project") window.location.hash = "#/collaborate";
                }}
              />
            </TabsContent>

            <TabsContent value="courses">
              {course ? (
                <CourseEditor course={course} onBack={() => setSelectedCourse(null)} hooks={hooks} />
              ) : (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Courses ({hooks.courses.length})</h3>
                    <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium">
                      <Plus className="w-3.5 h-3.5" /> New Course
                    </button>
                  </div>

                  {creating && (
                    <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} placeholder="Course title" className="px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
                        <input value={newCourse.icon} onChange={e => setNewCourse(p => ({ ...p, icon: e.target.value }))} placeholder="Icon emoji" className="px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent" />
                      </div>
                      <textarea value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} placeholder="Description" rows={2} className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
                      <div className="flex gap-2">
                        <button onClick={handleCreate} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"><Plus className="w-4 h-4" /> Create</button>
                        <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {hooks.courses.map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/30 cursor-pointer group" onClick={() => setSelectedCourse(c.id)}>
                        <span className="text-2xl">{c.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.chapters.length} chapters · {c.chapters.reduce((s, ch) => s + ch.lessons.length, 0)} lessons</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                          {c.published ? "Published" : "Draft"}
                        </span>
                        <button onClick={e => { e.stopPropagation(); hooks.deleteCourse(c.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {hooks.courses.length === 0 && !creating && (
                      <p className="text-sm text-muted-foreground text-center py-8">No courses yet. Create your first course to get started.</p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="fields">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminFieldsManager />
              </div>
            </TabsContent>



            <TabsContent value="assignments">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminAssignmentsManager />
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminResourceManagerDb />
              </div>
            </TabsContent>

            <TabsContent value="experts">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminExpertsManagerDb />
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminUsersManager />
              </div>
            </TabsContent>

            <TabsContent value="files">
              <div className="bg-card border border-border rounded-2xl p-6">
                <FileUploadSection />
              </div>
            </TabsContent>

            <TabsContent value="feedback">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminFeedbackViewer />
              </div>
            </TabsContent>

            <TabsContent value="gamification">
              <AdminBonusGrants />
            </TabsContent>

            <TabsContent value="companies">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminCompaniesManager />
              </div>
            </TabsContent>

            <TabsContent value="roles">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminRolesManager />
              </div>
            </TabsContent>

            <TabsContent value="ocr">
              <div className="bg-card border border-border rounded-2xl p-6">
                <AdminOcrManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
