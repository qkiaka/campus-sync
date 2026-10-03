// 拡張機能がないときに見せるサンプルデータ（毎回同じ内容になるよう擬似乱数を固定）
import { DEFAULT_SETTINGS, PURPOSES } from '../../../shared/constants';
import { buildPrompt, promptToText } from '../../../shared/questions';
import type { CheckIn, Session, Snapshot } from '../../../shared/types';

export function makeDemoSnapshot(now = Date.now()): Snapshot {
  let seed = 20240607;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const sessions: Session[] = [];
  const checkIns: CheckIn[] = [];

  for (let back = 6; back >= 0; back--) {
    const n = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const start = new Date(now);
      start.setDate(start.getDate() - back);
      start.setHours(7 + Math.floor(rnd() * 15), Math.floor(rnd() * 60), 0, 0);
      if (start.getTime() > now) continue;
      const duration = Math.round((3 + rnd() * 40) * 60000);
      const purpose = PURPOSES[Math.floor(rnd() * (PURPOSES.length - 1))];
      const off = rnd() < 0.5 ? Math.round(duration * rnd() * 0.6) : 0;
      const id = `demo-${back}-${i}`;
      sessions.push({
        id, userId: 'demo', startedAt: start.getTime(), endedAt: start.getTime() + duration, duration,
        initialPurpose: purpose, initialPurposeDetail: null,
        finalPurpose: purpose, finalPurposeDetail: null,
        purposeChanged: off > 0 && rnd() < 0.3,
        interruptionCount: Math.floor(duration / (10 * 60000)),
        offPurposeMs: off,
      });
      for (const m of [5, 15, 30].filter((m) => m * 60000 <= duration)) {
        const p = buildPrompt(m);
        const c = p.choices[Math.floor(rnd() * p.choices.length)];
        checkIns.push({
          id: `${id}-${m}`, sessionId: id, elapsedTime: m * 60000,
          question: promptToText(p), answer: c.label, createdAt: start.getTime() + m * 60000,
        });
      }
    }
  }
  return {
    user: { id: 'demo', createdAt: now },
    settings: { ...DEFAULT_SETTINGS },
    sessions, checkIns, active: null,
  };
}
