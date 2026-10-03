import { UNSET_PURPOSE } from '../../../shared/constants';
import type { Session, Snapshot } from '../../../shared/types';

const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];

export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 終了済み + 進行中 */
export function allSessions(s: Snapshot): Session[] {
  return s.active ? [...s.sessions, s.active] : s.sessions;
}

/** 端末のタイムゾーンで、日をまたぐセッションは開始日にまとめる */
export function todayStats(s: Snapshot, now = Date.now()) {
  const key = dayKey(now);
  const today = allSessions(s).filter((x) => dayKey(x.startedAt) === key);
  return {
    totalMs: today.reduce((a, x) => a + x.duration, 0),
    count: today.length,
    offPurposeMs: today.reduce((a, x) => a + x.offPurposeMs, 0),
  };
}

export interface DayPoint {
  key: string;
  label: string;
  isToday: boolean;
  totalMs: number;
  count: number;
}

export function dailySeries(s: Snapshot, days = 7, now = Date.now()): DayPoint[] {
  const sessions = allSessions(s);
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    const day = sessions.filter((x) => dayKey(x.startedAt) === key);
    out.push({
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAY[d.getDay()]}）`,
      isToday: i === 0,
      totalMs: day.reduce((a, x) => a + x.duration, 0),
      count: day.length,
    });
  }
  return out;
}

export function purposeSeries(s: Snapshot, days = 7, now = Date.now()) {
  const keys = new Set(dailySeries(s, days, now).map((d) => d.key));
  const map = new Map<string, number>();
  for (const x of allSessions(s)) {
    if (!keys.has(dayKey(x.startedAt))) continue;
    const name = x.initialPurpose ?? UNSET_PURPOSE;
    map.set(name, (map.get(name) ?? 0) + x.duration);
  }
  return [...map.entries()].map(([label, ms]) => ({ label, ms })).sort((a, b) => b.ms - a.ms);
}
