import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Award, Clock, Upload, AlertTriangle, CheckCircle2, Users, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarRole } from "@/hooks/useAssignmentCalendar";
import { STATUS_LABEL, STATUS_STYLES } from "./statusStyles";

interface Props {
  event: CalendarEvent | null;
  role: CalendarRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (event: CalendarEvent) => void;
  onGrade?: (event: CalendarEvent) => void;
}

export const EventDetailSheet = ({
  event,
  role,
  open,
  onOpenChange,
  onSubmit,
  onGrade,
}: Props) => {
  if (!event) return null;
  const s = STATUS_STYLES[event.status];
  const overdue = event.status === "overdue";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{event.courseIcon}</span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{event.courseTitle}</p>
              <SheetTitle className="text-left text-base">{event.title}</SheetTitle>
            </div>
          </div>
          <SheetDescription className="sr-only">Assignment details</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Status pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold",
                s.chipBg,
                s.chipBorder,
                s.chipText,
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
              {STATUS_LABEL[event.status]}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
              Max {event.maxScore} pts
            </span>
            {role !== "student" && typeof event.submissionCount === "number" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
                <Users className="w-3 h-3" /> {event.gradedCount ?? 0}/{event.submissionCount}{" "}
                graded
              </span>
            )}
          </div>

          {/* Timeline: assigned -> deadline */}
          {(event.assignedAt || event.deadline) && (
            <div className="bg-secondary/40 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarRange className="w-3.5 h-3.5" /> Timeline
              </div>
              {event.assignedAt && (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Assigned</p>
                    <p className="text-sm text-foreground">{format(event.assignedAt, "PPp")}</p>
                  </div>
                </div>
              )}
              {event.deadline && (
                <div className="flex items-start gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", s.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Due</p>
                    <p className="text-sm font-medium text-foreground">{format(event.deadline, "PPp")}</p>
                    <p
                      className={cn(
                        "text-xs",
                        overdue ? "text-[hsl(var(--status-overdue))]" : "text-muted-foreground",
                      )}
                    >
                      {isPast(event.deadline)
                        ? `Closed ${formatDistanceToNow(event.deadline)} ago`
                        : `Due in ${formatDistanceToNow(event.deadline)}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Description</p>
              <div className="text-sm text-foreground bg-secondary/40 rounded-lg p-3 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          )}

          {/* Student score */}
          {role === "student" && event.status === "graded" && event.teacherScore != null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--status-graded)/0.15)] border border-[hsl(var(--status-graded)/0.4)]">
              <Award className="w-4 h-4 text-[hsl(var(--status-graded))]" />
              <span className="text-sm font-semibold text-[hsl(var(--status-graded))]">
                Score: {event.teacherScore}/{event.maxScore}
              </span>
            </div>
          )}

          {role === "student" && overdue && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--status-overdue)/0.15)] border border-[hsl(var(--status-overdue)/0.4)]">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-overdue))]" />
              <span className="text-xs text-[hsl(var(--status-overdue))]">
                The deadline has passed. Submit ASAP — late work may not be accepted.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {role === "student" && onSubmit && event.status !== "graded" && (
              <Button onClick={() => onSubmit(event)} className="flex-1">
                <Upload className="w-4 h-4 mr-1.5" />
                {event.status === "submitted" ? "Resubmit" : "Submit Work"}
              </Button>
            )}
            {role === "student" && event.status === "graded" && (
              <Button variant="secondary" className="flex-1" disabled>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Completed
              </Button>
            )}
            {role !== "student" && onGrade && (
              <Button onClick={() => onGrade(event)} className="flex-1">
                Open Submissions
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
