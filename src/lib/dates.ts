// "2026-11-02" in local time (toISOString would shift the day because of UTC)
export function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const todayISO = () => toISO(new Date());

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Is a competition upcoming, live or finished, and what text to show
export function competitionInfo(start: string, end: string) {
  const DAY = 86400000;
  const today = parseISO(todayISO());
  const s = parseISO(start);
  const e = parseISO(end);

  if (today < s) {
    const n = Math.round((s.getTime() - today.getTime()) / DAY);
    return {
      status: "upcoming" as const,
      text: n === 1 ? "Starts tomorrow" : `Starts in ${n} days`,
    };
  }
  if (today > e) return { status: "finished" as const, text: "Finished" };

  const left = Math.round((e.getTime() - today.getTime()) / DAY);
  return {
    status: "live" as const,
    text:
      left === 0 ? "Last day" : left === 1 ? "1 day left" : `${left} days left`,
  };
}
