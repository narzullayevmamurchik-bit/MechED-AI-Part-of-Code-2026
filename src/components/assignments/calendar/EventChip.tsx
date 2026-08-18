import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { CalendarEvent } from "@/hooks/useAssignmentCalendar";
import { eventRange } from "@/hooks/useAssignmentCalendar";
import { STATUS_STYLES, isUpcomingSoon } from "./statusStyles";

interface Props {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  compact?: boolean;
  /** When rendering as a multi-day span, indicates this segment's edges. */
  isStart?: boolean;
  isEnd?: boolean;
}

export const EventChip = ({
  event,
  onClick,
  compact = false,
  isStart = true,
  isEnd = true,
}: Props) => {
  const s = STATUS_STYLES[event.status];
  const soon = isUpcomingSoon(event.deadline, event.status);
  const range = eventRange(event);
  const multiDay =
    range !== null &&
    (range[0].toDateString() !== range[1].toDateString());

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      title={
        range
          ? `${event.title} — ${event.courseTitle}\n${format(range[0], "PPp")} → ${format(range[1], "PPp")}`
          : `${event.title} — ${event.courseTitle}`
      }
      className={cn(
        "w-full text-left border transition-colors group",
        "hover:ring-2 focus:outline-none focus:ring-2",
        s.chipBg,
        s.chipBorder,
        s.ring,
        compact ? "px-1.5 py-0.5" : "px-2 py-1.5",
        // Round only the edges that are actual start / end of the span
        isStart ? "rounded-l-md" : "rounded-l-none border-l-0",
        isEnd ? "rounded-r-md" : "rounded-r-none border-r-0",
        soon && "animate-pulse",
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {isStart && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />}
        {isStart && <span className="text-[10px] shrink-0">{event.courseIcon}</span>}
        <span className={cn("truncate text-xs font-medium", s.chipText)}>
          {isStart ? event.title : multiDay ? "↳ continues" : event.title}
        </span>
        {isEnd && event.status === "overdue" && (
          <AlertTriangle className={cn("w-3 h-3 shrink-0", s.chipText)} />
        )}
      </div>
      {!compact && range && (isStart || isEnd) && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {isStart && isEnd
            ? multiDay
              ? `${format(range[0], "MMM d, p")} → ${format(range[1], "MMM d, p")}`
              : `${format(range[0], "p")} → ${format(range[1], "p")} · ${event.courseTitle}`
            : isStart
              ? `Starts ${format(range[0], "p")} · ${event.courseTitle}`
              : `Due ${format(range[1], "p")} · ${event.courseTitle}`}
        </p>
      )}
    </button>
  );
};
