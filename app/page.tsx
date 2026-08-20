"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Frequency = "Daily" | "Weekly" | "Monthly" | "Yearly";
type Habit = { id: string; name: string; category: string; completions: string[]; frequency?: Frequency; createdAt?: string; color?: string; weekdays?: number[]; weeklyGoal?: number; paused?: boolean };
type ArchivedCompletion = { habitId: string; habitName: string; date: string };
type AppointmentRepeat = "None" | Frequency;
type Appointment = { id: string; title: string; date: string; time: string; endTime?: string; allDay: boolean; repeat: AppointmentRepeat; section: string; reminder?: number; travelMinutes?: number; location?: string; notes?: string; excludedDates?: string[]; endsBefore?: string };
type Achievement = { id: string; icon: string; title: string; description: string; unlocked: boolean };
type Reward = { id: string; name: string; cost: number; redeemed: number };
type ThemeName = "Cosmic Pastel" | "Cosy Scrapbook" | "Dreamy Cloud Garden" | "Candy Pop" | "Cute Minimal Space";
type AppPage = "Home" | "Today's Focus" | "Calendar" | "My Habits" | "Hall of Fame";
type PlantCareEffect = "water" | "sun" | "pot" | "fertiliser";
type UndoAction = { message: string; run: () => void };
type PendingRecurringMove = { id: string; fromDate: string; toDate: string };
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DEFAULT_CATEGORIES = ["Morning", "Afternoon", "Evening"];
const STORAGE_KEY = "the-chain-habits-v1";
const COLLAPSE_KEY = "the-chain-collapsed-v1";
const CATEGORIES_KEY = "the-chain-categories-v1";
const FREQUENCIES: Frequency[] = ["Daily", "Weekly", "Monthly", "Yearly"];
const APPOINTMENTS_KEY = "the-chain-appointments-v1";
const APPOINTMENT_SECTIONS_KEY = "the-chain-appointment-sections-v1";
const UK_HOLIDAYS = "UK Holidays";
const SETTINGS_KEY = "the-orbit-settings-v1";
const ACHIEVEMENTS_KEY = "the-orbit-achievements-v1";
const TOUR_KEY = "the-orbit-tour-seen-v1";
const JELLY_COLORS = ["#ccecf8", "#d4f0da", "#fff2bd", "#ddd4f6", "#f7d9e6", "#ffe0c6"];
const PLANT_TYPES = ["Hydrangea", "Rose", "Sunflower", "Cactus", "Monstera", "Lavender", "Geranium", "Tulip", "Orchid", "Peace Lily"];
const DAILY_QUOTES = ["Small steps still move you forward.", "Your future grows from what you do today.", "Progress shines brighter than perfection.", "Begin gently, but keep going.", "Every completed habit is a vote for your future.", "You can do hard things one tiny step at a time.", "Consistency turns wishes into worlds.", "Today is another chance to surprise yourself.", "Your effort counts, even when it feels small.", "Keep showing up—the stars notice.", "A calm start can create a brilliant day.", "Grow at your own pace; you are still growing.", "One good choice can change the direction of a day.", "Be proud of every promise you keep to yourself."];
const TOUR_STEPS: { page: AppPage; target: string; title: string; description: string }[] = [
  { page: "Home", target: "welcome", title: "Welcome to THE ORBIT", description: "This is your calm command centre. The Home dashboard brings today’s habits, plans, progress and your growing plant together in one place." },
  { page: "Home", target: "navigation", title: "Five spaces, one orbit", description: "Use this menu to move between Home, Today’s Focus, Calendar, My Habits and the Hall of Fame. On a phone, the same menu stays within reach at the bottom of the screen." },
  { page: "Home", target: "summary", title: "Your day at a glance", description: "These cards show today’s completed habits, upcoming plans, your best streak and both kinds of Orbit Points—without needing to open another page." },
  { page: "Home", target: "points", title: "Orbit Balance & Orbit Total", description: "Orbit Balance is what you can spend on plant care. Orbit Total is every point you have ever earned, so it never shrinks when you buy something." },
  { page: "Home", target: "summary", title: "Review your week", description: "Weekly Review, just below these cards, summarises your last seven days: completed habits, points earned, overall completion and your strongest day. It updates automatically as you record habits." },
  { page: "Home", target: "plant", title: "Grow your companion", description: "Choose a plant, then spend your Orbit Balance on water, sunshine, pots and fertiliser. Each purchase adds growth until the plant reaches level 8." },
  { page: "Home", target: "plant", title: "Meet your plant collection", description: "The collection below your plant gives every species its own growth level and name. Select a plant to care for it, type a nickname above the care shop, or use Surprise me to choose one at random." },
  { page: "Calendar", target: "calendar", title: "Plan your time", description: "Switch between month, week and day views, move through dates, or press + Plan. Drag an appointment to reschedule it; recurring plans ask whether to move one occurrence or the whole series." },
  { page: "Calendar", target: "calendar-lists", title: "Your calendar lists", description: "Open any section to see all its future appointments. Its checkbox controls whether those items appear on the calendar, and its colour picker keeps the calendar easy to scan." },
  { page: "My Habits", target: "heatmap", title: "See your momentum", description: "The Power-up Map shows twelve weeks of activity. Deeper colours mean more habits were completed on that day." },
  { page: "My Habits", target: "habits", title: "Build your routines", description: "Habits live inside your custom sections. Click a row to complete it, use the pencil to edit it, and watch its five-day history, next refresh and streak grow." },
  { page: "My Habits", target: "habits", title: "Add things quickly on mobile", description: "On smaller screens, the floating + button opens shortcuts for a new habit or appointment. It stays near the bottom navigation so you can add something from anywhere." },
  { page: "Home", target: "points", title: "Mistakes are easy to undo", description: "After deleting a habit, resetting a plant or buying plant care, an Undo message appears briefly at the bottom of the screen. Press Undo to restore the previous state." },
  { page: "Hall of Fame", target: "hall", title: "Celebrate every milestone", description: "The Hall of Fame stores achievements for first steps, streaks, planning and perfect periods. Open it and select any badge to see its details or progress." },
  { page: "Home", target: "display", title: "Make it comfortable", description: "Use Sounds to control effects, Accessibility for stronger contrast and reduced motion, and Theme to change Orbit’s look. You can retake this tour from Home at any time." },
  { page: "Home", target: "display", title: "Install Orbit like an app", description: "In Chrome on a computer or Android, press Install app here—or use the browser menu and choose Install app. On iPhone or iPad, open Orbit in Safari, tap Share, then Add to Home Screen. The installed Orbit opens in its own window; your data remains stored on that device." },
];

function OrbitLogo({ className = "" }: { className?: string }) {
  return <svg className={`orbit-logo ${className}`} viewBox="0 0 64 64" role="img" aria-label="The Orbit logo"><defs><linearGradient id="orbit-logo-planet" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#bfe9dd" /><stop offset="1" stopColor="#8fb9e8" /></linearGradient></defs><ellipse className="orbit-logo-ring orbit-logo-ring-one" cx="32" cy="32" rx="27" ry="13" /><ellipse className="orbit-logo-ring orbit-logo-ring-two" cx="32" cy="32" rx="27" ry="13" transform="rotate(60 32 32)" /><circle className="orbit-logo-planet" cx="32" cy="32" r="12" fill="url(#orbit-logo-planet)" /><path className="orbit-logo-sprout" d="M32 33c0-7 3-12 8-15M34 25c3-6 9-7 12-6-1 6-6 10-12 8M31 28c-2-5-7-7-11-5 1 5 5 8 11 7" /><circle className="orbit-logo-moon" cx="56" cy="30" r="4" /></svg>;
}

function mondayOfMonth(year: number, month: number, last = false) {
  const date = last ? new Date(year, month + 1, 0, 12) : new Date(year, month, 1, 12);
  date.setDate(date.getDate() + (last ? -((date.getDay() + 6) % 7) : (8 - date.getDay()) % 7));
  return date;
}

function easterSunday(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12);
}

