import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/hooks/useAssignmentCalendar";
import { isStartDay, isEndDay } from "@/hooks/useAssignmentCalendar";
import { EventChip } from "./EventChip";

interface Props {
  cursor: Date;
  events: CalendarEvent[];
  eventsByDay: Map<string, CalendarEvent[]>;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectDay: (day: Date) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const MonthView = ({ cursor, eventsByDay, onSelectEvent, onSelectDay }: Props) => {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const today = new Date();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          const dayEvents = eventsByDay.get(dayKey(day)) || [];
          const visible = dayEvents.slice(0, 3);
          const hidden = dayEvents.length - visible.length;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[96px] border-b border-r border-border p-1.5 flex flex-col gap-1 cursor-pointer transition-colors",
                "hover:bg-secondary/30",
                !inMonth && "bg-background/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-accent text-accent-foreground font-bold"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{dayEvents.length}</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {visible.map((e) => (
                  <div key={e.id} onClick={(ev) => ev.stopPropagation()}>
                    <EventChip
                      event={e}
                      onClick={onSelectEvent}
                      compact
                      isStart={isStartDay(e, day)}
                      isEnd={isEndDay(e, day)}
                    />
                  </div>
                ))}
                {hidden > 0 && (
                  <span className="text-[10px] text-muted-foreground px-1">
                    +{hidden} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
