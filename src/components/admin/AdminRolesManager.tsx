import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Shield, Lock, UserPlus, X, Save, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AppRole {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

interface PermissionRow {
  module: string;
  action: string;
  description: string | null;
}

interface RolePermission {
  role_id: string;
  module: string;
  action: string;
}

interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  expires_at: string | null;
}

interface UserOverride {
  id: string;
  user_id: string;
  module: string;
  action: string;
  effect: "allow" | "deny";
  expires_at: string | null;
}

interface UserRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

const MODULE_LABELS: Record<string, string> = {
  courses: "Courses",
  resources: "Resources",
  assignments: "Assignments",
  admin_panel: "Admin Panel",
  users: "Users",
};

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  manage: "Manage",
};

export const AdminRolesManager = () => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [overrides, setOverrides] = useState<UserOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [newRole, setNewRole] = useState({ key: "", name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, rpRes, usersRes, asgnRes, ovRes] = await Promise.all([
        supabase.from("app_roles").select("*").order("is_system", { ascending: false }).order("name"),
        supabase.from("permissions").select("*").order("module").order("action"),
        supabase.from("role_permissions").select("*"),
        supabase.rpc("admin_list_users"),
        supabase.from("user_roles_v2").select("*"),
        supabase.from("user_permission_overrides").select("*"),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      setRoles(rolesRes.data ?? []);
      setPermissions(permsRes.data ?? []);
      setRolePerms(rpRes.data ?? []);
      setAssignments(asgnRes.data ?? []);
      setOverrides((ovRes.data ?? []) as UserOverride[]);
      setUsers(
        (usersRes.data ?? []).map((u: any) => ({
          user_id: u.user_id,
          display_name: u.display_name,
          email: u.email,
        })),
      );
      if (!selectedRoleId && rolesRes.data?.length) setSelectedRoleId(rolesRes.data[0].id);
    } catch (e) {
      console.warn("Failed to load roles:", e);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const modules = useMemo(() => Array.from(new Set(permissions.map((p) => p.module))), [permissions]);
  const actions = useMemo(() => Array.from(new Set(permissions.map((p) => p.action))), [permissions]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const memberCount = (roleId: string) => assignments.filter((a) => a.role_id === roleId).length;

  const isGranted = (roleId: string, module: string, action: string) =>
    rolePerms.some((rp) => rp.role_id === roleId && rp.module === module && rp.action === action);

  const togglePermission = async (module: string, action: string) => {
    if (!selectedRoleId) return;
    if (selectedRole?.key === "admin") {
      toast.info("Admins always have all permissions");
      return;
    }
    const enabled = !isGranted(selectedRoleId, module, action);
    const { error } = await supabase.rpc("admin_set_role_permission", {
      _role_id: selectedRoleId,
      _module: module,
      _action: action,
      _enabled: enabled,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${enabled ? "Granted" : "Revoked"} ${module}:${action}`);
    await load();
  };

  const createRole = async () => {
    if (!newRole.key.trim() || !newRole.name.trim()) {
      toast.error("Key and name are required");
      return;
    }
    const { error } = await supabase.rpc("admin_create_role", {
      _key: newRole.key,
      _name: newRole.name,
      _description: newRole.description,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role created");
    setNewRole({ key: "", name: "", description: "" });
    setCreatingRole(false);
    await load();
  };

  const deleteRole = async (role: AppRole) => {
    if (role.is_system) return;
    if (!confirm(`Delete role "${role.name}"? Users will lose this role.`)) return;
    const { error } = await supabase.rpc("admin_delete_role", { _role_id: role.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (selectedRoleId === role.id) setSelectedRoleId(null);
    toast.success("Role deleted");
    await load();
  };

  const userAssignments = (uid: string) => assignments.filter((a) => a.user_id === uid);
  const userOverrides = (uid: string) => overrides.filter((o) => o.user_id === uid);
  const selectedUser = users.find((u) => u.user_id === selectedUserId);

  const assignRoleToUser = async (roleId: string, expires: string | null) => {
    if (!selectedUserId) return;
    const { error } = await supabase.rpc("admin_assign_role", {
      _user_id: selectedUserId,
      _role_id: roleId,
      _expires_at: expires,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role assigned");
    await load();
  };

  const revokeRoleFromUser = async (roleId: string) => {
    if (!selectedUserId) return;
    const { error } = await supabase.rpc("admin_revoke_role", {
      _user_id: selectedUserId,
      _role_id: roleId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role revoked");
    await load();
  };

  const setOverride = async (module: string, action: string, effect: "allow" | "deny") => {
    if (!selectedUserId) return;
    const { error } = await supabase.rpc("admin_set_user_override", {
      _user_id: selectedUserId,
      _module: module,
      _action: action,
      _effect: effect,
      _expires_at: null,
      _reason: null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${effect === "allow" ? "Allowed" : "Denied"} ${module}:${action}`);
    await load();
  };

  const clearOverride = async (module: string, action: string) => {
    if (!selectedUserId) return;
    const { error } = await supabase.rpc("admin_clear_user_override", {
      _user_id: selectedUserId,
      _module: module,
      _action: action,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Override cleared");
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" /> Roles & Permissions
          </h2>
          <p className="text-sm text-muted-foreground">
            Create custom roles, toggle permissions per module, and assign roles to users.
          </p>
        </div>
        <button
          onClick={() => setCreatingRole(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90"
        >
          <Plus className="w-3.5 h-3.5" /> New Role
        </button>
      </div>

      {creatingRole && (
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={newRole.key}
              onChange={(e) => setNewRole((p) => ({ ...p, key: e.target.value }))}
              placeholder="Key (e.g. employer)"
              className="px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
            />
            <input
              value={newRole.name}
              onChange={(e) => setNewRole((p) => ({ ...p, name: e.target.value }))}
              placeholder="Display name"
              className="px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
            />
          </div>
          <input
            value={newRole.description}
            onChange={(e) => setNewRole((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg bg-background text-sm text-foreground border border-border"
          />
          <div className="flex gap-2">
            <button onClick={createRole} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm">
              <Save className="w-4 h-4" /> Create
            </button>
            <button onClick={() => setCreatingRole(false)} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Roles list */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Roles</h3>
          {roles.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRoleId(r.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group ${
                selectedRoleId === r.id ? "bg-accent/10 border border-accent/30" : "hover:bg-secondary/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                  {r.is_system && <Lock className="w-3 h-3 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {r.key} · {memberCount(r.id)} {memberCount(r.id) === 1 ? "user" : "users"}
                </p>
              </div>
              {!r.is_system && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteRole(r);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4">
          {selectedRole ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{selectedRole.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedRole.description || "No description"}</p>
              </div>

              {selectedRole.key === "admin" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-foreground">
                  <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  Administrators always have full access. The matrix below is informational only.
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Module</th>
                      {actions.map((a) => (
                        <th key={a} className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">
                          {ACTION_LABELS[a] ?? a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => (
                      <tr key={m} className="border-b border-border/50">
                        <td className="py-2 px-2 text-sm text-foreground">{MODULE_LABELS[m] ?? m}</td>
                        {actions.map((a) => {
                          const exists = permissions.some((p) => p.module === m && p.action === a);
                          if (!exists) return <td key={a} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                          const granted = selectedRole.key === "admin" || isGranted(selectedRole.id, m, a);
                          return (
                            <td key={a} className="text-center py-2 px-2">
                              <button
                                onClick={() => void togglePermission(m, a)}
                                disabled={selectedRole.key === "admin"}
                                className={`w-10 h-5 rounded-full transition-colors relative ${
                                  granted ? "bg-accent" : "bg-muted"
                                } ${selectedRole.key === "admin" ? "opacity-60 cursor-not-allowed" : ""}`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                                    granted ? "translate-x-5" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Select a role to edit permissions.</p>
          )}
        </div>
      </div>

      {/* User assignments */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Assign roles to users
        </h3>

        <select
          value={selectedUserId ?? ""}
          onChange={(e) => setSelectedUserId(e.target.value || null)}
          className="w-full md:w-96 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Select a user…</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.display_name ?? u.email ?? u.user_id}
            </option>
          ))}
        </select>

        {selectedUser && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Current roles</p>
              <div className="flex flex-wrap gap-2">
                {userAssignments(selectedUser.user_id).map((a) => {
                  const role = roles.find((r) => r.id === a.role_id);
                  if (!role) return null;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-xs text-foreground"
                    >
                      <span>{role.name}</span>
                      {a.expires_at && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" /> until {new Date(a.expires_at).toLocaleDateString()}
                        </span>
                      )}
                      <button onClick={() => void revokeRoleFromUser(role.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                {userAssignments(selectedUser.user_id).length === 0 && (
                  <p className="text-xs text-muted-foreground">No roles assigned.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Add a role</p>
              <RoleAdder roles={roles} assigned={userAssignments(selectedUser.user_id).map((a) => a.role_id)} onAssign={assignRoleToUser} />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Per-user overrides</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {userOverrides(selectedUser.user_id).map((o) => (
                  <div
                    key={o.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
                      o.effect === "allow"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-destructive/10 border-destructive/30 text-destructive"
                    }`}
                  >
                    <span>
                      {o.effect.toUpperCase()} · {o.module}:{o.action}
                    </span>
                    <button onClick={() => void clearOverride(o.module, o.action)} className="opacity-70 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {userOverrides(selectedUser.user_id).length === 0 && (
                  <p className="text-xs text-muted-foreground">No overrides.</p>
                )}
              </div>
              <OverrideAdder permissions={permissions} onSet={setOverride} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RoleAdder = ({
  roles,
  assigned,
  onAssign,
}: {
  roles: AppRole[];
  assigned: string[];
  onAssign: (roleId: string, expires: string | null) => void;
}) => {
  const [roleId, setRoleId] = useState("");
  const [expires, setExpires] = useState("");
  const available = roles.filter((r) => !assigned.includes(r.id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="">Pick a role…</option>
        {available.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={expires}
        onChange={(e) => setExpires(e.target.value)}
        className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent"
        title="Optional expiry (temporary role)"
      />
      <button
        disabled={!roleId}
        onClick={() => {
          onAssign(roleId, expires ? new Date(expires).toISOString() : null);
          setRoleId("");
          setExpires("");
        }}
        className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50"
      >
        Assign
      </button>
    </div>
  );
};

const OverrideAdder = ({
  permissions,
  onSet,
}: {
  permissions: PermissionRow[];
  onSet: (module: string, action: string, effect: "allow" | "deny") => void;
}) => {
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const modules = Array.from(new Set(permissions.map((p) => p.module)));
  const actions = permissions.filter((p) => p.module === module).map((p) => p.action);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={module}
        onChange={(e) => {
          setModule(e.target.value);
          setAction("");
        }}
        className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="">Module…</option>
        {modules.map((m) => (
          <option key={m} value={m}>
            {MODULE_LABELS[m] ?? m}
          </option>
        ))}
      </select>
      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        disabled={!module}
        className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
      >
        <option value="">Action…</option>
        {actions.map((a) => (
          <option key={a} value={a}>
            {ACTION_LABELS[a] ?? a}
          </option>
        ))}
      </select>
      <button
        disabled={!module || !action}
        onClick={() => {
          onSet(module, action, "allow");
          setModule("");
          setAction("");
        }}
        className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium disabled:opacity-50"
      >
        Allow
      </button>
      <button
        disabled={!module || !action}
        onClick={() => {
          onSet(module, action, "deny");
          setModule("");
          setAction("");
        }}
        className="px-3 py-2 rounded-lg bg-destructive/20 text-destructive text-sm font-medium disabled:opacity-50"
      >
        Deny
      </button>
    </div>
  );
};
