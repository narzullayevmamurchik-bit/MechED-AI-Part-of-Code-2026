import { useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
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
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const WeekView = ({ cursor, eventsByDay, onSelectEvent }: Props) => {
  const days = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const today = new Date();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const dayEvents = eventsByDay.get(dayKey(day)) || [];
          return (
            <div
              key={day.toISOString()}
              className="border-r border-border last:border-r-0 min-h-[420px] flex flex-col"
            >
              <div
                className={cn(
                  "px-3 py-2 border-b border-border text-center sticky top-0 bg-secondary/40 backdrop-blur",
                  isToday && "bg-accent/20",
                )}
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE")}
                </p>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    isToday ? "text-accent" : "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>
              <div className="p-2 flex flex-col gap-1.5 overflow-y-auto flex-1">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/60 text-center py-3">—</p>
                ) : (
                  dayEvents.map((e) => (
                    <EventChip
                      key={e.id}
                      event={e}
                      onClick={onSelectEvent}
                      isStart={isStartDay(e, day)}
                      isEnd={isEndDay(e, day)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
