import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "student" | "editor";
export type UserStatus = "active" | "pending" | "suspended" | "banned";
export type ModerationAction =
  | "suspend"
  | "ban"
  | "delete"
  | "restore"
  | "flag"
  | "unflag"
  | "approve"
  | "block";
export type ViolationType = "plagiarism" | "cheating" | "harassment" | "other";

export type ManagedUser = {
  user_id: string;
  display_name: string | null;
  email: string;
  role: AppRole;
  created_at: string;
  status: UserStatus;
  violation_count: number;
  suspended_until: string | null;
  deleted_at: string | null;
  last_reason: string | null;
  is_expert: boolean;
  expert_id: string | null;
};


export type RoleAuditEntry = {
  id: string;
  target_user_id: string;
  changed_by: string;
  old_role: AppRole | null;
  new_role: AppRole;
  action: string;
  changed_at: string;
  target_name?: string | null;
  changer_name?: string | null;
};

export type ModerationAuditEntry = {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: ModerationAction;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  target_name?: string | null;
  admin_name?: string | null;
};

export const useUserManagement = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [audit, setAudit] = useState<RoleAuditEntry[]>([]);
  const [moderationAudit, setModerationAudit] = useState<ModerationAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        { data: usersData, error: usersErr },
        { data: auditData, error: auditErr },
        { data: modAuditData, error: modAuditErr },
      ] = await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase
          .from("role_change_audit")
          .select("*")
          .order("changed_at", { ascending: false })
          .limit(100),
        supabase
          .from("user_actions_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (usersErr) throw usersErr;
      if (auditErr) throw auditErr;
      if (modAuditErr) throw modAuditErr;

      const userList = (usersData || []) as ManagedUser[];
      setUsers(userList);

      const nameById = new Map<string, string>();
      userList.forEach((u) => nameById.set(u.user_id, u.display_name || u.email));

      setAudit(
        (auditData || []).map((a: any) => ({
          ...a,
          target_name: nameById.get(a.target_user_id) || a.target_user_id.slice(0, 8),
          changer_name: nameById.get(a.changed_by) || a.changed_by.slice(0, 8),
        })) as RoleAuditEntry[]
      );

      setModerationAudit(
        (modAuditData || []).map((a: any) => ({
          ...a,
          target_name: nameById.get(a.target_user_id) || a.target_user_id.slice(0, 8),
          admin_name: nameById.get(a.admin_id) || a.admin_id.slice(0, 8),
        })) as ModerationAuditEntry[]
      );
    } catch (e: any) {
      console.warn("Failed to load users:", e);
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const changeRole = useCallback(
    async (targetUserId: string, newRole: AppRole) => {
      const { error } = await supabase.rpc("admin_change_user_role", {
        _target_user_id: targetUserId,
        _new_role: newRole,
      });
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const moderateUser = useCallback(
    async (
      targetUserId: string,
      action: Exclude<ModerationAction, "flag" | "unflag">,
      reason?: string,
      suspendedUntil?: string | null,
      opts?: { skipRefresh?: boolean }
    ) => {
      const { error } = await supabase.rpc("admin_moderate_user", {
        _target_user_id: targetUserId,
        _action: action,
        _reason: reason ?? null,
        _suspended_until: suspendedUntil ?? null,
      });
      if (error) throw error;
      if (!opts?.skipRefresh) await fetchAll();
    },
    [fetchAll]
  );

  const hardDeleteUser = useCallback(
    async (targetUserId: string, reason?: string, opts?: { skipRefresh?: boolean }) => {
      const { error } = await supabase.rpc("admin_hard_delete_user", {
        _target_user_id: targetUserId,
        _reason: reason ?? null,
      });
      if (error) throw error;
      if (!opts?.skipRefresh) await fetchAll();
    },
    [fetchAll]
  );

  const bulkModerate = useCallback(
    async (
      targetUserIds: string[],
      action: Exclude<ModerationAction, "flag" | "unflag" | "restore">,
      reason?: string,
      suspendedUntil?: string | null,
      hardDelete?: boolean
    ): Promise<{ succeeded: string[]; failed: { userId: string; error: string }[] }> => {
      const succeeded: string[] = [];
      const failed: { userId: string; error: string }[] = [];
      for (const id of targetUserIds) {
        try {
          if (action === "delete" && hardDelete) {
            await hardDeleteUser(id, reason, { skipRefresh: true });
          } else {
            await moderateUser(id, action, reason, suspendedUntil, { skipRefresh: true });
          }
          succeeded.push(id);
        } catch (e: any) {
          failed.push({ userId: id, error: e.message || "Failed" });
        }
      }
      await fetchAll();
      return { succeeded, failed };
    },
    [fetchAll, moderateUser, hardDeleteUser]
  );

  const bulkFlag = useCallback(
    async (
      targetUserIds: string[],
      type: ViolationType,
      details?: string
    ): Promise<{ succeeded: string[]; failed: { userId: string; error: string }[] }> => {
      const succeeded: string[] = [];
      const failed: { userId: string; error: string }[] = [];
      for (const id of targetUserIds) {
        try {
          const { error } = await supabase.rpc("admin_flag_user", {
            _target_user_id: id,
            _type: type,
            _details: details ?? null,
          });
          if (error) throw error;
          succeeded.push(id);
        } catch (e: any) {
          failed.push({ userId: id, error: e.message || "Failed" });
        }
      }
      await fetchAll();
      return { succeeded, failed };
    },
    [fetchAll]
  );

  const flagUser = useCallback(
    async (targetUserId: string, type: ViolationType, details?: string) => {
      const { error } = await supabase.rpc("admin_flag_user", {
        _target_user_id: targetUserId,
        _type: type,
        _details: details ?? null,
      });
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const promoteToExpert = useCallback(
    async (
      targetUserId: string,
      specializationIds: string[],
      meta?: { title?: string; institution?: string; bio?: string }
    ) => {
      const { error } = await supabase.rpc("admin_promote_to_expert" as any, {
        _user_id: targetUserId,
        _specialization_ids: specializationIds,
        _title: meta?.title ?? "",
        _institution: meta?.institution ?? "",
        _bio: meta?.bio ?? "",
      });
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  const demoteFromExpert = useCallback(
    async (targetUserId: string) => {
      const { error } = await supabase.rpc("admin_demote_from_expert" as any, {
        _user_id: targetUserId,
      });
      if (error) throw error;
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    users,
    audit,
    moderationAudit,
    loading,
    error,
    changeRole,
    moderateUser,
    hardDeleteUser,
    flagUser,
    bulkModerate,
    bulkFlag,
    promoteToExpert,
    demoteFromExpert,

    refresh: fetchAll,
  };
};
