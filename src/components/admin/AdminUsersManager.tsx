import { useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useUserManagement, AppRole, UserStatus, ModerationAction, ViolationType,
} from "@/hooks/useUserManagement";
import { useAuth } from "@/hooks/useAuth";
import {
  Search, Shield, GraduationCap, Pencil, User as UserIcon, History,
  RefreshCw, MoreHorizontal, Ban, PauseCircle, Trash2, RotateCcw, Flag, AlertTriangle, Clock, CheckCircle2,
  UserCheck, UserX, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { PromoteToExpertDialog, PromoteTarget } from "@/components/admin/PromoteToExpertDialog";
import { supabase } from "@/integrations/supabase/client";


const ROLES: AppRole[] = ["admin", "teacher", "editor", "student"];

const roleStyles: Record<AppRole, { icon: typeof Shield; className: string; label: string }> = {
  admin:   { icon: Shield,         className: "bg-destructive/15 text-destructive border-destructive/30",      label: "Admin" },
  teacher: { icon: GraduationCap,  className: "bg-primary/15 text-primary border-primary/30",                  label: "Teacher" },
  editor:  { icon: Pencil,         className: "bg-accent/15 text-accent border-accent/30",                     label: "Editor" },
  student: { icon: UserIcon,       className: "bg-muted text-muted-foreground border-border",                  label: "Student" },
};

const statusStyles: Record<UserStatus, { className: string; label: string }> = {
  active:    { className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", label: "Active" },
  pending:   { className: "bg-amber-500/15 text-amber-500 border-amber-500/30",       label: "Pending" },
  suspended: { className: "bg-amber-500/15 text-amber-500 border-amber-500/30",       label: "Suspended" },
  banned:    { className: "bg-destructive/15 text-destructive border-destructive/30", label: "Blocked" },
};

const actionLabels: Record<ModerationAction, string> = {
  suspend: "Suspend", ban: "Ban", delete: "Delete", restore: "Restore",
  flag: "Flag", unflag: "Unflag", approve: "Approve", block: "Block",
};

const RoleBadge = ({ role }: { role: AppRole }) => {
  const cfg = roleStyles[role];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
};

const SuspendedBadge = ({
  suspendedUntil,
  now,
}: {
  suspendedUntil: string | null;
  now: number;
}) => {
  const expired = suspendedUntil ? new Date(suspendedUntil).getTime() < now : false;
  const className = expired
    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
    : statusStyles.suspended.className;
  const label = expired ? "Suspension expired" : "Suspended";
  const Icon = expired ? CheckCircle2 : Clock;
  const tip = suspendedUntil
    ? `${expired ? "Expired" : "Active"} until ${format(new Date(suspendedUntil), "PPpp")}`
    : "Indefinite suspension — no expiry set";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 cursor-help ${className}`}>
            <Icon className="w-3 h-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{tip}</p>
          {suspendedUntil && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(suspendedUntil), { addSuffix: true })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StatusBadge = ({
  status, deleted, suspendedUntil, now,
}: {
  status: UserStatus; deleted?: boolean; suspendedUntil: string | null; now: number;
}) => {
  if (deleted) {
    return <Badge variant="outline" className={statusStyles.banned.className}>Deleted</Badge>;
  }
  if (status === "suspended") {
    return <SuspendedBadge suspendedUntil={suspendedUntil} now={now} />;
  }
  const cfg = statusStyles[status];
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
};

type ManagedUserRow = ReturnType<typeof useUserManagement>["users"][number];

type ModAction = Exclude<ModerationAction, "flag" | "unflag">;
type PendingMod = { user: ManagedUserRow; action: ModAction };
type PendingFlag = { user: ManagedUserRow };
type PendingRole = { user: ManagedUserRow; oldRole: AppRole; newRole: AppRole };
type PendingBulk =
  | { kind: "moderate"; action: Exclude<ModAction, "restore">; users: ManagedUserRow[] }
  | { kind: "flag"; users: ManagedUserRow[] };

export const AdminUsersManager = () => {
  const { user: currentUser } = useAuth();
  const {
    users, audit, moderationAudit, loading, error,
    changeRole, moderateUser, hardDeleteUser, flagUser,
    bulkModerate, bulkFlag, promoteToExpert, demoteFromExpert, refresh,
  } = useUserManagement();


  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [auditTab, setAuditTab] = useState<"hidden" | "roles" | "moderation">("hidden");

  const [pendingRole, setPendingRole] = useState<PendingRole | null>(null);
  const [pendingMod, setPendingMod] = useState<PendingMod | null>(null);
  const [pendingFlag, setPendingFlag] = useState<PendingFlag | null>(null);
  const [pendingBulk, setPendingBulk] = useState<PendingBulk | null>(null);

  const [reason, setReason] = useState("");
  const [suspendUntil, setSuspendUntil] = useState("");
  const [violationType, setViolationType] = useState<ViolationType>("plagiarism");
  const [deleteMode, setDeleteMode] = useState<"soft" | "hard">("soft");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [promoteTarget, setPromoteTarget] = useState<PromoteTarget | null>(null);
  const [promoteInitialSpecs, setPromoteInitialSpecs] = useState<string[]>([]);


  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Live ticker so suspension expiry indicators refresh
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (u.display_name || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const c = { total: users.length, active: 0, pending: 0, suspended: 0, banned: 0, flagged: 0 };
    users.forEach((u) => {
      c[u.status]++;
      if (u.violation_count > 0) c.flagged++;
    });
    return c;
  }, [users]);

  // Selection helpers — always exclude self from bulk
  const selectableIds = useMemo(
    () => filtered.filter((u) => u.user_id !== currentUser?.id).map((u) => u.user_id),
    [filtered, currentUser?.id]
  );
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selectableIds.some((id) => selected.has(id)) && !allSelected;

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const selectedUsers = useMemo(
    () => users.filter((u) => selected.has(u.user_id)),
    [users, selected]
  );

  const handleRoleSelect = (user: ManagedUserRow, newRole: AppRole) => {
    if (newRole === user.role) return;
    if (user.user_id === currentUser?.id) {
      toast.error("You cannot change your own role.");
      return;
    }
    setPendingRole({ user, oldRole: user.role, newRole });
  };

  const openModAction = (user: ManagedUserRow, action: ModAction) => {
    if (user.user_id === currentUser?.id && action !== "restore") {
      toast.error(`You cannot ${action} your own account.`);
      return;
    }
    setReason("");
    setSuspendUntil("");
    setDeleteMode("soft");
    setPendingMod({ user, action });
  };

  const openFlag = (user: ManagedUserRow) => {
    setReason("");
    setViolationType("plagiarism");
    setPendingFlag({ user });
  };

  const openPromote = async (u: ManagedUserRow) => {
    let initial: string[] = [];
    if (u.is_expert && u.expert_id) {
      const { data } = await supabase
        .from("expert_specialization_links" as any)
        .select("specialization_id")
        .eq("expert_id", u.expert_id);
      initial = ((data as any[]) ?? []).map((r) => r.specialization_id);
    }
    setPromoteInitialSpecs(initial);
    setPromoteTarget({
      user_id: u.user_id,
      display_name: u.display_name,
      email: u.email,
      is_expert: u.is_expert,
    });
  };

  const confirmDemote = async (u: ManagedUserRow) => {
    if (!confirm(`Remove Expert role from ${u.display_name || u.email}? Their expert dashboard, inbox and conversations will be removed.`)) return;
    try {
      await demoteFromExpert(u.user_id);
      toast.success("Expert role removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to remove expert");
    }
  };

  const openBulk = (kind: PendingBulk["kind"], action?: Exclude<ModAction, "restore">) => {

    if (selectedUsers.length === 0) {
      toast.error("Select at least one user.");
      return;
    }
    setReason("");
    setSuspendUntil("");
    setDeleteMode("soft");
    setViolationType("plagiarism");
    if (kind === "flag") {
      setPendingBulk({ kind: "flag", users: selectedUsers });
    } else if (action) {
      setPendingBulk({ kind: "moderate", action, users: selectedUsers });
    }
  };

  // ---------- Validation ----------
  const modValidationError = (action: ModAction, reasonText: string, until: string): string | null => {
    if ((action === "ban" || action === "delete") && !reasonText.trim()) {
      return `A reason is required to ${action} a user.`;
    }
    if (action === "suspend" && until) {
      const t = new Date(until).getTime();
      if (Number.isNaN(t)) return "Invalid expiry date.";
      if (t <= Date.now()) return "Suspension expiry must be in the future.";
    }
    return null;
  };

  const currentModError = pendingMod ? modValidationError(pendingMod.action, reason, suspendUntil) : null;
  const currentBulkError =
    pendingBulk?.kind === "moderate"
      ? modValidationError(pendingBulk.action, reason, suspendUntil)
      : null;

  // ---------- Confirm handlers ----------
  const confirmRoleChange = async () => {
    if (!pendingRole) return;
    setSavingId(pendingRole.user.user_id);
    try {
      await changeRole(pendingRole.user.user_id, pendingRole.newRole);
      toast.success(`${pendingRole.user.display_name || pendingRole.user.email} is now a ${roleStyles[pendingRole.newRole].label}`);
      setPendingRole(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  const confirmMod = async () => {
    if (!pendingMod) return;
    if (currentModError) {
      toast.error(currentModError);
      return;
    }
    setSavingId(pendingMod.user.user_id);
    try {
      if (pendingMod.action === "delete" && deleteMode === "hard") {
        await hardDeleteUser(pendingMod.user.user_id, reason.trim() || undefined);
        toast.success(`Permanently deleted ${pendingMod.user.display_name || pendingMod.user.email}`);
      } else {
        await moderateUser(
          pendingMod.user.user_id,
          pendingMod.action,
          reason.trim() || undefined,
          pendingMod.action === "suspend" && suspendUntil ? new Date(suspendUntil).toISOString() : null,
        );
        toast.success(`${actionLabels[pendingMod.action]} applied to ${pendingMod.user.display_name || pendingMod.user.email}`);
      }
      setPendingMod(null);
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setSavingId(null);
    }
  };

  const confirmFlag = async () => {
    if (!pendingFlag) return;
    setSavingId(pendingFlag.user.user_id);
    try {
      await flagUser(pendingFlag.user.user_id, violationType, reason.trim() || undefined);
      toast.success(`Flagged ${pendingFlag.user.display_name || pendingFlag.user.email} for ${violationType}`);
      setPendingFlag(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to flag user");
    } finally {
      setSavingId(null);
    }
  };

  const confirmBulk = async () => {
    if (!pendingBulk) return;
    if (pendingBulk.kind === "moderate" && currentBulkError) {
      toast.error(currentBulkError);
      return;
    }
    setBulkBusy(true);
    try {
      const ids = pendingBulk.users.map((u) => u.user_id);
      let result: { succeeded: string[]; failed: { userId: string; error: string }[] };
      if (pendingBulk.kind === "moderate") {
        const action = pendingBulk.action;
        result = await bulkModerate(
          ids,
          action,
          reason.trim() || undefined,
          action === "suspend" && suspendUntil ? new Date(suspendUntil).toISOString() : null,
          action === "delete" && deleteMode === "hard",
        );
      } else {
        result = await bulkFlag(ids, violationType, reason.trim() || undefined);
      }
      const verb =
        pendingBulk.kind === "flag"
          ? "flagged"
          : actionLabels[pendingBulk.action].toLowerCase() + "ed";
      if (result.failed.length === 0) {
        toast.success(`${result.succeeded.length} user(s) ${verb}.`);
      } else {
        toast.warning(
          `${result.succeeded.length} ${verb}, ${result.failed.length} failed: ${result.failed[0].error}`
        );
      }
      clearSelection();
      setPendingBulk(null);
    } catch (e: any) {
      toast.error(e.message || "Bulk action failed");
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            User Management & Moderation
            {counts.pending > 0 && (
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1" variant="outline">
                <Clock className="w-3 h-3" /> {counts.pending} pending
              </Badge>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {counts.total} total · {counts.active} active · {counts.pending} pending · {counts.suspended} suspended · {counts.banned} blocked · {counts.flagged} flagged
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={auditTab} onValueChange={(v) => setAuditTab(v as typeof auditTab)}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hidden">Hide history</SelectItem>
              <SelectItem value="roles">Role history</SelectItem>
              <SelectItem value="moderation">Moderation log</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as AppRole | "all")}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{roleStyles[r].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | "all")}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending approval</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
          <span className="text-xs font-medium text-foreground">
            {selected.size} selected
          </span>
          <Button size="sm" variant="outline" className="h-8 text-xs"
            onClick={() => openBulk("moderate", "suspend")}>
            <PauseCircle className="w-3.5 h-3.5 mr-1 text-amber-500" /> Suspend
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs"
            onClick={() => openBulk("moderate", "ban")}>
            <Ban className="w-3.5 h-3.5 mr-1 text-destructive" /> Ban
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs"
            onClick={() => openBulk("flag")}>
            <Flag className="w-3.5 h-3.5 mr-1 text-amber-500" /> Flag
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs"
            onClick={() => openBulk("moderate", "delete")}>
            <Trash2 className="w-3.5 h-3.5 mr-1 text-destructive" /> Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 hover:bg-secondary/30">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No users match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isSelf = u.user_id === currentUser?.id;
                const isDeleted = !!u.deleted_at;
                const checked = selected.has(u.user_id);
                return (
                  <TableRow key={u.user_id} className="hover:bg-secondary/20" data-state={checked ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleOne(u.user_id)}
                        disabled={isSelf}
                        aria-label={`Select ${u.display_name || u.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{u.display_name || "—"}</span>
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">You</Badge>
                        )}
                        {u.is_expert && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-primary/10 text-primary border-primary/30">
                            <Sparkles className="w-2.5 h-2.5" /> Expert
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        disabled={isSelf || savingId === u.user_id}
                        onValueChange={(v) => handleRoleSelect(u, v as AppRole)}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r} value={r}>{roleStyles[r].label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={u.status}
                        deleted={isDeleted}
                        suspendedUntil={u.suspended_until}
                        now={now}
                      />
                    </TableCell>
                    <TableCell>
                      {u.violation_count > 0 ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {u.violation_count}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={savingId === u.user_id}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-popover">
                          <DropdownMenuLabel className="text-xs">Approval</DropdownMenuLabel>
                          <DropdownMenuItem
                            disabled={isSelf || u.status === "active"}
                            onClick={() => openModAction(u, "approve")}
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Approve access
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf || u.status === "banned"}
                            onClick={() => openModAction(u, "block")}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserX className="w-3.5 h-3.5 mr-2" /> Block access
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs">Expert role</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openPromote(u)}>
                            <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
                            {u.is_expert ? "Edit Expert specs" : "Promote to Expert"}
                          </DropdownMenuItem>
                          {u.is_expert && (
                            <DropdownMenuItem
                              onClick={() => confirmDemote(u)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="w-3.5 h-3.5 mr-2" /> Remove Expert role
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs">Moderation</DropdownMenuLabel>

                          <DropdownMenuItem
                            disabled={isSelf || u.status === "suspended"}
                            onClick={() => openModAction(u, "suspend")}
                          >
                            <PauseCircle className="w-3.5 h-3.5 mr-2 text-amber-500" /> Suspend
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isSelf || u.status === "banned"}
                            onClick={() => openModAction(u, "ban")}
                            className="text-destructive focus:text-destructive"
                          >
                            <Ban className="w-3.5 h-3.5 mr-2" /> Ban
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={u.status === "active" && !isDeleted}
                            onClick={() => openModAction(u, "restore")}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Restore
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openFlag(u)}>
                            <Flag className="w-3.5 h-3.5 mr-2 text-amber-500" /> Flag violation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={isSelf}
                            onClick={() => openModAction(u, "delete")}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Audit panels */}
      {auditTab === "roles" && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Role Change History
            </h4>
          </div>
          <ScrollArea className="max-h-80">
            {audit.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">No role changes recorded yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {audit.map((a) => (
                  <div key={a.id} className="px-4 py-3 text-xs flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{a.changer_name}</span>
                    <span className="text-muted-foreground">changed</span>
                    <span className="font-medium text-foreground">{a.target_name}</span>
                    {a.old_role && (
                      <>
                        <span className="text-muted-foreground">from</span>
                        <RoleBadge role={a.old_role} />
                      </>
                    )}
                    <span className="text-muted-foreground">→</span>
                    <RoleBadge role={a.new_role} />
                    <span className="text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(a.changed_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {auditTab === "moderation" && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Moderation Action Log
            </h4>
          </div>
          <ScrollArea className="max-h-80">
            {moderationAudit.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">No moderation actions recorded yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {moderationAudit.map((a) => (
                  <div key={a.id} className="px-4 py-3 text-xs space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{a.admin_name}</span>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{a.action}</Badge>
                      <span className="text-muted-foreground">on</span>
                      <span className="font-medium text-foreground">{a.target_name}</span>
                      <span className="text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {a.reason && (
                      <p className="text-muted-foreground pl-1 italic">"{a.reason}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Role change confirm */}
      <AlertDialog open={!!pendingRole} onOpenChange={(o) => !o && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change user role?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to change <strong>{pendingRole?.user.display_name || pendingRole?.user.email}</strong>'s role.</p>
                {pendingRole && (
                  <div className="flex items-center gap-2 justify-center py-2">
                    <RoleBadge role={pendingRole.oldRole} />
                    <span className="text-muted-foreground">→</span>
                    <RoleBadge role={pendingRole.newRole} />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!savingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={!!savingId}>
              {savingId ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single-user moderation confirm */}
      <AlertDialog open={!!pendingMod} onOpenChange={(o) => !o && setPendingMod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingMod && actionLabels[pendingMod.action]} {pendingMod?.user.display_name || pendingMod?.user.email}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {pendingMod?.action === "ban" && (
                  <p className="text-destructive">This permanently blocks the user from signing in.</p>
                )}
                {pendingMod?.action === "delete" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Delete mode</Label>
                    <RadioGroup value={deleteMode} onValueChange={(v) => setDeleteMode(v as "soft" | "hard")}>
                      <div className="flex items-start gap-2 rounded-md border border-border p-2.5">
                        <RadioGroupItem value="soft" id="del-soft" className="mt-0.5" />
                        <Label htmlFor="del-soft" className="flex-1 cursor-pointer space-y-0.5 font-normal">
                          <div className="text-sm font-medium">Soft delete</div>
                          <div className="text-xs text-muted-foreground">
                            Bans the user and marks the account as deleted. Data is preserved and recoverable.
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-start gap-2 rounded-md border border-destructive/40 p-2.5">
                        <RadioGroupItem value="hard" id="del-hard" className="mt-0.5" />
                        <Label htmlFor="del-hard" className="flex-1 cursor-pointer space-y-0.5 font-normal">
                          <div className="text-sm font-medium text-destructive">Hard delete</div>
                          <div className="text-xs text-muted-foreground">
                            Permanently removes the auth account. This cannot be undone.
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                {pendingMod?.action === "suspend" && (
                  <p>The user will not be able to sign in until restored or the suspension expires.</p>
                )}
                {pendingMod?.action === "restore" && (
                  <p>The user will be reactivated and able to sign in again.</p>
                )}
                <div className="space-y-2">
                  <Label className="text-xs">
                    Reason
                    {(pendingMod?.action === "ban" || pendingMod?.action === "delete") && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      pendingMod?.action === "ban" || pendingMod?.action === "delete"
                        ? "Required — recorded in the audit log"
                        : "Recorded in the audit log"
                    }
                    rows={2}
                  />
                </div>
                {pendingMod?.action === "suspend" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Suspend until (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={suspendUntil}
                      onChange={(e) => setSuspendUntil(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Leave blank for an indefinite suspension. If set, must be in the future.
                    </p>
                  </div>
                )}
                {currentModError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {currentModError}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!savingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMod}
              disabled={!!savingId || !!currentModError}
              className={
                pendingMod?.action === "ban" || pendingMod?.action === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {savingId
                ? "Applying…"
                : pendingMod?.action === "delete" && deleteMode === "hard"
                ? "Permanently delete"
                : `Confirm ${pendingMod ? actionLabels[pendingMod.action].toLowerCase() : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flag dialog */}
      <AlertDialog open={!!pendingFlag} onOpenChange={(o) => !o && setPendingFlag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flag {pendingFlag?.user.display_name || pendingFlag?.user.email}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Records a violation against this user. Their flag count increases.</p>
                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select value={violationType} onValueChange={(v) => setViolationType(v as ViolationType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plagiarism">Plagiarism</SelectItem>
                      <SelectItem value="cheating">Cheating</SelectItem>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Details (optional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What happened?"
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!savingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFlag} disabled={!!savingId}>
              {savingId ? "Saving…" : "Flag user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk action confirm */}
      <AlertDialog open={!!pendingBulk} onOpenChange={(o) => !o && setPendingBulk(null)}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingBulk?.kind === "flag"
                ? `Flag ${pendingBulk.users.length} users?`
                : pendingBulk
                ? `${actionLabels[pendingBulk.action]} ${pendingBulk.users.length} users?`
                : ""}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Each user receives an individual, audit-logged action. Failures are reported per user.
                </p>
                <ScrollArea className="max-h-32 rounded-md border border-border p-2">
                  <ul className="text-xs space-y-1">
                    {pendingBulk?.users.map((u) => (
                      <li key={u.user_id} className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground truncate">
                          {u.display_name || u.email}
                        </span>
                        <span className="text-muted-foreground text-[10px]">{u.email}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>

                {pendingBulk?.kind === "moderate" && pendingBulk.action === "delete" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Delete mode (applied to all selected)</Label>
                    <RadioGroup value={deleteMode} onValueChange={(v) => setDeleteMode(v as "soft" | "hard")}>
                      <div className="flex items-start gap-2 rounded-md border border-border p-2.5">
                        <RadioGroupItem value="soft" id="bulk-del-soft" className="mt-0.5" />
                        <Label htmlFor="bulk-del-soft" className="flex-1 cursor-pointer text-sm font-normal">
                          Soft delete — preserve data
                        </Label>
                      </div>
                      <div className="flex items-start gap-2 rounded-md border border-destructive/40 p-2.5">
                        <RadioGroupItem value="hard" id="bulk-del-hard" className="mt-0.5" />
                        <Label htmlFor="bulk-del-hard" className="flex-1 cursor-pointer text-sm font-normal text-destructive">
                          Hard delete — permanently remove all selected accounts
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {pendingBulk?.kind === "flag" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Violation type</Label>
                    <Select value={violationType} onValueChange={(v) => setViolationType(v as ViolationType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plagiarism">Plagiarism</SelectItem>
                        <SelectItem value="cheating">Cheating</SelectItem>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">
                    Reason
                    {pendingBulk?.kind === "moderate" &&
                      (pendingBulk.action === "ban" || pendingBulk.action === "delete") && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                  </Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      pendingBulk?.kind === "moderate" &&
                      (pendingBulk.action === "ban" || pendingBulk.action === "delete")
                        ? "Required — recorded for every user"
                        : "Applied to every user in the audit log"
                    }
                    rows={2}
                  />
                </div>

                {pendingBulk?.kind === "moderate" && pendingBulk.action === "suspend" && (
                  <div className="space-y-2">
                    <Label className="text-xs">Suspend until (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={suspendUntil}
                      onChange={(e) => setSuspendUntil(e.target.value)}
                    />
                  </div>
                )}

                {currentBulkError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {currentBulkError}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulk}
              disabled={bulkBusy || !!currentBulkError}
              className={
                pendingBulk?.kind === "moderate" &&
                (pendingBulk.action === "ban" || pendingBulk.action === "delete")
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {bulkBusy ? "Applying…" : `Apply to ${pendingBulk?.users.length ?? 0} user(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PromoteToExpertDialog
        target={promoteTarget}
        initialSpecializationIds={promoteInitialSpecs}
        onClose={() => setPromoteTarget(null)}
        onConfirm={async (specIds, meta) => {
          if (!promoteTarget) return;
          try {
            await promoteToExpert(promoteTarget.user_id, specIds, meta);
            toast.success(promoteTarget.is_expert ? "Expert profile updated" : "User promoted to Expert");
          } catch (e: any) {
            toast.error(e.message || "Failed to promote user");
            throw e;
          }
        }}
      />
    </div>

  );
};
