import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MonthlyCalendarGrid, { type CalendarItem } from "@/components/MonthlyCalendarGrid";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function mondayOf(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(d.getDate() + n);
  return copy;
}

function parseWeekStart(param?: string): Date {
  if (param) {
    const d = new Date(param);
    if (!isNaN(d.getTime())) return mondayOf(d);
  }
  return mondayOf(new Date());
}

function parseMonth(param?: string): { year: number; month: number } {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function fmtDayHeader(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
}

function fmtMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function isoWeek(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ─── Item classification ──────────────────────────────────────────────────────

type ItemColor = "green" | "yellow" | "red" | "gray";

function taskColor(status: string, dueDate: Date, today: Date): ItemColor {
  const closed = ["closed"].includes(status.toLowerCase());
  if (closed) return "gray";
  if (dueDate < today) return "red";
  if (dueDate.toDateString() === today.toDateString()) return "yellow";
  return "green";
}

function milestoneColor(completed: boolean, dueDate: Date, today: Date): ItemColor {
  if (completed) return "gray";
  if (dueDate < today) return "red";
  if (dueDate.toDateString() === today.toDateString()) return "yellow";
  return "green";
}

const COLOR_CLASSES: Record<ItemColor, string> = {
  green:  "bg-green-900/40 text-green-300 border border-green-800/50",
  yellow: "bg-yellow-900/40 text-yellow-300 border border-yellow-800/50",
  red:    "bg-red-900/40 text-red-300 border border-red-800/50",
  gray:   "bg-gray-800/60 text-gray-500",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; week?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { view, week: weekParam, month: monthParam } = await searchParams;
  const isMonthly = view === "monthly";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Weekly data ──────────────────────────────────────────────────────────
  let weekStart!: Date;
  let weekDays!: Date[];
  let prevWeekParam!: string;
  let nextWeekParam!: string;

  // ── Monthly data ─────────────────────────────────────────────────────────
  let monthYear!: number;
  let monthMonth!: number;
  let prevMonthParam!: string;
  let nextMonthParam!: string;

  let rangeStart: Date;
  let rangeEnd: Date;

  if (!isMonthly) {
    weekStart = parseWeekStart(weekParam);
    weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
    rangeStart = weekStart;
    rangeEnd = addDays(weekStart, 5); // exclusive end

    const prevMonday = addDays(weekStart, -7);
    const nextMonday = addDays(weekStart, 7);
    prevWeekParam = isoWeek(prevMonday);
    nextWeekParam = isoWeek(nextMonday);
  } else {
    const parsed = parseMonth(monthParam);
    monthYear = parsed.year;
    monthMonth = parsed.month;
    rangeStart = new Date(monthYear, monthMonth, 1);
    rangeEnd = new Date(monthYear, monthMonth + 1, 1); // exclusive

    const prevM = monthMonth === 0 ? 11 : monthMonth - 1;
    const prevY = monthMonth === 0 ? monthYear - 1 : monthYear;
    const nextM = monthMonth === 11 ? 0 : monthMonth + 1;
    const nextY = monthMonth === 11 ? monthYear + 1 : monthYear;
    prevMonthParam = isoMonth(prevY, prevM);
    nextMonthParam = isoMonth(nextY, nextM);
  }

  // Fetch tasks and milestones in range
  const [tasks, milestones] = await Promise.all([
    prisma.intervalsTask.findMany({
      where: { dueDate: { gte: rangeStart, lt: rangeEnd } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.intervalsMilestone.findMany({
      where: { dueDate: { gte: rangeStart, lt: rangeEnd } },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  // ── Render: Weekly view ───────────────────────────────────────────────────

  if (!isMonthly) {
    // Group tasks + milestones by day-of-week index (0–4 = Mon–Fri)
    type DayItem = {
      id: string;
      title: string;
      projectId: string;
      projectName: string;
      color: ItemColor;
      type: "task" | "milestone";
    };

    const dayBuckets: DayItem[][] = weekDays.map(() => []);

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      d.setHours(0, 0, 0, 0);
      const idx = weekDays.findIndex(
        (wd) => wd.toDateString() === d.toDateString()
      );
      if (idx < 0) continue;
      dayBuckets[idx].push({
        id: task.id,
        title: task.title,
        projectId: task.project.id,
        projectName: task.project.name,
        color: taskColor(task.status, d, today),
        type: "task",
      });
    }

    for (const m of milestones) {
      if (!m.dueDate) continue;
      const d = new Date(m.dueDate);
      d.setHours(0, 0, 0, 0);
      const idx = weekDays.findIndex(
        (wd) => wd.toDateString() === d.toDateString()
      );
      if (idx < 0) continue;
      dayBuckets[idx].push({
        id: m.id,
        title: m.title,
        projectId: m.project.id,
        projectName: m.project.name,
        color: milestoneColor(m.completed, d, today),
        type: "milestone",
      });
    }

    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header + toggle */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Timeline</h1>
            <p className="text-gray-500 text-sm">
              Week of {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex bg-gray-800 rounded-lg p-0.5">
              <Link href="?view=weekly" className="px-3 py-1 rounded-md text-xs font-medium bg-gray-700 text-white">
                Week
              </Link>
              <Link href={`?view=monthly&month=${isoMonth(today.getFullYear(), today.getMonth())}`} className="px-3 py-1 rounded-md text-xs font-medium text-gray-400 hover:text-white transition-colors">
                Month
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href={`?view=weekly&week=${prevWeekParam}`}
                className="px-2 py-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                ←
              </Link>
              <Link
                href="?view=weekly"
                className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                Today
              </Link>
              <Link
                href={`?view=weekly&week=${nextWeekParam}`}
                className="px-2 py-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                →
              </Link>
            </div>
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-5 gap-px bg-gray-800 rounded-lg overflow-hidden min-h-[400px]">
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === today.toDateString();
            const items = dayBuckets[idx];

            return (
              <div
                key={day.toISOString()}
                className={`flex flex-col bg-gray-950 ${isToday ? "ring-1 ring-inset ring-blue-700" : ""}`}
              >
                {/* Day header */}
                <div className={`px-3 py-2 border-b border-gray-800 ${isToday ? "bg-blue-950/30" : "bg-gray-900"}`}>
                  <p className={`text-xs font-medium ${isToday ? "text-blue-400" : "text-gray-400"}`}>
                    {fmtDayHeader(day)}
                  </p>
                </div>

                {/* Items */}
                <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-gray-700 text-xs px-1 pt-1">—</p>
                  ) : (
                    items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/projects/${item.projectId}`}
                        title={`${item.title} — ${item.projectName}`}
                      >
                        <div className={`px-2 py-1 rounded text-xs leading-snug mb-0.5 ${COLOR_CLASSES[item.color]}`}>
                          {item.type === "milestone" && (
                            <span className="mr-0.5 opacity-70">◆</span>
                          )}
                          <span className="font-medium block truncate">{item.title}</span>
                          <span className="text-[10px] opacity-60 block truncate">{item.projectName}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-900/60 border border-green-800/50 inline-block" />
            On track
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-900/60 border border-yellow-800/50 inline-block" />
            Due today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-900/60 border border-red-800/50 inline-block" />
            Overdue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-800 inline-block" />
            Closed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="opacity-70">◆</span>
            Milestone
          </span>
        </div>
      </div>
    );
  }

  // ── Render: Monthly view ──────────────────────────────────────────────────

  const calendarItems: CalendarItem[] = [
    ...tasks.map((task): CalendarItem => {
      const d = new Date(task.dueDate!);
      d.setHours(0, 0, 0, 0);
      const closed = task.status.toLowerCase() === "closed";
      return {
        id: task.id,
        title: task.title,
        projectId: task.project.id,
        projectName: task.project.name,
        dueDate: d.toISOString(),
        type: "task",
        closed,
        overdue: !closed && d < today,
        dueToday: !closed && d.toDateString() === today.toDateString(),
      };
    }),
    ...milestones.map((m): CalendarItem => {
      const d = new Date(m.dueDate!);
      d.setHours(0, 0, 0, 0);
      return {
        id: m.id,
        title: m.title,
        projectId: m.project.id,
        projectName: m.project.name,
        dueDate: d.toISOString(),
        type: "milestone",
        closed: m.completed,
        overdue: !m.completed && d < today,
        dueToday: !m.completed && d.toDateString() === today.toDateString(),
      };
    }),
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header + toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Timeline</h1>
          <p className="text-gray-500 text-sm">{fmtMonthTitle(monthYear, monthMonth)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-gray-800 rounded-lg p-0.5">
            <Link href="?view=weekly" className="px-3 py-1 rounded-md text-xs font-medium text-gray-400 hover:text-white transition-colors">
              Week
            </Link>
            <Link href={`?view=monthly&month=${isoMonth(monthYear, monthMonth)}`} className="px-3 py-1 rounded-md text-xs font-medium bg-gray-700 text-white">
              Month
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`?view=monthly&month=${prevMonthParam}`}
              className="px-2 py-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            >
              ←
            </Link>
            <Link
              href={`?view=monthly&month=${isoMonth(today.getFullYear(), today.getMonth())}`}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            >
              Today
            </Link>
            <Link
              href={`?view=monthly&month=${nextMonthParam}`}
              className="px-2 py-1 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
            >
              →
            </Link>
          </div>
        </div>
      </div>

      <MonthlyCalendarGrid year={monthYear} month={monthMonth} items={calendarItems} />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-900/60 inline-block" />
          On track
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-yellow-900/60 inline-block" />
          Due today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-900/60 inline-block" />
          Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-800 inline-block" />
          Closed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="opacity-70">◆</span>
          Milestone
        </span>
      </div>
    </div>
  );
}