function ukHolidays(year: number): Appointment[] {
  const easter = easterSunday(year); const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2); const easterMonday = new Date(easter); easterMonday.setDate(easter.getDate() + 1);
  const newYear = new Date(year, 0, 1, 12); if (newYear.getDay() === 6) newYear.setDate(3); if (newYear.getDay() === 0) newYear.setDate(2);
  const christmas = new Date(year, 11, 25, 12), boxing = new Date(year, 11, 26, 12);
  if (christmas.getDay() === 6) { christmas.setDate(27); boxing.setDate(28); } else if (christmas.getDay() === 0) { christmas.setDate(27); } else if (boxing.getDay() === 6) boxing.setDate(28); else if (boxing.getDay() === 0) boxing.setDate(28);
  const entries: [string, Date][] = [["New Year’s Day", newYear], ["Good Friday", goodFriday], ["Easter Monday", easterMonday], ["Early May bank holiday", mondayOfMonth(year, 4)], ["Spring bank holiday", mondayOfMonth(year, 4, true)], ["Summer bank holiday", mondayOfMonth(year, 7, true)], ["Christmas Day", christmas], ["Boxing Day", boxing]];
  return entries.map(([title, date]) => ({ id: `uk-${dateKey(date)}-${title}`, title, date: dateKey(date), time: "09:00", allDay: true, repeat: "None", section: UK_HOLIDAYS }));
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Morning");
  const [frequency, setFrequency] = useState<Frequency>("Daily");
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentSections, setAppointmentSections] = useState(["School", "Fun"]);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(dateKey(new Date()));
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [appointmentEndTime, setAppointmentEndTime] = useState("10:00");
  const [appointmentTravel, setAppointmentTravel] = useState(0);
  const [appointmentLocation, setAppointmentLocation] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [appointmentAllDay, setAppointmentAllDay] = useState(false);
  const [appointmentRepeat, setAppointmentRepeat] = useState<AppointmentRepeat>("None");
  const [appointmentReminder, setAppointmentReminder] = useState(0);
  const [appointmentSection, setAppointmentSection] = useState("School");
  const [newAppointmentSection, setNewAppointmentSection] = useState("");
  const [appointmentSectionDeleteConfirm, setAppointmentSectionDeleteConfirm] = useState<string | null>(null);
  const [savedAppointmentId, setSavedAppointmentId] = useState<string | null>(null);
  const [appointmentError, setAppointmentError] = useState("");
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<{ id: string; date: string } | null>(null);
  const [recurringDeleteOpen, setRecurringDeleteOpen] = useState(false);
  const [pendingRecurringMove, setPendingRecurringMove] = useState<PendingRecurringMove | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [visibleCalendarSections, setVisibleCalendarSections] = useState<Record<string, boolean>>({ [UK_HOLIDAYS]: true });
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(12, 0, 0, 0); return d; });
  const [search, setSearch] = useState("");
  const [habitFilter, setHabitFilter] = useState<"All" | "Due" | "Done">("All");
  const [calendarView, setCalendarView] = useState<"Month" | "Week" | "Day">("Month");
  const [accessible, setAccessible] = useState(false);
  const [habitColor, setHabitColor] = useState(JELLY_COLORS[0]);
  const [habitWeekdays, setHabitWeekdays] = useState<number[]>([1,2,3,4,5]);
  const [weeklyGoal, setWeeklyGoal] = useState(1);
  const [sectionColors, setSectionColors] = useState<Record<string,string>>({ [UK_HOLIDAYS]: "#f4e49d" });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [badgePopup, setBadgePopup] = useState<Achievement | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [theme, setTheme] = useState<ThemeName>("Cosmic Pastel");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [spentPoints, setSpentPoints] = useState(0);
  const [orbitTotal, setOrbitTotal] = useState(0);
  const [creditedCompletions, setCreditedCompletions] = useState<string[]>([]);
  const [archivedCompletions, setArchivedCompletions] = useState<ArchivedCompletion[]>([]);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [plantType, setPlantType] = useState("Sunflower");
  const [plantProgress, setPlantProgress] = useState<Record<string, number>>({ Sunflower: 0 });
  const [plantNames, setPlantNames] = useState<Record<string, string>>({});
  const [plantPotLevel, setPlantPotLevel] = useState(0);
  const [plantEffect, setPlantEffect] = useState<PlantCareEffect | null>(null);
  const [plantEffectId, setPlantEffectId] = useState(0);
  const [activePage, setActivePage] = useState<AppPage>("Home");
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [soundsEnabled, setSoundsEnabled] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));
  const inputRef = useRef<HTMLInputElement>(null);

  const days = useMemo(() => Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (4 - index));
    return date;
  }), []);
  const today = dateKey(days[4]);
  const dailyQuote = useMemo(() => { const dayNumber = Math.floor(new Date(`${today}T12:00:00`).getTime() / 86400000); return DAILY_QUOTES[dayNumber % DAILY_QUOTES.length]; }, [today]);
  const heatmapDays = useMemo(() => Array.from({ length: 84 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (83 - index));
    return date;
  }), []);
  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth);
    first.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => { const day = new Date(first); day.setDate(first.getDate() + index); return day; });
  }, [calendarMonth]);
  const visibleCalendarDays = useMemo(() => calendarView === "Month" ? calendarDays : calendarView === "Week" ? calendarDays.slice(7, 14) : [new Date(`${selectedDay ?? today}T12:00:00`)], [calendarDays, calendarView, selectedDay, today]);
  const holidayAppointments = useMemo(() => [calendarMonth.getFullYear() - 1, calendarMonth.getFullYear(), calendarMonth.getFullYear() + 1, calendarMonth.getFullYear() + 2].flatMap(ukHolidays), [calendarMonth]);
  const allCalendarItems = useMemo(() => [...appointments, ...holidayAppointments], [appointments, holidayAppointments]);
  const calendarSections = useMemo(() => [...appointmentSections, UK_HOLIDAYS], [appointmentSections]);
  const totalCompletions = useMemo(() => habits.reduce((sum, habit) => sum + habit.completions.length, 0) + archivedCompletions.length, [habits, archivedCompletions]);
  const orbitPoints = orbitTotal;
  const pointDifference = orbitTotal - spentPoints;
  const availablePoints = Math.max(0, pointDifference);
  const pointsToRestore = Math.max(0, -pointDifference);
  const plantXp = plantProgress[plantType] ?? 0;
  const plantDisplayName = plantNames[plantType]?.trim() || plantType;
  const plantStage = Math.min(8, Math.floor(plantXp / 25));
  const illustratedPlantStage = Math.min(6, Math.round(plantStage * 6 / 8));
  const plantClass = `plant-${plantType.toLowerCase().replaceAll(" ", "-")}`;
  const plantAssetSlug = plantType.toLowerCase().replaceAll(" ", "-");
  const nextPotCost = 40 + plantPotLevel * 20;
  const plantCareItems: { effect: PlantCareEffect; name: string; cost: number; growth: number; detail: string }[] = [
    { effect: "water", name: "Fresh water", cost: 20, growth: 15, detail: "A gentle storybook pour" },
    { effect: "sun", name: "Sunshine", cost: 30, growth: 22, detail: "Warm light crosses the garden" },
    { effect: "pot", name: plantPotLevel >= 6 ? "Best pot unlocked" : `Upgrade pot · ${plantPotLevel + 1}/6`, cost: nextPotCost, growth: 12, detail: plantPotLevel >= 6 ? "Your finest pot is ready" : "A larger illustrated pot" },
    { effect: "fertiliser", name: "Plant food", cost: 90, growth: 60, detail: "Fertiliser falls into the soil" },
  ];
  const weeklyReview = useMemo(() => {
    const recentDays = Array.from({ length: 7 }, (_, index) => { const day = new Date(`${today}T12:00:00`); day.setDate(day.getDate() - (6 - index)); return day; });
    const dailyCounts = recentDays.map((day) => { const key = dateKey(day); return habits.reduce((count, habit) => count + (habit.completions.includes(key) ? 1 : 0), 0) + archivedCompletions.filter((item) => item.date === key).length; });
    const completed = dailyCounts.reduce((sum, count) => sum + count, 0);
    const bestIndex = dailyCounts.indexOf(Math.max(...dailyCounts));
    return { completed, points: completed * 10, percent: habits.length ? Math.min(100, Math.round(completed / (habits.length * 7) * 100)) : 0, bestDay: completed ? recentDays[bestIndex].toLocaleDateString("en-GB", { weekday: "long" }) : "No completions yet" };
  }, [today, habits, archivedCompletions]);
  const weekInsights = useMemo(() => {
    const recent = days.map((day) => dayActivity(day).count);
    const strongestIndex = recent.indexOf(Math.max(...recent));
    const possible = habits.length * recent.length;
    const percent = possible ? Math.round(recent.reduce((a, b) => a + b, 0) / possible * 100) : 0;
    const consistent = habits.reduce<Habit | null>((best, habit) => !best || habit.completions.length > best.completions.length ? habit : best, null);
    return { percent, strongest: days[strongestIndex]?.toLocaleDateString("en-GB", { weekday: "long" }) ?? "—", consistent: consistent?.name ?? "No habits yet" };
  }, [days, habits, archivedCompletions]);
  const achievements = useMemo<Achievement[]>(() => {
    const bestStreak = habits.reduce((best, habit) => Math.max(best, streakStats(habit).longest), 0);
    const now = new Date(`${today}T12:00:00`);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 12);
    const yearStart = new Date(now.getFullYear(), 0, 1, 12);
    const allInPeriod = (start: Date) => habits.length > 0 && habits.every((habit) => habit.completions.some((key) => key >= dateKey(start) && key <= today));
    const currentAchievements: Achievement[] = [
      { id: "new-habit", icon: "🪐", title: "Lift-off!", description: "Created your first habit", unlocked: habits.length > 0 },
      { id: "first-task", icon: "✨", title: "First Spark", description: "Completed a habit for the first time", unlocked: totalCompletions > 0 },
      { id: "first-plan", icon: "📅", title: "Future You", description: "Planned your first appointment", unlocked: appointments.length > 0 },
      ...[5, 10, 20, 30, 50, 75, 100].map((days) => ({ id: `streak-${days}`, icon: days >= 50 ? "🏆" : "🔥", title: `${days}-Day Streak`, description: `Kept a habit going for ${days} days`, unlocked: bestStreak >= days })),
      { id: "perfect-day", icon: "☀️", title: "Perfect Day", description: "Completed every current habit today", unlocked: habits.length > 0 && habits.every((habit) => habit.completions.includes(today)) },
      { id: "perfect-week", icon: "🌈", title: "Wonderful Week", description: "Completed every current habit this week", unlocked: allInPeriod(weekStart) },
      { id: "perfect-month", icon: "🌙", title: "Magic Month", description: "Completed every current habit this month", unlocked: allInPeriod(monthStart) },
      { id: "perfect-year", icon: "🌟", title: "Orbit Legend", description: "Completed every current habit this year", unlocked: allInPeriod(yearStart) },
      { id: "points-100", icon: "💫", title: "Century Club", description: "Earned 100 Orbit Points", unlocked: orbitPoints >= 100 },
      { id: "points-500", icon: "👑", title: "Jelly Royalty", description: "Earned 500 Orbit Points", unlocked: orbitPoints >= 500 },
    ];
    return currentAchievements.map((achievement) => ({ ...achievement, unlocked: achievement.unlocked || unlockedAchievements.includes(achievement.id) }));
  }, [habits, appointments, orbitPoints, today, totalCompletions, unlockedAchievements]);

  function dayActivity(day: Date): { count: number; level: number } {
    const key = dateKey(day);
    const count = habits.reduce((sum, habit) => sum + (habit.completions.includes(key) ? 1 : 0), 0) + archivedCompletions.filter((completion) => completion.date === key).length;
    return { count, level: Math.min(4, count) };
  }

  function nextDue(habit: Habit) {
    const latest = [...habit.completions].sort().at(-1);
    const base = latest ? new Date(`${latest}T12:00:00`) : new Date(`${habit.createdAt ?? today}T12:00:00`);
    if (!latest) return base;
    const repeat = habit.frequency ?? "Daily";
    if (repeat === "Daily") base.setDate(base.getDate() + 1);
    if (repeat === "Weekly") base.setDate(base.getDate() + 7);
    if (repeat === "Monthly") base.setMonth(base.getMonth() + 1);
    if (repeat === "Yearly") base.setFullYear(base.getFullYear() + 1);
    return base;
  }

  function habitIsChecked(habit: Habit) {
    if (!habit.completions.length) return false;
    return today < dateKey(nextDue(habit));
  }

  function streakStats(habit: Habit) {
    const completed = new Set(habit.completions);
    const cursor = new Date(days[4]);
    if (!completed.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let current = 0;
    while (completed.has(dateKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const ordered = [...completed].sort();
    let longest = 0;
    let run = 0;
    let previous: Date | null = null;
    ordered.forEach((key) => {
      const day = new Date(`${key}T12:00:00`);
      const consecutive = previous && Math.round((day.getTime() - previous.getTime()) / 86400000) === 1;
      run = consecutive ? run + 1 : 1;
      longest = Math.max(longest, run);
      previous = day;
    });
    const milestone = Math.floor(longest / 10) * 10;
    const nextMilestone = (Math.floor(longest / 10) + 1) * 10;
    return { current, longest, milestone, nextMilestone };
  }

  function appointmentOccurs(item: Appointment, day: Date) {
    const key = dateKey(day);
    const start = new Date(`${item.date}T12:00:00`);
    if (day < start || (item.endsBefore && key >= item.endsBefore) || item.excludedDates?.includes(key)) return false;
    if (item.repeat === "None") return key === item.date;
    const dayDiff = Math.round((day.getTime() - start.getTime()) / 86400000);
    if (item.repeat === "Daily") return true;
    if (item.repeat === "Weekly") return dayDiff % 7 === 0;
    if (item.repeat === "Monthly") return day.getDate() === start.getDate();
    return day.getMonth() === start.getMonth() && day.getDate() === start.getDate();
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const restored: Habit[] = saved ? JSON.parse(saved) : [];
      const restoredHabits = restored.filter((habit) => !["seed-water", "seed-walk", "seed-read"].includes(habit.id));
      const restoredPoints = restoredHabits.reduce((sum, habit) => sum + habit.completions.length * 10, 0);
      setHabits(restoredHabits);
      setOrbitTotal(restoredPoints);
      setCreditedCompletions(restoredHabits.flatMap((habit) => habit.completions.map((day) => `${habit.id}:${day}`)));
      const savedCategories = localStorage.getItem(CATEGORIES_KEY);
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        setCategories(parsed);
        if (parsed[0]) setCategory(parsed[0]);
      }
      const savedCollapsed = localStorage.getItem(COLLAPSE_KEY);
      if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));
      const savedAppointments = localStorage.getItem(APPOINTMENTS_KEY);
      if (savedAppointments) setAppointments(JSON.parse(savedAppointments));
      const savedAppointmentSections = localStorage.getItem(APPOINTMENT_SECTIONS_KEY);
      if (savedAppointmentSections) {
        const parsed = JSON.parse(savedAppointmentSections);
        setAppointmentSections(parsed);
        if (parsed[0]) setAppointmentSection(parsed[0]);
      }
      const settings = localStorage.getItem(SETTINGS_KEY);
      if (settings) { const parsed = JSON.parse(settings); const savedPlantType = PLANT_TYPES.includes(parsed.plantType) ? parsed.plantType : "Sunflower"; setAccessible(!!parsed.accessible); setSoundsEnabled(!!parsed.soundsEnabled); setSectionColors(parsed.sectionColors ?? { [UK_HOLIDAYS]: "#f4e49d" }); setTheme((["Cosmic Pastel", "Cosy Scrapbook", "Dreamy Cloud Garden", "Candy Pop", "Cute Minimal Space"] as string[]).includes(parsed.theme) ? parsed.theme : "Cosmic Pastel"); setRewards(parsed.rewards ?? []); setSpentPoints(parsed.spentPoints ?? 0); setOrbitTotal(Math.max(parsed.orbitTotal ?? 0, restoredPoints)); setCreditedCompletions(parsed.creditedCompletions ?? restoredHabits.flatMap((habit) => habit.completions.map((day) => `${habit.id}:${day}`))); setArchivedCompletions(parsed.archivedCompletions ?? []); setPlantType(savedPlantType); setPlantProgress(parsed.plantProgress ?? { [savedPlantType]: parsed.plantXp ?? 0 }); setPlantNames(parsed.plantNames ?? {}); setPlantPotLevel(Math.min(6, Math.max(0, parsed.plantPotLevel ?? 0))); }
      const savedAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (savedAchievements) setUnlockedAchievements(JSON.parse(savedAchievements));
    } catch {
      setHabits([]);
    }
    setReady(true);
    if (!localStorage.getItem(TOUR_KEY)) setTourStep(0);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(SETTINGS_KEY, JSON.stringify({ accessible, soundsEnabled, sectionColors, theme, rewards, spentPoints, orbitTotal, creditedCompletions, archivedCompletions, plantType, plantXp, plantProgress, plantNames, plantPotLevel })); }, [accessible, soundsEnabled, sectionColors, theme, rewards, spentPoints, orbitTotal, creditedCompletions, archivedCompletions, plantType, plantXp, plantProgress, plantNames, plantPotLevel, ready]);
  useEffect(() => { if (!undoAction) return; const timer = window.setTimeout(() => setUndoAction(null), 8000); return () => window.clearTimeout(timer); }, [undoAction]);
  useEffect(() => { if (ready) localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements)); }, [unlockedAchievements, ready]);
  useEffect(() => {
    if (!ready || badgePopup) return;
    const newlyEarned = achievements.find((item) => item.unlocked && !unlockedAchievements.includes(item.id));
    if (!newlyEarned) return;
    setUnlockedAchievements((current) => [...current, newlyEarned.id]);
    setBadgePopup(newlyEarned);
    playSound("achievement");
  }, [achievements, badgePopup, ready, unlockedAchievements, soundsEnabled]);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed));
  }, [collapsed, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  }, [appointments, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(APPOINTMENT_SECTIONS_KEY, JSON.stringify(appointmentSections));
  }, [appointmentSections, ready]);

  useEffect(() => {
    document.querySelectorAll(".tour-highlight").forEach((element) => element.classList.remove("tour-highlight"));
    if (tourStep === null) return;
    const step = TOUR_STEPS[tourStep];
    setActivePage(step.page);
    const timer = window.setTimeout(() => {
      const target = document.querySelector(`[data-tour="${step.target}"]`);
      target?.classList.add("tour-highlight");
      target?.scrollIntoView({ behavior: accessible ? "auto" : "smooth", block: "center" });
    }, 120);
    return () => { window.clearTimeout(timer); document.querySelectorAll(".tour-highlight").forEach((element) => element.classList.remove("tour-highlight")); };
  }, [tourStep, accessible]);

  useEffect(() => {
    if (accessible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lastTrail = 0;
    const addParticle = (className: string, x: number, y: number, index = 0) => {
      const particle = document.createElement("i");
      particle.className = className;
      particle.setAttribute("aria-hidden", "true");
      particle.style.left = `${x}px`; particle.style.top = `${y}px`;
      particle.style.setProperty("--spark-angle", `${index * 45}deg`);
      document.body.appendChild(particle);
      window.setTimeout(() => particle.remove(), 850);
    };
    const trail = (event: PointerEvent) => {
      if (event.pointerType === "touch" || performance.now() - lastTrail < 85) return;
      lastTrail = performance.now();
      addParticle("orbit-cursor-trail", event.clientX, event.clientY);
    };
    const burst = (event: PointerEvent) => {
      for (let index = 0; index < 8; index += 1) addParticle("orbit-click-spark", event.clientX, event.clientY, index);
    };
    window.addEventListener("pointermove", trail, { passive: true });
    window.addEventListener("pointerdown", burst, { passive: true });
    return () => { window.removeEventListener("pointermove", trail); window.removeEventListener("pointerdown", burst); document.querySelectorAll(".orbit-cursor-trail,.orbit-click-spark").forEach((particle) => particle.remove()); };
  }, [accessible]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const captureInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const installed = () => { setIsStandalone(true); setInstallPrompt(null); setInstallHelpOpen(false); };
    window.addEventListener("beforeinstallprompt", captureInstall);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", captureInstall); window.removeEventListener("appinstalled", installed); };
  }, []);

  useEffect(() => {
    if (!modalOpen && !categoriesOpen && !appointmentOpen) return;
    const timer = modalOpen ? window.setTimeout(() => inputRef.current?.focus(), 50) : undefined;
    const close = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { setModalOpen(false); setCategoriesOpen(false); setAppointmentOpen(false); }
    };
    window.addEventListener("keydown", close);
    return () => { if (timer) window.clearTimeout(timer); window.removeEventListener("keydown", close); };
  }, [modalOpen, categoriesOpen, appointmentOpen]);

  useEffect(() => {
    if (!notificationsEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const timers = appointments.flatMap((item) => {
      if (!item.reminder || item.allDay) return [];
      const when = new Date(`${item.date}T${item.time}:00`).getTime() - ((item.travelMinutes ?? 0) + item.reminder) * 60000;
      const delay = when - Date.now();
      if (delay <= 0 || delay > 2147483647) return [];
      return [window.setTimeout(() => new Notification(`THE ORBIT: ${item.title}`, { body: item.travelMinutes ? `${item.reminder} minutes before travel time · Travel ${item.travelMinutes} min · Starts ${item.time}` : `${item.reminder} minutes before start time · Starts ${item.time}` }), delay)];
    });
    return () => timers.forEach(window.clearTimeout);
  }, [appointments, notificationsEnabled]);

  function toggleHabit(id: string) {
    const habit = habits.find((item) => item.id === id);
    if (!habit || habit.paused) return;
    const completing = !habitIsChecked(habit);
    const completionDate = completing ? today : [...habit.completions].sort().at(-1);
    if (!completionDate) return;
    const creditKey = `${id}:${completionDate}`;
    if (completing && !creditedCompletions.includes(creditKey)) {
      setOrbitTotal((current) => current + 10);
      setCreditedCompletions((current) => [...current, creditKey]);
    } else if (!completing && creditedCompletions.includes(creditKey)) {
      setOrbitTotal((current) => Math.max(0, current - 10));
      setCreditedCompletions((current) => current.filter((key) => key !== creditKey));
    }
    setHabits((current) => current.map((item) => item.id === id ? { ...item, completions: completing ? [...item.completions, completionDate] : item.completions.filter((day) => day !== completionDate) } : item));
    playSound(completing ? "complete" : "undo");
  }

  function addHabit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setHabits((current) => editingHabitId ? current.map((habit) => habit.id === editingHabitId ? { ...habit, name: trimmed, category, frequency, color: habitColor, weekdays: habitWeekdays, weeklyGoal } : habit) : [...current, { id: crypto.randomUUID(), name: trimmed, category, frequency, color: habitColor, weekdays: habitWeekdays, weeklyGoal, createdAt: today, completions: [] }]);
    setCollapsed((current) => ({ ...current, [category]: false }));
    setName("");
    setFrequency("Daily");
    setEditingHabitId(null);
    setModalOpen(false);
  }

  function editHabit(habit: Habit) {
    setName(habit.name); setCategory(habit.category); setFrequency(habit.frequency ?? "Daily"); setHabitColor(habit.color ?? JELLY_COLORS[0]); setHabitWeekdays(habit.weekdays ?? [1,2,3,4,5]); setWeeklyGoal(habit.weeklyGoal ?? 1);
    setEditingHabitId(habit.id); setModalOpen(true);
  }

  function toggleHabitPause(id: string) {
    setHabits((current) => current.map((habit) => habit.id === id ? { ...habit, paused: !habit.paused } : habit));
  }

  function addCategory(event: FormEvent) {
    event.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed || categories.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    setCategories((current) => [...current, trimmed]);
    setCategory(trimmed);
    setNewCategory("");
  }

  function renameCategory(oldName: string) {
    const next = editingName.trim();
    if (!next || next === oldName || categories.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    setCategories((current) => current.map((item) => item === oldName ? next : item));
    setHabits((current) => current.map((habit) => habit.category === oldName ? { ...habit, category: next } : habit));
    setCollapsed((current) => { const copy = { ...current, [next]: current[oldName] ?? false }; delete copy[oldName]; return copy; });
    if (category === oldName) setCategory(next);
    setEditingCategory(null);
    setEditingName("");
  }

  function deleteCategory(group: string) {
    const groupHabits = habits.filter((habit) => habit.category === group);
    const count = groupHabits.length;
    if (count && deleteConfirm !== group) { setDeleteConfirm(group); return; }
    if (count) {
      setUnlockedAchievements((current) => [...new Set([...current, ...achievements.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id)])]);
      setArchivedCompletions((current) => [...current, ...groupHabits.flatMap((habit) => habit.completions.map((date) => ({ habitId: habit.id, habitName: habit.name, date })))]);
    }
    setCategories((current) => current.filter((item) => item !== group));
    setHabits((current) => current.filter((habit) => habit.category !== group));
    if (category === group) setCategory(categories.find((item) => item !== group) ?? "");
    setDeleteConfirm(null);
  }

  function rowKey(event: KeyboardEvent<HTMLDivElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleHabit(id);
    }
  }

  function addAppointment(event: FormEvent) {
    event.preventDefault();
    const title = appointmentTitle.trim();
    if (!title) { setAppointmentError("Give your appointment a name first."); return; }
    const date = appointmentDate || today;
    const section = appointmentSection || appointmentSections[0] || "My plans";
    if (!appointmentSections.includes(section)) setAppointmentSections((current) => [...current, section]);
    const id = editingAppointmentId ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `appointment-${Date.now()}`);
    setAppointments((current) => editingAppointmentId
      ? current.map((item) => item.id === editingAppointmentId ? { ...item, title, date, time: appointmentTime || "09:00", endTime: appointmentEndTime, travelMinutes: appointmentTravel, location: appointmentLocation.trim(), notes: appointmentNotes.trim(), allDay: appointmentAllDay, repeat: appointmentRepeat, section, reminder: appointmentReminder } : item)
      : [...current, { id, title, date, time: appointmentTime || "09:00", endTime: appointmentEndTime, travelMinutes: appointmentTravel, location: appointmentLocation.trim(), notes: appointmentNotes.trim(), allDay: appointmentAllDay, repeat: appointmentRepeat, section, reminder: appointmentReminder }]);
    const savedDate = new Date(`${date}T12:00:00`);
    setCalendarMonth(new Date(savedDate.getFullYear(), savedDate.getMonth(), 1, 12));
    setSavedAppointmentId(id);
    setAppointmentError("");
    window.setTimeout(() => setSavedAppointmentId(null), 2200);
    setAppointmentTitle("");
    setAppointmentAllDay(false);
    setAppointmentRepeat("None");
    setAppointmentReminder(0);
    setAppointmentTravel(0); setAppointmentLocation(""); setAppointmentNotes(""); setAppointmentEndTime("10:00");
    setEditingAppointmentId(null);
    setSelectedCalendarEvent(null);
    setAppointmentOpen(false);
  }

  function editAppointment(item: Appointment) {
    setAppointmentTitle(item.title);
    setAppointmentDate(item.date);
    setAppointmentTime(item.time);
    setAppointmentEndTime(item.endTime ?? item.time); setAppointmentTravel(item.travelMinutes ?? 0); setAppointmentLocation(item.location ?? ""); setAppointmentNotes(item.notes ?? "");
    setAppointmentAllDay(item.allDay);
    setAppointmentRepeat(item.repeat);
    setAppointmentReminder(item.reminder ?? 0);
    setAppointmentSection(item.section);
    setEditingAppointmentId(item.id);
    setSelectedCalendarEvent(null);
    setRecurringDeleteOpen(false);
    setAppointmentOpen(true);
  }

  function requestAppointmentMove(id: string, fromDate: string, toDate: string) {
    if (fromDate === toDate) return;
    const item = appointments.find((entry) => entry.id === id);
    if (!item) return;
    if (item.repeat === "None") {
      setAppointments((current) => current.map((entry) => entry.id === id ? { ...entry, date: toDate } : entry));
      return;
    }
    setPendingRecurringMove({ id, fromDate, toDate });
  }

  function confirmRecurringMove(scope: "one" | "all") {
    if (!pendingRecurringMove) return;
    const { id, fromDate, toDate } = pendingRecurringMove;
    setAppointments((current) => {
      const source = current.find((entry) => entry.id === id);
      if (!source) return current;
      if (scope === "one") {
        const series = current.map((entry) => entry.id === id ? { ...entry, excludedDates: [...new Set([...(entry.excludedDates ?? []), fromDate])] } : entry);
        return [...series, { ...source, id: `${source.id}-moved-${Date.now()}`, date: toDate, repeat: "None", excludedDates: [], endsBefore: undefined }];
      }
      const from = new Date(`${fromDate}T12:00:00`), to = new Date(`${toDate}T12:00:00`);
      const dayShift = Math.round((to.getTime() - from.getTime()) / 86400000);
      const shift = (key?: string) => { if (!key) return undefined; const date = new Date(`${key}T12:00:00`); date.setDate(date.getDate() + dayShift); return dateKey(date); };
      return current.map((entry) => entry.id === id ? { ...entry, date: shift(entry.date) ?? entry.date, excludedDates: entry.excludedDates?.map((date) => shift(date) ?? date), endsBefore: shift(entry.endsBefore) } : entry);
    });
    setPendingRecurringMove(null);
    setSelectedCalendarEvent(null);
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }

  function showDayDetails(date: string) {
    setSelectedDay(date);
    setSelectedCalendarEvent(null);
    window.setTimeout(() => document.getElementById("day-details")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function upcomingForSection(section: string) {
    const start = new Date(`${today}T12:00:00`), end = new Date(start); end.setFullYear(end.getFullYear() + 1);
    const source = section === UK_HOLIDAYS ? holidayAppointments : appointments.filter((item) => item.section === section);
    const results: { item: Appointment; date: string }[] = [];
    for (const item of source) {
      if (item.repeat === "None") { if (item.date >= today) results.push({ item, date: item.date }); continue; }
      for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        if (appointmentOccurs(item, cursor)) { results.push({ item, date: dateKey(cursor) }); break; }
      }
    }
    return results.sort((a, b) => a.date.localeCompare(b.date) || a.item.time.localeCompare(b.item.time));
  }

  function deleteCalendarOccurrence(item: Appointment, occurrenceDate: string, scope: "one" | "future") {
    if (item.repeat === "None" || (scope === "future" && occurrenceDate === item.date)) {
      setAppointments((current) => current.filter((entry) => entry.id !== item.id));
    } else if (scope === "one") {
      setAppointments((current) => current.map((entry) => entry.id === item.id ? { ...entry, excludedDates: [...new Set([...(entry.excludedDates ?? []), occurrenceDate])] } : entry));
    } else {
      setAppointments((current) => current.map((entry) => entry.id === item.id ? { ...entry, endsBefore: occurrenceDate } : entry));
    }
    setSelectedCalendarEvent(null);
    setRecurringDeleteOpen(false);
  }

  function addAppointmentSection() {
    const trimmed = newAppointmentSection.trim();
    if (!trimmed || appointmentSections.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
    setAppointmentSections((current) => [...current, trimmed]);
    setAppointmentSection(trimmed);
    setNewAppointmentSection("");
  }

  function deleteAppointmentSection(section: string) {
    const hasAppointments = appointments.some((item) => item.section === section);
    if (hasAppointments && appointmentSectionDeleteConfirm !== section) {
      setAppointmentSectionDeleteConfirm(section);
      return;
    }
    setAppointments((current) => current.filter((item) => item.section !== section));
    setAppointmentSections((current) => current.filter((item) => item !== section));
    if (appointmentSection === section) setAppointmentSection(appointmentSections.find((item) => item !== section) ?? "");
    setAppointmentSectionDeleteConfirm(null);
  }

  function moveInList<T>(list: T[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return list;
    const copy = [...list]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy;
  }

  function careForPlant(cost: number, growth: number, effect?: PlantCareEffect) {
    if (availablePoints < cost) return;
    if (effect === "pot" && plantPotLevel >= 6) return;
    const previousSpent = spentPoints, previousProgress = plantProgress, previousPot = plantPotLevel;
    setSpentPoints((current) => current + cost);
    setPlantProgress((current) => ({ ...current, [plantType]: (current[plantType] ?? 0) + growth }));
    if (effect === "pot") setPlantPotLevel((current) => Math.min(6, current + 1));
    showUndo(`${effect === "pot" ? "Pot upgrade" : "Plant care"} purchased`, () => { setSpentPoints(previousSpent); setPlantProgress(previousProgress); setPlantPotLevel(previousPot); });
    playSound("care");
    if (effect) {
      setPlantEffect(effect);
      setPlantEffectId((current) => current + 1);
      window.setTimeout(() => setPlantEffect(null), 2800);
    }
  }

  function resetCurrentPlant() {
    if (!plantXp) return;
    const previousProgress = plantProgress;
    setPlantProgress((current) => ({ ...current, [plantType]: 0 }));
    showUndo(`${plantDisplayName} returned to a seed`, () => setPlantProgress(previousProgress));
    playSound("undo");
  }

  function showUndo(message: string, run: () => void) {
    setUndoAction({ message, run });
  }

  function playSound(kind: "complete" | "care" | "achievement" | "undo") {
    if (!soundsEnabled || typeof AudioContext === "undefined") return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { complete: 660, care: 520, achievement: 880, undo: 330 };
    oscillator.frequency.setValueAtTime(frequencies[kind], context.currentTime);
    oscillator.type = kind === "achievement" ? "triangle" : "sine";
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .28);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .3);
    oscillator.addEventListener("ended", () => context.close());
  }

  function confirmHabitDeletion(keepProgress: boolean) {
    if (!deletingHabit) return;
    const habit = deletingHabit;
    const previousHabits = habits, previousArchived = archivedCompletions, previousCredits = creditedCompletions, previousTotal = orbitTotal;
    setUnlockedAchievements((current) => [...new Set([...current, ...achievements.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id)])]);
    if (keepProgress) {
      setArchivedCompletions((current) => [...current, ...habit.completions.map((date) => ({ habitId: habit.id, habitName: habit.name, date }))]);
    } else {
      const habitCreditKeys = new Set(habit.completions.map((date) => `${habit.id}:${date}`));
      const creditsToReverse = creditedCompletions.filter((key) => habitCreditKeys.has(key)).length;
      setCreditedCompletions((current) => current.filter((key) => !habitCreditKeys.has(key)));
      setOrbitTotal((current) => Math.max(0, current - creditsToReverse * 10));
    }
    setHabits((current) => current.filter((item) => item.id !== habit.id));
    setDeletingHabit(null);
    showUndo(`${habit.name} deleted`, () => { setHabits(previousHabits); setArchivedCompletions(previousArchived); setCreditedCompletions(previousCredits); setOrbitTotal(previousTotal); });
  }

  function startTour() {
    setActivePage("Home");
    setTourStep(0);
  }

  async function installOrbit() {
    if (!installPrompt) { setInstallHelpOpen(true); return; }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setIsStandalone(true);
    setInstallPrompt(null);
  }

  function finishTour() {
    document.querySelectorAll(".tour-highlight").forEach((element) => element.classList.remove("tour-highlight"));
    localStorage.setItem(TOUR_KEY, "true");
    setTourStep(null);
    setActivePage("Home");
    window.scrollTo({ top: 0, behavior: accessible ? "auto" : "smooth" });
  }

  return (
    <main className={`app-shell theme-${theme.toLowerCase().replaceAll(" ", "-")} ${accessible ? "accessibility-mode" : ""} ${tourStep !== null ? "tour-active" : ""}`}>
      {badgePopup && <div className="badge-celebration" role="dialog" aria-modal="true" aria-labelledby="badge-title" aria-describedby="badge-description"><div className="badge-popup"><span>{badgePopup.icon}</span><small>Achievement unlocked!</small><strong id="badge-title">{badgePopup.title}</strong><p id="badge-description">{badgePopup.description}</p><button onClick={() => setBadgePopup(null)}>Exit</button></div></div>}
      {tourStep !== null && <div className="tour-guide" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-description"><div className="tour-card"><div className="tour-progress"><span>Guided tour</span><strong>{tourStep + 1} / {TOUR_STEPS.length}</strong></div><h2 id="tour-title">{TOUR_STEPS[tourStep].title}</h2><p id="tour-description">{TOUR_STEPS[tourStep].description}</p><div className="tour-dots" aria-hidden="true">{TOUR_STEPS.map((_, index) => <i key={index} className={index === tourStep ? "active" : index < tourStep ? "done" : ""} />)}</div><div className="tour-actions"><button type="button" className="tour-skip" onClick={finishTour}>Exit tour</button><span>{tourStep > 0 && <button type="button" onClick={() => setTourStep((current) => current === null ? 0 : current - 1)}>Back</button>}<button type="button" className="tour-next" onClick={() => tourStep === TOUR_STEPS.length - 1 ? finishTour() : setTourStep(tourStep + 1)}>{tourStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"} →</button></span></div></div></div>}
      <div className="sky-decor" aria-hidden="true">
        <span className="daisy daisy-one">✦</span><span className="daisy daisy-two">✧</span>
        <span className="sparkle sparkle-one">✦</span><span className="sparkle sparkle-two">✦</span>
        <span className="squiggle squiggle-one">〰</span><span className="squiggle squiggle-two">〰</span>
        <span className="swirl swirl-one">◎</span><span className="swirl swirl-two">◉</span>
        <span className="confetti confetti-one" /><span className="confetti confetti-two" /><span className="confetti confetti-three" />
        <span className="blob blob-one" /><span className="blob blob-two" />
      </div>
      <div className="orbit-layout">
      <aside className="side-menu" data-tour="navigation">
        <div className="side-brand"><OrbitLogo className="orbit-logo-small" /><strong>THE ORBIT</strong></div>
        <nav aria-label="Main navigation">
          {([['Home', '⌂'], ["Today's Focus", '◎'], ['Calendar', '▦'], ['My Habits', '✓'], ['Hall of Fame', '★']] as [AppPage, string][]).map(([page, icon]) => <button key={page} className={activePage === page ? "active" : ""} aria-current={activePage === page ? "page" : undefined} onClick={() => { setActivePage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}><span>{icon}</span><b>{page}</b></button>)}
        </nav>
      </aside>
      <div className="page-content">
      <header className="topbar" data-tour="welcome">
        <div>
          <div className="eyebrow"><span className="pulse" />My awesome day</div>
          <div className="brand-lockup"><OrbitLogo /><h1>THE <span>ORBIT</span></h1></div>
        </div>
        <aside className="daily-quote" aria-label="Inspirational quote of the day"><span>Quote of the day</span><blockquote>“{dailyQuote}”</blockquote></aside>
      </header>
      <nav className="orbit-toolbar" data-tour="display" aria-label="Display options"><button type="button" className={`sound-toggle ${soundsEnabled ? "active" : ""}`} aria-pressed={soundsEnabled} onClick={() => setSoundsEnabled((current) => !current)}>{soundsEnabled ? "♫ Sounds on" : "♩ Sounds off"}</button><button type="button" className={`accessibility-toggle ${accessible ? "active" : ""}`} aria-pressed={accessible} onClick={() => setAccessible((value) => !value)}><span aria-hidden="true">◉</span> Accessibility {accessible ? "on" : "off"}</button>{!isStandalone && <button type="button" className="install-button" onClick={installOrbit}><span aria-hidden="true">↓</span> Install app</button>}<label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)}>{(["Cosmic Pastel", "Cosy Scrapbook", "Dreamy Cloud Garden", "Candy Pop", "Cute Minimal Space"] as ThemeName[]).map((item) => <option key={item}>{item}</option>)}</select></label></nav>

      {activePage === "Home" && <div className="page-section page-home">
      <div className="home-tour-row"><p>Your universe, all in one place.</p><button type="button" onClick={startTour}>✦ Take a Tour</button></div>
      <section className="today-summary" data-tour="summary" aria-label="Today summary">
        <div><span>Today</span><strong>{habits.filter(habitIsChecked).length}/{habits.length}</strong><small>habits complete</small></div>
        <div><span>Next up</span><strong>{allCalendarItems.filter((item) => appointmentOccurs(item, days[4])).length}</strong><small>plans today</small></div>
        <div><span>Best streak</span><strong>{habits.reduce((best, habit) => Math.max(best, streakStats(habit).longest), 0)} 🔥</strong><small>days in a row</small></div>
        <div><span>Orbit Balance</span><strong>{availablePoints} ★</strong><small>{pointsToRestore ? `${pointsToRestore} ★ to restore` : "ready to spend"}</small></div>
        <div><span>Orbit Total</span><strong>{orbitTotal} ★</strong><small>backed by saved progress</small></div>
      </section>
      <aside className="points-explainer" data-tour="points"><span>★</span><p><strong>What are Orbit Points?</strong> You earn <b>10 points for a recorded habit completion.</b> Your <b>Orbit Balance</b> is what you can spend on plant care, while <b>Orbit Total</b> records the points backed by your saved progress. Undoing a completion reverses its 10 points; if they were already spent, new points restore the balance before they can be spent.</p></aside>
      <section className="weekly-review" aria-labelledby="weekly-review-title"><div className="panel-heading"><span className="heatmap-kicker">Your last seven days</span><h2 id="weekly-review-title">Weekly Review</h2></div><div className="weekly-review-grid"><article><strong>{weeklyReview.completed}</strong><span>habits completed</span></article><article><strong>{weeklyReview.points} ★</strong><span>points earned</span></article><article><strong>{weeklyReview.percent}%</strong><span>weekly completion</span></article><article><strong>{weeklyReview.bestDay}</strong><span>strongest day</span></article></div></section>
      <section className="insights-panel dashboard-extra" aria-label="Progress insights"><div className="panel-heading"><span className="heatmap-kicker">Your patterns</span><h2>Progress insights</h2></div><div className="insight-grid"><div><strong>{weekInsights.percent}%</strong><span>completion this week</span><i style={{ width: `${weekInsights.percent}%` }} /></div><div><strong>{weekInsights.strongest}</strong><span>strongest recent day</span></div><div><strong>{weekInsights.consistent}</strong><span>most consistent habit</span></div></div></section>

      <section className="dashboard-plant" data-tour="plant" aria-label="My Orbit plant">
        <div className="panel-heading"><span className="heatmap-kicker">Your growing companion</span><h2>My Orbit Plant</h2><p>Every habit helps your little garden grow.</p></div>
        <div className="plant-shop-content">
          <div className={`plant-display ${plantClass} pot-scene-${plantPotLevel} plant-art-stage-${illustratedPlantStage}`} aria-label={`${plantType}, growth level ${plantStage} of 8`}>
            <div className="plant-sparkles">✦ · ✧</div>
            <img key={`${plantType}-${illustratedPlantStage}`} className="plant-stage-picture" src={`/plants/cartoon-stages/${plantAssetSlug}-${illustratedPlantStage}.webp`} alt={`${plantType}, growth stage ${plantStage} of 8`} onError={(event) => { const image = event.currentTarget; if (image.dataset.fallback) image.hidden = true; else { image.dataset.fallback = "true"; image.src = "/plants/cartoon-stages/sunflower-0.webp"; } }} />
            <img key={`pot-${plantPotLevel}`} className={`upgraded-pot pot-level-${plantPotLevel}`} src={`/plants/pots/pot-${plantPotLevel}.webp`} alt={`Illustrated pot quality ${plantPotLevel + 1} of 7`} onError={(event) => { const image = event.currentTarget; if (image.dataset.fallback) image.hidden = true; else { image.dataset.fallback = "true"; image.src = "/plants/pots/pot-0.webp"; } }} />
            {plantEffect === "water" && <div key={`water-${plantEffectId}`} className="plant-care-effect water-effect" aria-hidden="true"><div className="watering-can"><i /><b /></div>{Array.from({ length: 9 }, (_, index) => <span key={index} />)}</div>}
            {plantEffect === "sun" && <div key={`sun-${plantEffectId}`} className="plant-care-effect sun-effect" aria-hidden="true"><div className="travelling-sun"><i /></div><span className="sun-warmth" /></div>}
            {plantEffect === "fertiliser" && <div key={`fertiliser-${plantEffectId}`} className="plant-care-effect fertiliser-effect" aria-hidden="true"><i className="fertiliser-scoop left" /><i className="fertiliser-scoop right" />{Array.from({ length: 22 }, (_, index) => <span key={index} style={{ left: `${5 + (index % 11) * 9}%`, animationDelay: `${(index % 7) * .09}s` }} />)}</div>}
            {plantEffect === "pot" && <div key={`pot-effect-${plantEffectId}`} className="plant-care-effect pot-effect" aria-hidden="true"><span /><span /><span /></div>}
            <strong>{plantDisplayName}</strong><small>{plantType} · Growth level {plantStage}/8 · Pot {plantPotLevel + 1}/7 · {plantXp} care points</small>
          </div>
          <div className="plant-controls"><div className="plant-levels"><span>Plant growth <b>{plantStage}/8</b></span><i><b style={{ width: `${plantStage / 8 * 100}%` }} /></i><span>Pot quality <b>{plantPotLevel + 1}/7</b></span></div><label>Choose your plant<select value={plantType} onChange={(event) => setPlantType(event.target.value)}>{PLANT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Name this plant<input className="plant-name-input" value={plantNames[plantType] ?? ""} onChange={(event) => setPlantNames((current) => ({ ...current, [plantType]: event.target.value.slice(0, 24) }))} placeholder={`e.g. Sunny the ${plantType}`} /></label><div className="plant-reset-actions"><button className="random-plant" onClick={() => setPlantType(PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)])}>🎲 Surprise me</button><button className="random-plant" onClick={resetCurrentPlant} disabled={!plantXp}>🌱 Plant a new seed</button></div><div className="care-grid realistic-care-grid">{plantCareItems.map((care) => <button key={care.effect} disabled={plantEffect !== null || availablePoints < care.cost || (care.effect === "pot" ? plantPotLevel >= 6 : plantStage >= 8)} onClick={() => careForPlant(care.cost, care.growth, care.effect)}><span className={`care-icon care-icon-${care.effect}`} aria-hidden="true" /><strong>{care.name}</strong><small>{care.cost} ★ · +{care.growth} growth</small><em>{care.detail}</em></button>)}</div><p className="plant-care-status" aria-live="polite">{plantEffect === "water" ? "Watering gently…" : plantEffect === "sun" ? "Warming the leaves…" : plantEffect === "fertiliser" ? "Sprinkling plant food…" : plantEffect === "pot" ? `Pot upgraded to level ${plantPotLevel + 1}!` : plantPotLevel >= 6 ? "Your plant has the finest Orbit pot." : "Choose some care and watch the garden respond."}</p>{plantStage >= 8 && <p className="plant-complete">Your plant is fully grown! You can still collect every pot upgrade. 🌟</p>}</div>
        </div>
        <section className="plant-collection" aria-labelledby="plant-collection-title"><div className="panel-heading"><span className="heatmap-kicker">Your growing family</span><h3 id="plant-collection-title">Plant Collection</h3></div><div className="plant-collection-grid">{PLANT_TYPES.map((type) => { const xp = plantProgress[type] ?? 0; const stage = Math.min(8, Math.floor(xp / 25)); const artStage = Math.min(6, Math.round(stage * 6 / 8)); const slug = type.toLowerCase().replaceAll(" ", "-"); return <button type="button" key={type} className={plantType === type ? "active" : ""} aria-pressed={plantType === type} onClick={() => setPlantType(type)}><img src={`/plants/cartoon-stages/${slug}-${artStage}.webp`} alt="" /><span><strong>{plantNames[type]?.trim() || type}</strong><small>{plantNames[type]?.trim() ? `${type} · ` : ""}Level {stage}/8</small><i><b style={{ width: `${stage / 8 * 100}%` }} /></i></span></button>; })}</div></section>
      </section>
      </div>}

      {activePage === "Today's Focus" && <div className="page-section page-focus">
      <section className="focus-panel"><div className="panel-heading"><span className="heatmap-kicker">Only what matters now</span><h2>Today’s Focus</h2><p>A calm, distraction-free view of what needs your attention today.</p></div><div className="focus-columns"><div><h3>Habits due</h3>{habits.filter((habit) => !habitIsChecked(habit)).map((habit) => <button key={habit.id} aria-label={`Complete ${habit.name}`} onClick={() => toggleHabit(habit.id)}><span className="check" aria-hidden="true" />{habit.name}<small>+10 ★</small></button>)}{habits.length > 0 && habits.every(habitIsChecked) && <p>Everything is complete — brilliant work! ✨</p>}{!habits.length && <p>Add a habit to begin.</p>}</div><div><h3>Next appointments</h3>{allCalendarItems.filter((item) => appointmentOccurs(item, days[4])).map((item) => <article key={item.id}><strong>{item.title}</strong><small>{item.allDay ? "All day" : item.time} · {item.section}</small></article>)}{!allCalendarItems.some((item) => appointmentOccurs(item, days[4])) && <p>Nothing planned for today.</p>}</div></div></section>
      </div>}

      {activePage === "My Habits" && <div className="page-section page-habits">
      <div className="date-strip" aria-label="Five day history legend">
        <p>Today · {days[4].toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
        <div className="day-labels" aria-hidden="true">
          {days.map((day) => <span key={dateKey(day)}>{day.toLocaleDateString("en-US", { weekday: "narrow" })}</span>)}
        </div>
      </div>

      <section className="heatmap-panel" data-tour="heatmap" aria-label="Twelve week completion activity">
        <div className="heatmap-heading">
          <div><span className="heatmap-kicker">Power-up map</span><h2>My last 12 weeks</h2></div>
          <div className="heatmap-legend" aria-label="Completion intensity legend"><span>Less</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`level-${level}`} />)}<span>More</span></div>
        </div>
        <div className="heatmap-scroll">
          <div className="heatmap" role="img" aria-label="Daily habit completions over the last twelve weeks">
            {heatmapDays.map((day) => {
              const activity = dayActivity(day);
              return <span key={dateKey(day)} className={`heat-cell level-${activity.level}`} title={`${day.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}: ${activity.count} completed`} />;
            })}
          </div>
        </div>
      </section>

      <div className="habits-toolbar primary-actions" aria-label="Habit actions">
        <button className="manage-button" onClick={() => setCategoriesOpen(true)}><span aria-hidden="true">☷</span> Manage sections</button>
        <button className="add-button" onClick={() => categories.length ? setModalOpen(true) : setCategoriesOpen(true)}><span aria-hidden="true">+</span> Create habit</button>
      </div>

      <div className="habit-search" role="search"><input aria-label="Search habits" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search habits…" /><div>{(["All", "Due", "Done"] as const).map((item) => <button key={item} className={habitFilter === item ? "active" : ""} onClick={() => setHabitFilter(item)}>{item}</button>)}</div></div>

      <section className={`habit-board ${ready ? "is-ready" : ""}`} data-tour="habits" aria-label="Habit list">
        {categories.map((group) => {
          const groupHabits = habits.filter((habit) => habit.category === group && habit.name.toLowerCase().includes(search.toLowerCase()) && (habitFilter === "All" || (habitFilter === "Done" ? habitIsChecked(habit) : !habit.paused && !habitIsChecked(habit))));
          const completed = groupHabits.filter(habitIsChecked).length;
          return (
            <section className="habit-group" key={group}>
              <button className="group-header" onClick={() => setCollapsed((current) => ({ ...current, [group]: !current[group] }))} aria-expanded={!collapsed[group]}>
                <span className={`chevron ${collapsed[group] ? "collapsed" : ""}`}>⌄</span><span className="group-name">{group}</span><span className="group-count">{completed}/{groupHabits.length}</span><span className="group-line" />
              </button>
              {!collapsed[group] && <div className="rows">{groupHabits.length === 0 ? <button className="empty-row" onClick={() => { setCategory(group); setModalOpen(true); }}>+ Add a habit</button> : groupHabits.map((habit) => { const done = habitIsChecked(habit); const streak = streakStats(habit); const tint = habit.color ?? JELLY_COLORS[0]; return <div className={`habit-row ${done ? "done" : ""} ${habit.paused ? "paused" : ""}`} style={{ borderColor: `color-mix(in srgb, ${tint} 58%, white)`, background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 52%, white), color-mix(in srgb, ${tint} 28%, white))` }} key={habit.id} role="checkbox" aria-checked={done} tabIndex={0} onClick={() => toggleHabit(habit.id)} onKeyDown={(event) => rowKey(event, habit.id)}><span className="check" aria-hidden="true">{done ? "✓" : ""}</span><span className="habit-copy"><span className="habit-name">{habit.name}</span><span className="due-label">{habit.frequency ?? "Daily"}</span></span><span className={`streak-pill ${streak.current ? "active" : ""}`}><span>🔥 {streak.current}</span>{streak.milestone >= 10 && <b>🏅 {streak.milestone}</b>}</span><span className="habit-tools"><button className="edit" aria-label={`Edit ${habit.name}`} onClick={(event) => { event.stopPropagation(); editHabit(habit); }}><span aria-hidden="true">✎</span> Edit</button><button className="pause" aria-label={`${habit.paused ? "Resume" : "Pause"} ${habit.name}`} onClick={(event) => { event.stopPropagation(); toggleHabitPause(habit.id); }}><span aria-hidden="true">{habit.paused ? "▶" : "Ⅱ"}</span> {habit.paused ? "Resume" : "Pause"}</button><button className="remove" aria-label={`Remove ${habit.name}`} onClick={(event) => { event.stopPropagation(); setDeletingHabit(habit); }}><span aria-hidden="true">×</span> Remove</button></span><div className="matrix">{days.map((day) => { const key = dateKey(day); return <span key={key} className={habit.completions.includes(key) ? "hit" : "miss"} />; })}</div></div>; })}</div>}
            </section>
          );
        })}
        {ready && categories.length === 0 && <button className="blank-state" onClick={() => setCategoriesOpen(true)}>Create your first section <span>→</span></button>}
      </section>
      </div>}

      {activePage === "Calendar" && <div className="page-section page-calendar">
      <section className="calendar-panel" data-tour="calendar" id="calendar" aria-label="Appointment calendar">
        {savedAppointmentId && <div className="calendar-toast" role="status">✓ Appointment added!</div>}
        <div className="calendar-top">
          <div><span className="heatmap-kicker">My plans</span><h2>{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2></div>
          <div className="calendar-actions">
            <div className="view-switch" aria-label="Calendar view">{(["Month", "Week", "Day"] as const).map((view) => <button key={view} className={calendarView === view ? "active" : ""} onClick={() => setCalendarView(view)}>{view}</button>)}</div>
            <button aria-label="Previous month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}>‹</button>
            <button onClick={() => { const d = new Date(); d.setDate(1); d.setHours(12, 0, 0, 0); setCalendarMonth(d); }}>Today</button>
            <button aria-label="Next month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}>›</button>
            <button className="new-event" onClick={() => appointmentSections.length ? setAppointmentOpen(true) : setAppointmentOpen(true)}>+ Plan</button>
          </div>
        </div>
        {calendarView !== "Day" && <div className={`calendar-weekdays ${calendarView === "Week" ? "week-view" : ""}`} aria-hidden="true">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>}
        <div className={`calendar-grid ${calendarView.toLowerCase()}-view`}>
          {visibleCalendarDays.map((day) => {
            const items = allCalendarItems.filter((item) => visibleCalendarSections[item.section] !== false && appointmentOccurs(item, day));
            const currentMonth = day.getMonth() === calendarMonth.getMonth();
            const menuOpen = selectedCalendarEvent?.date === dateKey(day);
            return <div key={dateKey(day)} role="button" tabIndex={0} className={`calendar-day ${currentMonth ? "" : "outside"} ${dateKey(day) === today ? "today" : ""} ${menuOpen ? "menu-open" : ""}`} onClick={() => setSelectedDay(dateKey(day))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/appointment-id"); const fromDate = event.dataTransfer.getData("text/appointment-date"); if (id && fromDate) requestAppointmentMove(id, fromDate, dateKey(day)); }} onKeyDown={(event) => { if (event.key === "Enter") setSelectedDay(dateKey(day)); }}>
              <span className="day-number">{day.getDate()}</span>
              <span className="day-events">{items.slice(0, calendarView === "Month" ? 2 : 8).map((item) => <button type="button" style={{ backgroundColor: sectionColors[item.section] }} draggable={item.section !== UK_HOLIDAYS} key={item.id} className={`event-chip event-${calendarSections.indexOf(item.section) % 4}`} title={`${item.title}${item.section === UK_HOLIDAYS ? "" : " · Drag to move"}`} onDragStart={(event) => { if (item.section !== UK_HOLIDAYS) { event.stopPropagation(); event.dataTransfer.setData("text/appointment-id", item.id); event.dataTransfer.setData("text/appointment-date", dateKey(day)); } }} onClick={(event) => { event.stopPropagation(); setSelectedCalendarEvent((current) => current?.id === item.id && current.date === dateKey(day) ? null : { id: item.id, date: dateKey(day) }); setRecurringDeleteOpen(false); }}>{item.repeat !== "None" ? "↻ " : ""}{item.title}</button>)}{items.length > (calendarView === "Month" ? 2 : 8) && <small>+{items.length - (calendarView === "Month" ? 2 : 8)} more</small>}</span>
              {selectedCalendarEvent?.date === dateKey(day) && (() => { const item = allCalendarItems.find((entry) => entry.id === selectedCalendarEvent.id); return item ? <div className="event-dropdown"><strong>{item.title}</strong>{!recurringDeleteOpen ? <><button type="button" onClick={() => showDayDetails(dateKey(day))}>See Details</button>{item.section !== UK_HOLIDAYS && <><button type="button" onClick={() => editAppointment(item)}>Edit</button><button type="button" className="danger" onClick={() => item.repeat === "None" ? deleteCalendarOccurrence(item, dateKey(day), "one") : setRecurringDeleteOpen(true)}>Delete</button></>}</> : <><small>Delete recurring event:</small><button type="button" onClick={() => deleteCalendarOccurrence(item, dateKey(day), "one")}>Only this one</button><button type="button" className="danger" onClick={() => deleteCalendarOccurrence(item, dateKey(day), "future")}>This &amp; future</button><button type="button" onClick={() => setRecurringDeleteOpen(false)}>Cancel</button></>}</div> : null; })()}
            </div>;
          })}
        </div>
        <div className="appointment-list" data-tour="calendar-lists">
          {calendarSections.map((section) => {
            const upcoming = upcomingForSection(section);
            return <details className="appointment-section" style={{ borderColor: sectionColors[section] }} key={section}><summary className="appointment-section-title"><label><input type="checkbox" checked={visibleCalendarSections[section] !== false} onClick={(event) => event.stopPropagation()} onChange={(event) => setVisibleCalendarSections((current) => ({ ...current, [section]: event.target.checked }))} /><input className="section-color" type="color" aria-label={`${section} colour`} value={sectionColors[section] ?? JELLY_COLORS[calendarSections.indexOf(section) % JELLY_COLORS.length]} onClick={(event) => event.stopPropagation()} onChange={(event) => setSectionColors((current) => ({ ...current, [section]: event.target.value }))} /><span>{section}</span></label><span className="section-title-actions"><small>{upcoming.length}</small>{section !== UK_HOLIDAYS && <button aria-label={`Delete ${section} section`} onClick={(event) => { event.preventDefault(); deleteAppointmentSection(section); }}>{appointmentSectionDeleteConfirm === section ? "Delete plans too?" : "×"}</button>}<i>⌄</i></span></summary>{upcoming.length ? <div className="appointment-section-scroll">{upcoming.map(({ item, date }) => <div className={`appointment-row ${savedAppointmentId === item.id ? "just-added" : ""}`} key={`${item.id}-${date}`}><span className="appointment-dot" style={{ backgroundColor: sectionColors[section] }} /><span><b>{item.title}</b><small>{new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {item.allDay ? "All day" : item.time}{item.repeat !== "None" ? ` · ${item.repeat}` : ""}</small></span>{section !== UK_HOLIDAYS && <button aria-label={`Delete ${item.title}`} onClick={() => setAppointments((current) => current.filter((entry) => entry.id !== item.id))}>×</button>}</div>)}</div> : <p>No future plans</p>}</details>;
          })}
        </div>
      </section>

      {selectedDay && <aside className="day-detail" id="day-details" aria-label="Selected day details" tabIndex={-1}>
        <div><span className="heatmap-kicker">Day details</span><h2>{new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2></div>
        <button className="day-add" onClick={() => { setAppointmentDate(selectedDay); setEditingAppointmentId(null); setAppointmentOpen(true); }}>+ Add plan</button>
        <button className="day-close" aria-label="Close day details" onClick={() => setSelectedDay(null)}>×</button>
        <div className="day-detail-list">{allCalendarItems.filter((item) => visibleCalendarSections[item.section] !== false && appointmentOccurs(item, new Date(`${selectedDay}T12:00:00`))).map((item) => <button key={item.id} onClick={() => item.section !== UK_HOLIDAYS && editAppointment(item)}><b>{item.title}</b><small>{item.allDay ? "All day" : item.time} · {item.section}{item.repeat !== "None" ? ` · ${item.repeat}` : ""}</small></button>)}{!allCalendarItems.some((item) => visibleCalendarSections[item.section] !== false && appointmentOccurs(item, new Date(`${selectedDay}T12:00:00`))) && <p>Nothing planned yet — make this day sparkle!</p>}</div>
      </aside>}
      </div>}

      {activePage === "Hall of Fame" && <div className="page-section page-hall">
      <section className="hall-of-fame hall-page" data-tour="hall">
        <header className="hall-heading"><div><span className="heatmap-kicker">Your trophy cabinet</span><h2>Hall of Fame</h2></div><span className="hall-progress"><strong>{achievements.filter((item) => item.unlocked).length}/{achievements.length} unlocked</strong></span></header>
        <div className="badge-grid">{achievements.map((achievement) => <button type="button" onClick={() => setSelectedAchievement(achievement)} key={achievement.id} className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`} aria-label={`${achievement.title}: ${achievement.unlocked ? "unlocked" : "locked"}`}><span>{achievement.unlocked ? achievement.icon : "?"}</span><div><strong>{achievement.title}</strong><p>{achievement.description}</p></div><small>{achievement.unlocked ? "Unlocked · See details" : "See progress"}</small></button>)}</div>
      </section>
      </div>}

      {selectedAchievement && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedAchievement(null)}><div className="modal achievement-detail" role="dialog" aria-modal="true"><button className="modal-close" aria-label="Close" onClick={() => setSelectedAchievement(null)}>×</button><span>{selectedAchievement.unlocked ? selectedAchievement.icon : "🔒"}</span><p className="modal-kicker">{selectedAchievement.unlocked ? "Achievement unlocked" : "Achievement in progress"}</p><h2>{selectedAchievement.title}</h2><p>{selectedAchievement.description}</p><strong>{selectedAchievement.unlocked ? "This badge is safely stored in your Hall of Fame." : "Keep completing habits and building your streaks to unlock it."}</strong></div></div>}
      {pendingRecurringMove && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPendingRecurringMove(null)}><div className="modal recurring-move-modal" role="dialog" aria-modal="true" aria-labelledby="move-series-title"><button className="modal-close" aria-label="Cancel move" onClick={() => setPendingRecurringMove(null)}>×</button><p className="modal-kicker">Recurring appointment</p><h2 id="move-series-title">What would you like to move?</h2><p>Move just the appointment on <strong>{new Date(`${pendingRecurringMove.fromDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</strong>, or shift the entire repeating series by the same number of days?</p><div className="recurring-move-actions"><button type="button" onClick={() => confirmRecurringMove("one")}><span>1</span><strong>Only this one</strong><small>The rest of the series stays where it is.</small></button><button type="button" onClick={() => confirmRecurringMove("all")}><span>↻</span><strong>Move all events</strong><small>Every occurrence shifts together.</small></button></div><button className="deletion-cancel" type="button" onClick={() => setPendingRecurringMove(null)}>Cancel move</button></div></div>}
      {installHelpOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setInstallHelpOpen(false)}><div className="modal install-help-modal" role="dialog" aria-modal="true" aria-labelledby="install-orbit-title"><button className="modal-close" aria-label="Close installation help" onClick={() => setInstallHelpOpen(false)}>×</button><OrbitLogo /><p className="modal-kicker">Keep Orbit close</p><h2 id="install-orbit-title">Install THE ORBIT</h2><div className="install-steps"><div><span>Apple</span><strong>iPhone or iPad</strong><p>Open Orbit in Safari, tap the Share button, then choose <b>Add to Home Screen</b>.</p></div><div><span>Android</span><strong>Android or Chromebook</strong><p>Open the browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</p></div><div><span>Desktop</span><strong>Mac or Windows</strong><p>Look for the install icon in the address bar or the browser’s app menu.</p></div></div><button className="submit-button" type="button" onClick={() => setInstallHelpOpen(false)}>Got it</button></div></div>}

      {deletingHabit && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setDeletingHabit(null)}><div className="modal deletion-safety-modal" role="dialog" aria-modal="true" aria-labelledby="delete-habit-title"><button className="modal-close" aria-label="Cancel deletion" onClick={() => setDeletingHabit(null)}>×</button><p className="modal-kicker">Progress safety check</p><h2 id="delete-habit-title">Delete “{deletingHabit.name}”?</h2><p className="deletion-intro">Choose what should happen to its completed history. Any achievement you already earned will stay safely unlocked either way.</p><button className="deletion-choice keep" type="button" onClick={() => confirmHabitDeletion(true)}><span>🛟</span><strong>Delete habit, keep progress</strong><small>Recommended · The habit disappears, but its past completions stay on your Power-up Map and its Orbit Points stay recorded.</small></button><button className="deletion-choice remove" type="button" onClick={() => confirmHabitDeletion(false)}><span>🗑️</span><strong>Delete habit and history</strong><small>Past completions leave the Power-up Map and their Orbit Points are reversed. Already-spent points must be restored with future completions.</small></button><button className="deletion-cancel" type="button" onClick={() => setDeletingHabit(null)}>Cancel — keep my habit</button></div></div>}

      <footer>⭐ <span>{habits.filter(habitIsChecked).length}</span> of {habits.length} currently complete — you&apos;ve got this!</footer>
      </div></div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button>
            <p className="modal-kicker">{editingHabitId ? "Update your routine" : "New adventure"}</p>
            <h2 id="modal-title">{editingHabitId ? "Edit habit ✏️" : "Add a habit ✨"}</h2>
            <form onSubmit={addHabit}>
              <label htmlFor="habit-name">What do you want to repeat?</label>
              <input ref={inputRef} id="habit-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Meditate for 5 minutes" maxLength={80} />
              <label htmlFor="habit-category">Section</label>
              <div className="category-picker">
                {categories.map((item) => <button key={item} type="button" className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}
              </div>
              <label htmlFor="habit-frequency">Refresh</label>
              <div className="frequency-picker" id="habit-frequency">
                {FREQUENCIES.map((item) => <button key={item} type="button" className={frequency === item ? "selected" : ""} onClick={() => setFrequency(item)}>{item}</button>)}
              </div>
              <span className="field-label">Jelly colour</span>
              <div className="jelly-picker">{JELLY_COLORS.map((color) => <button type="button" key={color} aria-label={`Choose ${color}`} aria-pressed={habitColor === color} className={habitColor === color ? "selected" : ""} style={{ backgroundColor: color }} onClick={() => setHabitColor(color)} />)}</div>
              {frequency === "Weekly" && <><span className="field-label">Days to do it</span><div className="weekday-picker">{["S","M","T","W","T","F","S"].map((day, index) => <button type="button" aria-pressed={habitWeekdays.includes(index)} aria-label={`${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][index]}`} key={`${day}-${index}`} className={habitWeekdays.includes(index) ? "selected" : ""} onClick={() => setHabitWeekdays((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])}>{day}</button>)}</div><label htmlFor="weekly-goal">Weekly goal: {weeklyGoal} time{weeklyGoal === 1 ? "" : "s"}</label><input id="weekly-goal" type="range" min="1" max="7" value={weeklyGoal} onChange={(event) => setWeeklyGoal(Number(event.target.value))} /></>}
              <button className="submit-button" type="submit" disabled={!name.trim()}>{editingHabitId ? "Save changes" : "Let’s do it!"} <span>→</span></button>
            </form>
          </div>
        </div>
      )}

      {categoriesOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCategoriesOpen(false)}>
          <div className="modal categories-modal" role="dialog" aria-modal="true" aria-labelledby="categories-title">
            <button className="modal-close" aria-label="Close" onClick={() => setCategoriesOpen(false)}>×</button>
            <p className="modal-kicker">Organise your habits</p>
            <h2 id="categories-title">Manage sections</h2>
            <p className="categories-intro">Create, rename and reorder the groups that keep your habits tidy.</p>
            <div className="category-list">
              {categories.map((item, index) => (
                <div className={`category-item ${editingCategory === item ? "editing" : ""}`} key={item}>
                  {editingCategory === item ? (
                    <input aria-label={`New name for ${item}`} value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") renameCategory(item); }} />
                  ) : <span>{item}</span>}
                  <span className="category-order"><button aria-label={`Move ${item} up`} title="Move up" disabled={index === 0} onClick={() => setCategories((current) => moveInList(current, index, -1))}>↑</button><button aria-label={`Move ${item} down`} title="Move down" disabled={index === categories.length - 1} onClick={() => setCategories((current) => moveInList(current, index, 1))}>↓</button></span>
                  <span className="category-actions"><button className="rename" onClick={() => editingCategory === item ? renameCategory(item) : (setEditingCategory(item), setEditingName(item))}>{editingCategory === item ? "Save" : "Rename"}</button>
                  <button className="danger" onClick={() => deleteCategory(item)}>{deleteConfirm === item ? "Confirm delete" : "Delete"}</button></span>
                </div>
              ))}
            </div>
            <form className="category-form" onSubmit={addCategory}>
              <label htmlFor="new-category">New section</label>
              <div><input id="new-category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. Night, Work, Weekend" maxLength={40} /><button type="submit" disabled={!newCategory.trim()}>Add</button></div>
            </form>
          </div>
        </div>
      )}

      {appointmentOpen && (
        <div className="modal-backdrop appointment-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAppointmentOpen(false)}>
          <div className="modal appointment-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-title">
            <button className="modal-close" aria-label="Close" onClick={() => setAppointmentOpen(false)}>×</button>
            <div className="appointment-modal-heading"><p className="modal-kicker">Something to look forward to</p><h2 id="appointment-title">{editingAppointmentId ? "Edit appointment ✏️" : "Plan an appointment 📅"}</h2></div>
            <form className="appointment-form" onSubmit={addAppointment} noValidate>
              <section className="appointment-form-section">
                <h3>What &amp; when</h3>
                <label htmlFor="appointment-name">What&apos;s happening?</label>
                <input id="appointment-name" value={appointmentTitle} onChange={(event) => { setAppointmentTitle(event.target.value); setAppointmentError(""); }} placeholder="e.g. Dentist, football practice" maxLength={80} />
                {appointmentError && <p className="form-error" role="alert">{appointmentError}</p>}
                <div className="appointment-fields"><div><label htmlFor="appointment-date">Date</label><input id="appointment-date" type="date" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} /></div><div><label htmlFor="appointment-time">Start</label><input id="appointment-time" type="time" value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)} disabled={appointmentAllDay} /></div><div><label htmlFor="appointment-end-time">End</label><input id="appointment-end-time" type="time" value={appointmentEndTime} onChange={(event) => setAppointmentEndTime(event.target.value)} disabled={appointmentAllDay} /></div></div>
                <label className="all-day-toggle"><input type="checkbox" checked={appointmentAllDay} onChange={(event) => setAppointmentAllDay(event.target.checked)} /><span>All-day adventure</span></label>
              </section>
              <section className="appointment-form-section">
                <h3>Calendar</h3>
                <span className="field-label">Repeats</span>
                <div className="frequency-picker appointment-repeat">{(["None", ...FREQUENCIES] as AppointmentRepeat[]).map((item) => <button key={item} type="button" className={appointmentRepeat === item ? "selected" : ""} onClick={() => setAppointmentRepeat(item)}>{item}</button>)}</div>
                <span className="field-label">Calendar section</span>
                <div className="category-picker appointment-categories">{appointmentSections.map((item) => <button key={item} type="button" className={appointmentSection === item ? "selected" : ""} onClick={() => setAppointmentSection(item)}>{item}</button>)}</div>
                <details className="appointment-section-manager"><summary>Manage calendar sections</summary><div className="inline-section-maker"><input aria-label="New calendar section" value={newAppointmentSection} onChange={(event) => setNewAppointmentSection(event.target.value)} placeholder="New section" /><button type="button" onClick={() => addAppointmentSection()} disabled={!newAppointmentSection.trim()}>Add</button></div><div className="section-delete-list">{appointmentSections.map((item, index) => <span key={item}><button type="button" aria-label={`Move ${item} up`} disabled={index === 0} onClick={() => setAppointmentSections((current) => moveInList(current, index, -1))}>↑</button><button type="button" aria-label={`Move ${item} down`} disabled={index === appointmentSections.length - 1} onClick={() => setAppointmentSections((current) => moveInList(current, index, 1))}>↓</button><button type="button" onClick={() => deleteAppointmentSection(item)}>{appointmentSectionDeleteConfirm === item ? `Confirm delete ${item} + plans` : `× ${item}`}</button></span>)}</div></details>
              </section>
              <section className="appointment-form-section">
                <h3>Extra details <span>optional</span></h3>
                <label htmlFor="appointment-location">Location</label><input id="appointment-location" value={appointmentLocation} onChange={(event) => setAppointmentLocation(event.target.value)} placeholder="e.g. School hall or 10 High Street" />
                <label htmlFor="appointment-notes">Notes</label><textarea id="appointment-notes" value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} placeholder="Anything useful to remember…" />
              </section>
              <section className="appointment-form-section">
                <h3>Getting ready <span>optional</span></h3>
                <span className="field-label">Reminder</span>
                <div className="frequency-picker reminder-picker">{[0, 5, 15, 30, 60].map((minutes) => <button key={minutes} type="button" className={appointmentReminder === minutes ? "selected" : ""} onClick={() => setAppointmentReminder(minutes)}>{minutes ? `${minutes} min` : "Off"}</button>)}</div>
                <span className="field-label">Travel time</span><div className="frequency-picker reminder-picker">{[0, 10, 20, 30, 45, 60].map((minutes) => <button key={minutes} type="button" className={appointmentTravel === minutes ? "selected" : ""} onClick={() => setAppointmentTravel(minutes)}>{minutes ? `${minutes} min` : "None"}</button>)}</div>{appointmentTravel > 0 && appointmentReminder > 0 && <p className="travel-note">Your notification will arrive {appointmentReminder} minutes before travel time.</p>}
                {appointmentReminder > 0 && !notificationsEnabled && <button type="button" className="notification-button" onClick={enableNotifications}>Enable browser reminders 🔔</button>}
              </section>
              <div className="appointment-submit-bar"><button className="submit-button" type="submit">{editingAppointmentId ? "Save changes" : "Add to calendar"} <span>→</span></button></div>
            </form>
          </div>
        </div>
      )}
      <div className={`quick-add ${quickAddOpen ? "open" : ""}`}><div className="quick-add-menu" aria-hidden={!quickAddOpen}><button type="button" tabIndex={quickAddOpen ? 0 : -1} onClick={() => { setQuickAddOpen(false); setActivePage("My Habits"); setEditingHabitId(null); setName(""); if (categories.length) setModalOpen(true); else setCategoriesOpen(true); }}>✓ New habit</button><button type="button" tabIndex={quickAddOpen ? 0 : -1} onClick={() => { setQuickAddOpen(false); setActivePage("Calendar"); setEditingAppointmentId(null); setAppointmentError(""); setAppointmentOpen(true); }}>▦ New appointment</button></div><button type="button" className="quick-add-trigger" aria-label={quickAddOpen ? "Close quick add menu" : "Quick add"} aria-expanded={quickAddOpen} onClick={() => setQuickAddOpen((current) => !current)}>{quickAddOpen ? "×" : "+"}</button></div>
      {undoAction && <div className="undo-toast" role="status"><span>{undoAction.message}</span><button type="button" onClick={() => { undoAction.run(); setUndoAction(null); playSound("undo"); }}>Undo</button><button type="button" className="undo-close" aria-label="Dismiss" onClick={() => setUndoAction(null)}>×</button></div>}
    </main>
  );
}
