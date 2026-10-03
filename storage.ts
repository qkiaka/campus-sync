// chrome.storage.local の薄いラッパー。
// 将来 Supabase などで同期するときは、ここの読み書きを差し替えます。
import type { CheckIn, Session, Settings, User } from '../../shared/types';
import { normalizeSettings } from '../../shared/constants';
import type { Active } from './session';

const get = async <T>(key: string): Promise<T | undefined> => {
  const r = await chrome.storage.local.get(key);
  return r[key] as T | undefined;
};
const set = (key: string, value: unknown) => chrome.storage.local.set({ [key]: value });

export async function getUser(): Promise<User> {
  let u = await get<User>('user');
  if (!u) {
    u = { id: crypto.randomUUID(), createdAt: Date.now() };
    await set('user', u);
  }
  return u;
}

export async function getSettings(): Promise<Settings> {
  return normalizeSettings(await get<Partial<Settings>>('settings'));
}
export const saveSettings = (s: Settings) => set('settings', s);

export const getSessions = async () => (await get<Session[]>('sessions')) ?? [];
export const getCheckIns = async () => (await get<CheckIn[]>('checkIns')) ?? [];

export async function addSession(s: Session): Promise<void> {
  await set('sessions', [...(await getSessions()), s]);
}
export async function addCheckIn(c: CheckIn): Promise<void> {
  await set('checkIns', [...(await getCheckIns()), c]);
}

export const getActive = () => get<Active>('active').then((a) => a ?? null);
export const setActive = (a: Active) => set('active', a);
export const clearActive = () => chrome.storage.local.remove('active');

export async function clearAll(): Promise<void> {
  // ユーザーIDと設定は残し、記録だけ消す
  await chrome.storage.local.remove(['sessions', 'checkIns', 'active']);
}
