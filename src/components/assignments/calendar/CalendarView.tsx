import { useMemo, useState } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useAssignmentCalendar,
  type CalendarEvent,
  type DerivedStatus,
} from "@/hooks/useAssignmentCalendar";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { EventDetailSheet } from "./EventDetailSheet";
import { STATUS_LABEL, STATUS_STYLES } from "./statusStyles";

type ViewMode = "day" | "week" | "month";

interface CourseOption {
  id: string;
  title: string;
  icon: string;
}

interface Props {
  courses: CourseOption[];
  onSubmit?: (event: CalendarEvent) => void;
  onGrade?: (event: CalendarEvent) => void;
}

const ALL_STATUSES: DerivedStatus[] = ["pending", "submitted", "graded", "overdue"];

const computeRange = (view: ViewMode, cursor: Date): [Date, Date] => {
  switch (view) {
    case "day":
      return [startOfDay(cursor), endOfDay(cursor)];
    case "week":
      return [startOfWeek(cursor, { weekStartsOn: 1 }), endOfWeek(cursor, { weekStartsOn: 1 })];
    case "month": {
      // Pad to whole weeks so the month grid covers all visible cells
      const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
      return [start, end];
    }
  }
};

export const CalendarView = ({ courses, onSubmit, onGrade }: Props) => {
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [courseFilter, setCourseFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<DerivedStatus[]>([]);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const range = useMemo(() => computeRange(view, cursor), [view, cursor]);

  const { events, eventsByDay, loading, role } = useAssignmentCalendar({
    range,
    courseIds: courseFilter,
  });

  // Apply status filter client-side
  const filteredEvents = useMemo(
    () => (statusFilter.length ? events.filter((e) => statusFilter.includes(e.status)) : events),
    [events, statusFilter],
  );
  const filteredByDay = useMemo(() => {
    if (!statusFilter.length) return eventsByDay;
    const map = new Map<string, CalendarEvent[]>();
    eventsByDay.forEach((arr, key) => {
      const f = arr.filter((e) => statusFilter.includes(e.status));
      if (f.length) map.set(key, f);
    });
    return map;
  }, [eventsByDay, statusFilter]);

  const navigate = (dir: -1 | 1) => {
    setCursor((c) =>
      view === "day" ? addDays(c, dir) : view === "week" ? addWeeks(c, dir) : addMonths(c, dir),
    );
  };

  const headerLabel =
    view === "day"
      ? format(cursor, "PPP")
      : view === "week"
        ? `${format(range[0], "MMM d")} – ${format(range[1], "MMM d, yyyy")}`
        : format(cursor, "MMMM yyyy");

  const toggleCourse = (id: string) =>
    setCourseFilter((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  const toggleStatus = (s: DerivedStatus) =>
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const clearFilters = () => {
    setCourseFilter([]);
    setStatusFilter([]);
  };
  const hasFilters = courseFilter.length > 0 || statusFilter.length > 0;

  const openEvent = (e: CalendarEvent) => {
    setSelected(e);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)} aria-label="Next">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h2 className="text-base font-semibold text-foreground ml-2">{headerLabel}</h2>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
          </div>

          <div className="inline-flex rounded-lg bg-secondary p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                  view === v
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-start gap-3 flex-wrap pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((s) => {
              const styles = STATUS_STYLES[s];
              const active = statusFilter.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors",
                    active ? `${styles.chipBg} ${styles.chipBorder} ${styles.chipText}` : "border-border text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
                  {STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
        </div>

        {courses.length > 0 && (
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Filter className="w-3.5 h-3.5" /> Course:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c) => {
                const active = courseFilter.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCourse(c.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors",
                      active
                        ? "bg-accent/15 border-accent/40 text-accent"
                        : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <span>{c.icon}</span>
                    <span className="truncate max-w-[140px]">{c.title}</span>
                  </button>
                );
              })}
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
          <span>{filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"} shown</span>
          <span className="opacity-50">·</span>
          <span className="capitalize">Viewing as {role}</span>
        </div>
      </div>

      {/* Grid */}
      {view === "month" && (
        <MonthView
          cursor={cursor}
          events={filteredEvents}
          eventsByDay={filteredByDay}
          onSelectEvent={openEvent}
          onSelectDay={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      )}
      {view === "week" && (
        <WeekView
          cursor={cursor}
          events={filteredEvents}
          eventsByDay={filteredByDay}
          onSelectEvent={openEvent}
        />
      )}
      {view === "day" && (
        <DayView cursor={cursor} eventsByDay={filteredByDay} onSelectEvent={openEvent} />
      )}

      <EventDetailSheet
        event={selected}
        role={role}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={
          onSubmit
            ? (e) => {
                setSheetOpen(false);
                onSubmit(e);
              }
            : undefined
        }
        onGrade={
          onGrade
            ? (e) => {
                setSheetOpen(false);
                onGrade(e);
              }
            : undefined
        }
      />
    </div>
  );
};
