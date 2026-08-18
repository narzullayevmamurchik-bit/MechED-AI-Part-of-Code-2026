import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

export type CollabProjectStatus = "pending" | "approved" | "rejected" | "archived";
export type CollabMemberRole = "lead" | "member" | "mentor";
export type CollabRequestStatus = "pending" | "approved" | "declined";
export type CollabTaskStatus = "todo" | "doing" | "done";

export interface CollabProject {
  id: string;
  title: string;
  topic: string;
  description: string;
  country_focus: string | null;
  roles: string[];
  max_team_size: number;
  status: CollabProjectStatus;
  rejection_reason: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollabMember {
  id: string;
  project_id: string;
  user_id: string;
  role: CollabMemberRole;
  role_label: string | null;
  joined_at: string;
}

export interface CollabJoinRequest {
  id: string;
  project_id: string;
  user_id: string;
  desired_role: string | null;
  message: string | null;
  status: CollabRequestStatus;
  created_at: string;
}

export interface CollabMessage {
  id: string;
  project_id: string;
  user_id: string;
  display_name: string | null;
  message: string;
  ai_flagged: boolean;
  ai_flag_reason: string | null;
  created_at: string;
}

export interface CollabFile {
  id: string;
  project_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface CollabTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: CollabTaskStatus;
  assignee_id: string | null;
  created_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useCollaboration() {
  const { user, displayName } = useAuth();
  const { isAdmin } = useAdmin();
  const [approvedProjects, setApprovedProjects] = useState<CollabProject[]>([]);
  const [myProjects, setMyProjects] = useState<CollabProject[]>([]);
  const [pendingProjects, setPendingProjects] = useState<CollabProject[]>([]);
  const [myMemberIds, setMyMemberIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: approved }, { data: mine }, { data: memberRows }, pendingRes] = await Promise.all([
        supabase.from("collab_projects" as any).select("*").eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("collab_projects" as any).select("*").eq("created_by", user.id).order("created_at", { ascending: false }),
        supabase.from("collab_members" as any).select("project_id").eq("user_id", user.id),
        isAdmin
          ? supabase.from("collab_projects" as any).select("*").eq("status", "pending").order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      setApprovedProjects((approved as unknown as CollabProject[]) || []);
      setMyProjects((mine as unknown as CollabProject[]) || []);
      setMyMemberIds(new Set(((memberRows as any[]) || []).map((r) => r.project_id as string)));
      setPendingProjects(((pendingRes as any).data as CollabProject[]) || []);
    } catch (e) {
      console.warn("collab refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const proposeProject = useCallback(
    async (input: {
      title: string;
      topic: string;
      description: string;
      country_focus?: string;
      roles: string[];
      max_team_size: number;
    }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("collab_projects" as any)
        .insert({
          title: input.title.trim(),
          topic: input.topic.trim(),
          description: input.description.trim(),
          country_focus: input.country_focus?.trim() || null,
          roles: input.roles,
          max_team_size: Math.max(2, Math.min(10, input.max_team_size)),
          status: "pending",
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return data as unknown as CollabProject;
    },
    [user, refresh],
  );

  const approveProject = useCallback(
    async (projectId: string) => {
      const { error } = await supabase
        .from("collab_projects" as any)
        .update({ status: "approved", approved_by: user?.id ?? null })
        .eq("id", projectId);
      if (error) throw error;
      await refresh();
    },
    [user, refresh],
  );

  const rejectProject = useCallback(
    async (projectId: string, reason: string) => {
      const { error } = await supabase
        .from("collab_projects" as any)
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", projectId);
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  const requestJoin = useCallback(
    async (projectId: string, desired_role: string, message: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("collab_join_requests" as any).insert({
        project_id: projectId,
        user_id: user.id,
        desired_role,
        message,
      });
      if (error) throw error;
    },
    [user],
  );

  const approveJoinRequest = useCallback(async (req: CollabJoinRequest) => {
    const { error: insErr } = await supabase.from("collab_members" as any).insert({
      project_id: req.project_id,
      user_id: req.user_id,
      role: "member",
      role_label: req.desired_role,
    });
    if (insErr && !insErr.message.includes("duplicate")) throw insErr;
    const { error } = await supabase
      .from("collab_join_requests" as any)
      .update({ status: "approved", decided_at: new Date().toISOString() })
      .eq("id", req.id);
    if (error) throw error;
  }, []);

  const declineJoinRequest = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("collab_join_requests" as any)
      .update({ status: "declined", decided_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }, []);

  // ── AI helpers ──
  const callAI = useCallback(async (action: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("collaborate", {
      body: { action, ...payload },
    });
    if (error) throw error;
    return data;
  }, []);

  return {
    user,
    displayName,
    isAdmin,
    loading,
    approvedProjects,
    myProjects,
    pendingProjects,
    myMemberIds,
    refresh,
    proposeProject,
    approveProject,
    rejectProject,
    requestJoin,
    approveJoinRequest,
    declineJoinRequest,
    callAI,
  };
}

// ── Workspace data (per-project) ──
export function useProjectWorkspace(projectId: string | null) {
  const { user, displayName } = useAuth();
  const [project, setProject] = useState<CollabProject | null>(null);
  const [members, setMembers] = useState<(CollabMember & { name: string | null })[]>([]);
  const [tasks, setTasks] = useState<CollabTask[]>([]);
  const [files, setFiles] = useState<CollabFile[]>([]);
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [joinRequests, setJoinRequests] = useState<CollabJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const isMember = members.some((m) => m.user_id === user?.id);
  const isLead = members.some((m) => m.user_id === user?.id && m.role === "lead");

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [proj, mem, tk, fl, jr] = await Promise.all([
        supabase.from("collab_projects" as any).select("*").eq("id", projectId).maybeSingle(),
        supabase.from("collab_members" as any).select("*").eq("project_id", projectId),
        supabase.from("collab_tasks" as any).select("*").eq("project_id", projectId).order("sort_order"),
        supabase.from("collab_files" as any).select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
        supabase.from("collab_join_requests" as any).select("*").eq("project_id", projectId).eq("status", "pending"),
      ]);

      setProject((proj.data as unknown as CollabProject) || null);
      const memberRows = (mem.data as unknown as CollabMember[]) || [];

      // Fetch member display names separately (profiles)
      const ids = memberRows.map((m) => m.user_id);
      let nameMap = new Map<string, string>();
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", ids);
        nameMap = new Map(((profs as any[]) || []).map((p) => [p.user_id as string, p.display_name as string]));
      }
      setMembers(memberRows.map((m) => ({ ...m, name: nameMap.get(m.user_id) ?? null })));
      setTasks((tk.data as unknown as CollabTask[]) || []);
      setFiles((fl.data as unknown as CollabFile[]) || []);
      setJoinRequests((jr.data as unknown as CollabJoinRequest[]) || []);
    } catch (e) {
      console.warn("workspace refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime: messages and tasks
  useEffect(() => {
    if (!projectId) return;
    let active = true;

    const loadMsgs = async () => {
      const { data } = await supabase
        .from("collab_messages" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (active) setMessages((data as unknown as CollabMessage[]) || []);
    };
    void loadMsgs();

    const channel = supabase
      .channel(`collab-${projectId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collab_messages", filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "INSERT") {
            const m = payload.new as CollabMessage;
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m].slice(-200)));
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
          } else if (payload.eventType === "UPDATE") {
            const upd = payload.new as CollabMessage;
            setMessages((prev) => prev.map((m) => (m.id === upd.id ? upd : m)));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collab_tasks", filter: `project_id=eq.${projectId}` },
        () => {
          if (active) void refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [projectId, refresh]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !projectId || !text.trim()) return;
      let aiFlag = { flagged: false, reason: "" };
      try {
        const { data } = await supabase.functions.invoke("collaborate", {
          body: { action: "moderate", message: text.trim() },
        });
        if (data?.flagged && (data?.severity === "medium" || data?.severity === "high")) {
          aiFlag = { flagged: true, reason: data.reason || "Flagged by AI moderator" };
        }
      } catch (e) {
        console.warn("AI moderation failed (sending anyway):", e);
      }

      const { error } = await supabase.from("collab_messages" as any).insert({
        project_id: projectId,
        user_id: user.id,
        display_name: displayName || user.email || "User",
        message: text.trim(),
        ai_flagged: aiFlag.flagged,
        ai_flag_reason: aiFlag.flagged ? aiFlag.reason : null,
      });
      if (error) throw error;
    },
    [user, displayName, projectId],
  );

  const createTask = useCallback(
    async (title: string, description?: string) => {
      if (!user || !projectId) return;
      const { error } = await supabase.from("collab_tasks" as any).insert({
        project_id: projectId,
        title,
        description: description ?? null,
        created_by: user.id,
        sort_order: tasks.length,
      });
      if (error) throw error;
      await refresh();
    },
    [user, projectId, tasks.length, refresh],
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: CollabTaskStatus) => {
      const { error } = await supabase
        .from("collab_tasks" as any)
        .update({ status })
        .eq("id", taskId);
      if (error) throw error;
      // Award contributor XP when a task is moved to done
      if (status === "done" && user) {
        try {
          await supabase.rpc("award_xp" as any, {
            _user_id: user.id,
            _amount: 30,
            _source: "collab_task_done",
            _category: "contributor",
            _source_id: taskId,
            _reason: "Completed a collaboration task",
            _awarded_by: null,
            _dedupe: true,
          });
          await supabase.rpc("record_daily_activity" as any, { _user_id: user.id });

          const { count } = await supabase
            .from("collab_tasks" as any)
            .select("id", { count: "exact", head: true })
            .eq("assignee_id", user.id)
            .eq("status", "done");
          if ((count ?? 0) >= 5) {
            await supabase.rpc("unlock_badge" as any, { _user_id: user.id, _badge_code: "task_done_5" });
          }
        } catch (e) {
          console.warn("Task XP grant failed:", e);
        }
      }
    },
    [user],
  );

  const deleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from("collab_tasks" as any).delete().eq("id", taskId);
    if (error) throw error;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!user || !projectId) throw new Error("Not ready");
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${projectId}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from("collab-files").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error } = await supabase.from("collab_files" as any).insert({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: path,
        size_bytes: file.size,
        mime_type: file.type || null,
      });
      if (error) throw error;
      await refresh();
    },
    [user, projectId, refresh],
  );

  const downloadFile = useCallback(async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("collab-files").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) throw error ?? new Error("No URL");
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  }, []);

  const deleteFile = useCallback(
    async (file: CollabFile) => {
      await supabase.storage.from("collab-files").remove([file.file_path]);
      await supabase.from("collab_files" as any).delete().eq("id", file.id);
      await refresh();
    },
    [refresh],
  );

  const approveJoin = useCallback(
    async (req: CollabJoinRequest) => {
      const { error: insErr } = await supabase.from("collab_members" as any).insert({
        project_id: req.project_id,
        user_id: req.user_id,
        role: "member",
        role_label: req.desired_role,
      });
      if (insErr && !insErr.message.includes("duplicate")) throw insErr;
      await supabase
        .from("collab_join_requests" as any)
        .update({ status: "approved", decided_at: new Date().toISOString() })
        .eq("id", req.id);
      await refresh();
    },
    [refresh],
  );

  const declineJoin = useCallback(
    async (id: string) => {
      await supabase
        .from("collab_join_requests" as any)
        .update({ status: "declined", decided_at: new Date().toISOString() })
        .eq("id", id);
      await refresh();
    },
    [refresh],
  );

  return {
    project,
    members,
    tasks,
    files,
    messages,
    joinRequests,
    isMember,
    isLead,
    loading,
    refresh,
    sendMessage,
    createTask,
    updateTaskStatus,
    deleteTask,
    uploadFile,
    downloadFile,
    deleteFile,
    approveJoin,
    declineJoin,
  };
}
