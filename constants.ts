import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  askPurpose: true,
  intervalsMin: [5, 15, 30, 45, 60],
};

export const PURPOSES = [
  '見たい動画がある',
  '学習・勉強',
  '調べもの',
  '音楽を聴く',
  '暇つぶし',
  'なんとなく',
  'その他',
] as const;

export const OTHER_PURPOSE = 'その他';
export const UNSET_PURPOSE = '未設定';

export const MAX_INTERVALS = 10;
export const MAX_INTERVAL_MIN = 600;

/** 設定値を安全な形に整える（重複削除・昇順・範囲チェック） */
export function normalizeIntervals(values: unknown): number[] {
  if (!Array.isArray(values)) return [...DEFAULT_SETTINGS.intervalsMin];
  const nums = values
    .map((v) => Math.round(Number(v)))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= MAX_INTERVAL_MIN);
  return [...new Set(nums)].sort((a, b) => a - b).slice(0, MAX_INTERVALS);
}

export function normalizeSettings(input: Partial<Settings> | undefined): Settings {
  return {
    enabled: input?.enabled ?? DEFAULT_SETTINGS.enabled,
    askPurpose: input?.askPurpose ?? DEFAULT_SETTINGS.askPurpose,
    intervalsMin: input?.intervalsMin ? normalizeIntervals(input.intervalsMin) : [...DEFAULT_SETTINGS.intervalsMin],
  };
}
