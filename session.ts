// セッションの計算ロジック（chrome API に依存しない純粋な関数）。
import type { Session, Settings } from '../../shared/types';

/** 進行中セッションの内部状態 */
export interface Active {
  session: Session;
  /** すでに確認を出した（または飛ばした）間隔(分) */
  firedMilestones: number[];
  /** 目的の入力画面を一度出したか */
  purposePrompted: boolean;
  /** 現在の自己申告：目的どおり(on) / 目的とは違う(off) */
  mode: 'on' | 'off';
  /** mode が切り替わった時点の session.duration */
  modeSinceMs: number;
  /** 画面に表示されていることを最後に確認した時刻 */
  lastVisibleAt: number;
}

/** 前回の心拍からこれ以上空いたら、その間は「表示されていなかった」とみなして加算しない */
export const BEAT_CAP_MS = 7000;
/** 表示されない状態がこれだけ続いたらセッションを終える */
export const IDLE_END_MS = 10 * 60 * 1000;
/** これより短いセッションは記録しない（誤クリック対策） */
export const MIN_SESSION_MS = 10 * 1000;

export function newActive(userId: string, now: number): Active {
  return {
    session: {
      id: crypto.randomUUID(),
      userId,
      startedAt: now,
      endedAt: null,
      duration: 0,
      initialPurpose: null,
      initialPurposeDetail: null,
      finalPurpose: null,
      finalPurposeDetail: null,
      purposeChanged: false,
      interruptionCount: 0,
      offPurposeMs: 0,
    },
    firedMilestones: [],
    purposePrompted: false,
    mode: 'on',
    modeSinceMs: 0,
    lastVisibleAt: now,
  };
}

/** YouTubeタブが表示されている間、約5秒ごとに呼ばれる */
export function applyBeat(a: Active, now: number, visible: boolean): void {
  if (!visible) return;
  const dt = Math.max(0, now - a.lastVisibleAt);
  if (dt <= BEAT_CAP_MS) a.session.duration += dt;
  a.lastVisibleAt = now;
}

export function isStale(a: Active, now: number): boolean {
  return now - a.lastVisibleAt > IDLE_END_MS;
}

/** 次に出すべき確認（分）。複数たまっていたら一番大きいものだけ */
export function dueMilestone(a: Active, settings: Settings): number | null {
  const elapsedMin = a.session.duration / 60000;
  const due = settings.intervalsMin.filter((m) => elapsedMin >= m && !a.firedMilestones.includes(m));
  return due.length ? Math.max(...due) : null;
}

export function setMode(a: Active, mode: 'on' | 'off'): void {
  if (a.mode === mode) return;
  if (a.mode === 'off') a.session.offPurposeMs += a.session.duration - a.modeSinceMs;
  a.mode = mode;
  a.modeSinceMs = a.session.duration;
}

/** 進行中でも「今この瞬間まで」の目的外時間を含めた表示用セッション */
export function liveSession(a: Active): Session {
  const open = a.mode === 'off' ? a.session.duration - a.modeSinceMs : 0;
  return { ...a.session, offPurposeMs: a.session.offPurposeMs + open };
}

export function finalize(a: Active, endedAt: number): Session {
  setMode(a, 'on'); // 開いている目的外区間を閉じる
  return { ...a.session, endedAt };
}
