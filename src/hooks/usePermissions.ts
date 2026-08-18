import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

export type PermissionKey = `${string}:${string}`;

interface PermissionsState {
  loading: boolean;
  set: Set<PermissionKey>;
  isAdmin: boolean;
}

const ALL_MODULES = ["courses", "resources", "assignments", "admin_panel", "users"] as const;
const ALL_ACTIONS = ["view", "create", "edit", "delete", "manage"] as const;

const adminAllPermissions = (): Set<PermissionKey> => {
  const s = new Set<PermissionKey>();
  ALL_MODULES.forEach((m) => ALL_ACTIONS.forEach((a) => s.add(`${m}:${a}` as PermissionKey)));
  return s;
};

export const usePermissions = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [state, setState] = useState<PermissionsState>({ loading: true, set: new Set(), isAdmin: false });

  const load = useCallback(async () => {
    if (!user) {
      setState({ loading: false, set: new Set(), isAdmin: false });
      return;
    }

    if (isAdmin) {
      setState({ loading: false, set: adminAllPermissions(), isAdmin: true });
      return;
    }

    try {
      const nowIso = new Date().toISOString();

      // Load user's role assignments (non-expired)
      const { data: rolesRows } = await supabase
        .from("user_roles_v2")
        .select("role_id, expires_at")
        .eq("user_id", user.id);

      const activeRoleIds = (rolesRows ?? [])
        .filter((r) => !r.expires_at || r.expires_at > nowIso)
        .map((r) => r.role_id);

      const set = new Set<PermissionKey>();

      if (activeRoleIds.length) {
        const { data: rolePerms } = await supabase
          .from("role_permissions")
          .select("module, action")
          .in("role_id", activeRoleIds);
        (rolePerms ?? []).forEach((p) => set.add(`${p.module}:${p.action}` as PermissionKey));
      }

      // Apply per-user overrides
      const { data: overrides } = await supabase
        .from("user_permission_overrides")
        .select("module, action, effect, expires_at")
        .eq("user_id", user.id);

      (overrides ?? []).forEach((o) => {
        if (o.expires_at && o.expires_at <= nowIso) return;
        const key = `${o.module}:${o.action}` as PermissionKey;
        if (o.effect === "allow") set.add(key);
        else if (o.effect === "deny") set.delete(key);
      });

      setState({ loading: false, set, isAdmin: false });
    } catch (e) {
      console.warn("Failed to load permissions:", e);
      setState({ loading: false, set: new Set(), isAdmin: false });
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (adminLoading) return;
    void load();
    const handler = () => void load();
    window.addEventListener("admin_activity_changed", handler);
    return () => window.removeEventListener("admin_activity_changed", handler);
  }, [load, adminLoading]);

  const can = useCallback(
    (module: string, action: string) => {
      if (state.isAdmin) return true;
      return state.set.has(`${module}:${action}` as PermissionKey);
    },
    [state],
  );

  return { can, loading: state.loading || adminLoading, isAdmin: state.isAdmin, refresh: load };
};
