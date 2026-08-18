import type { DerivedStatus } from "@/hooks/useAssignmentCalendar";

export const STATUS_LABEL: Record<DerivedStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  graded: "Graded",
  overdue: "Overdue",
};

// Map status -> token-based className pieces (no hard-coded hex/rgb).
export const STATUS_STYLES: Record<
  DerivedStatus,
  { dot: string; chipBg: string; chipText: string; chipBorder: string; ring: string }
> = {
  pending: {
    dot: "bg-[hsl(var(--status-pending))]",
    chipBg: "bg-[hsl(var(--status-pending)/0.15)]",
    chipText: "text-[hsl(var(--status-pending))]",
    chipBorder: "border-[hsl(var(--status-pending)/0.4)]",
    ring: "ring-[hsl(var(--status-pending)/0.5)]",
  },
  submitted: {
    dot: "bg-[hsl(var(--status-submitted))]",
    chipBg: "bg-[hsl(var(--status-submitted)/0.15)]",
    chipText: "text-[hsl(var(--status-submitted))]",
    chipBorder: "border-[hsl(var(--status-submitted)/0.4)]",
    ring: "ring-[hsl(var(--status-submitted)/0.5)]",
  },
  graded: {
    dot: "bg-[hsl(var(--status-graded))]",
    chipBg: "bg-[hsl(var(--status-graded)/0.15)]",
    chipText: "text-[hsl(var(--status-graded))]",
    chipBorder: "border-[hsl(var(--status-graded)/0.4)]",
    ring: "ring-[hsl(var(--status-graded)/0.5)]",
  },
  overdue: {
    dot: "bg-[hsl(var(--status-overdue))]",
    chipBg: "bg-[hsl(var(--status-overdue)/0.15)]",
    chipText: "text-[hsl(var(--status-overdue))]",
    chipBorder: "border-[hsl(var(--status-overdue)/0.4)]",
    ring: "ring-[hsl(var(--status-overdue)/0.5)]",
  },
};

export const isUpcomingSoon = (deadline: Date | null, status: DerivedStatus) => {
  if (!deadline) return false;
  if (status === "graded" || status === "submitted") return false;
  const ms = deadline.getTime() - Date.now();
  return ms > 0 && ms <= 48 * 60 * 60 * 1000;
};
