import { parseISO, toISO } from "./dates";

export type DayRow = { day: string; steps: number };

// One entry per calendar day from start to end (inclusive); missing days count as 0 steps
export function buildDays(
  rows: DayRow[],
  start: string,
  end: string,
): DayRow[] {
  const byDay = new Map(rows.map((r) => [r.day, r.steps]));
  const out: DayRow[] = [];
  const d = parseISO(start);
  const last = parseISO(end);
  while (d <= last && out.length < 120) {
    const key = toISO(d);
    out.push({ day: key, steps: byDay.get(key) ?? 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Stats over the days that already happened (up to and including today)
export function computeStats(days: DayRow[], goal: number, today: string) {
  const elapsed = days.filter((d) => d.day <= today);
  const total = elapsed.reduce((sum, d) => sum + d.steps, 0);
  const avg = elapsed.length ? Math.round(total / elapsed.length) : 0;
  const best = elapsed.reduce<DayRow | null>(
    (b, d) => (!b || d.steps > b.steps ? d : b),
    null,
  );
  const goalDays = elapsed.filter((d) => d.steps >= goal).length;

  // Streak = consecutive days at goal, counting back from today.
  // If today isn't at goal yet, it doesn't break the streak (the day isn't over).
  let i = elapsed.length - 1;
  if (i >= 0 && elapsed[i].day === today && elapsed[i].steps < goal) i--;
  let streak = 0;
  while (i >= 0 && elapsed[i].steps >= goal) {
    streak++;
    i--;
  }

  return { total, avg, best, goalDays, streak, elapsed: elapsed.length };
}
