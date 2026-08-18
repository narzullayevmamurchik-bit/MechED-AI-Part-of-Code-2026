import { useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import {
  type CalendarEvent,
  eventRange,
  isStartDay,
  isEndDay,
} from "@/hooks/useAssignmentCalendar";
import { STATUS_STYLES, isUpcomingSoon } from "./statusStyles";

interface Props {
  cursor: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelectEvent: (event: CalendarEvent) => void;
}

const HOUR_PX = 48; // height per hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MS_PER_HOUR = 60 * 60 * 1000;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

interface PositionedEvent {
  event: CalendarEvent;
  startHourFloat: number;
  endHourFloat: number;
  isStart: boolean;
  isEnd: boolean;
  column: number;
  columns: number;
}

/**
 * Lay out overlapping events into side-by-side columns (Google Calendar style).
 * O(n^2) — fine for a single day's worth of events.
 */
const layoutColumns = (
  items: Array<Omit<PositionedEvent, "column" | "columns">>,
): PositionedEvent[] => {
  const sorted = [...items].sort(
    (a, b) => a.startHourFloat - b.startHourFloat || b.endHourFloat - a.endHourFloat,
  );
  // Each item gets the lowest available column index that does not overlap.
  const placed: Array<PositionedEvent & { _end: number }> = [];
  for (const it of sorted) {
    const overlapping = placed.filter(
      (p) => !(p.endHourFloat <= it.startHourFloat || p.startHourFloat >= it.endHourFloat),
    );
    const used = new Set(overlapping.map((p) => p.column));
    let col = 0;
    while (used.has(col)) col++;
    placed.push({ ...it, column: col, columns: 1, _end: it.endHourFloat });
  }
  // Compute total columns per overlap cluster.
  for (const p of placed) {
    const cluster = placed.filter(
      (q) => !(q.endHourFloat <= p.startHourFloat || q.startHourFloat >= p.endHourFloat),
    );
    p.columns = Math.max(...cluster.map((c) => c.column)) + 1;
  }
  return placed.map(({ _end, ...rest }) => rest);
};

export const DayView = ({ cursor, eventsByDay, onSelectEvent }: Props) => {
  const events = eventsByDay.get(dayKey(cursor)) || [];

  const dayStart = useMemo(() => {
    const d = new Date(cursor);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [cursor]);
  const dayEnd = useMemo(() => {
    const d = new Date(cursor);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [cursor]);

  const positioned = useMemo<PositionedEvent[]>(() => {
    const items = events
      .map((e) => {
        const r = eventRange(e);
        if (!r) return null;
        const [start, end] = r;
        // Clamp to current day
        const clampedStart = start.getTime() < dayStart.getTime() ? dayStart : start;
        const clampedEnd = end.getTime() > dayEnd.getTime() ? dayEnd : end;
        const startHourFloat =
          (clampedStart.getTime() - dayStart.getTime()) / MS_PER_HOUR;
        let endHourFloat = (clampedEnd.getTime() - dayStart.getTime()) / MS_PER_HOUR;
        // Enforce a minimum visible height so instant deadlines stay clickable
        if (endHourFloat - startHourFloat < 0.5) endHourFloat = startHourFloat + 0.5;
        return {
          event: e,
          startHourFloat,
          endHourFloat,
          isStart: isStartDay(e, cursor),
          isEnd: isEndDay(e, cursor),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return layoutColumns(items);
  }, [events, dayStart, dayEnd, cursor]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {format(cursor, "EEEE")}
        </p>
        <p className="text-lg font-semibold text-foreground">{format(cursor, "PPP")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {events.length} {events.length === 1 ? "assignment" : "assignments"} active
        </p>
      </div>

      <div className="max-h-[640px] overflow-y-auto">
        <div className="relative flex">
          {/* Hour gutter */}
          <div className="w-16 shrink-0 border-r border-border">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="px-3 pt-1 text-[11px] text-muted-foreground border-b border-border/60"
              >
                {format(new Date().setHours(h, 0, 0, 0), "h a")}
              </div>
            ))}
          </div>

          {/* Event canvas */}
          <div
            className="relative flex-1"
            style={{ height: HOUR_PX * 24 }}
          >
            {/* Hour grid lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ top: h * HOUR_PX, height: HOUR_PX }}
                className="absolute inset-x-0 border-b border-border/60"
              />
            ))}

            {/* Now indicator */}
            {format(cursor, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && (
              <NowLine />
            )}

            {/* Positioned events */}
            {positioned.map((p) => {
              const s = STATUS_STYLES[p.event.status];
              const top = p.startHourFloat * HOUR_PX;
              const height = (p.endHourFloat - p.startHourFloat) * HOUR_PX;
              const widthPct = 100 / p.columns;
              const leftPct = p.column * widthPct;
              const soon = isUpcomingSoon(p.event.deadline, p.event.status);
              const r = eventRange(p.event)!;
              return (
                <button
                  key={p.event.id + "-" + p.column}
                  type="button"
                  onClick={() => onSelectEvent(p.event)}
                  title={`${p.event.title}\n${format(r[0], "PPp")} → ${format(r[1], "PPp")}`}
                  style={{
                    top,
                    height: Math.max(height, 22),
                    left: `calc(${leftPct}% + 4px)`,
                    width: `calc(${widthPct}% - 8px)`,
                  }}
                  className={cn(
                    "absolute text-left border px-2 py-1 overflow-hidden transition-colors",
                    "hover:ring-2 focus:outline-none focus:ring-2",
                    s.chipBg,
                    s.chipBorder,
                    s.ring,
                    p.isStart ? "rounded-t-md" : "rounded-t-none border-t-dashed",
                    p.isEnd ? "rounded-b-md" : "rounded-b-none border-b-dashed",
                    soon && "animate-pulse",
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
                    <span className="text-[10px] shrink-0">{p.event.courseIcon}</span>
                    <span className={cn("truncate text-xs font-medium", s.chipText)}>
                      {p.event.title}
                    </span>
                    {p.isEnd && p.event.status === "overdue" && (
                      <AlertTriangle className={cn("w-3 h-3 shrink-0", s.chipText)} />
                    )}
                  </div>
                  {height >= 36 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {p.isStart ? format(r[0], "p") : "…"} → {p.isEnd ? format(r[1], "p") : "…"}
                    </p>
                  )}
                </button>
              );
            })}

            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No assignments active on this day.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NowLine = () => {
  const now = new Date();
  const top = (now.getHours() + now.getMinutes() / 60) * HOUR_PX;
  return (
    <div
      style={{ top }}
      className="absolute inset-x-0 z-10 pointer-events-none"
    >
      <div className="relative h-px bg-accent">
        <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-accent" />
      </div>
    </div>
  );
};
