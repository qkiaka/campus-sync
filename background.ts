// Service Worker。状態は必ず chrome.storage に置き、メモリには持ちません
// （MV3 のサービスワーカーは数十秒で停止するため）。
import { buildPrompt } from '../../shared/questions';
import { OTHER_PURPOSE, normalizeSettings } from '../../shared/constants';
import type { CheckIn, Settings } from '../../shared/types';
import type { AllView, ContentMessage, Message, PopupView, StateView } from './messages';
import {
  MIN_SESSION_MS,
  applyBeat,
  dueMilestone,
  finalize,
  isStale,
  liveSession,
  newActive,
  setMode,
  type Active,
} from './session';
import * as store from './storage';

const YT_PATTERNS = ['*://*.youtube.com/*'];
const ALARM = 'sync';

// ---- 同時に届くメッセージで読み書きが競合しないよう、1つずつ処理する ----
let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

// ---- セッションの開始・終了 ----
async function endSession(a: Active, endedAt: number): Promise<void> {
  const s = finalize(a, endedAt);
  if (s.duration >= MIN_SESSION_MS) await store.addSession(s);
  await store.clearActive();
}

async function startSession(): Promise<Active> {
  const user = await store.getUser();
  const a = newActive(user.id, Date.now());
  await store.setActive(a);
  return a;
}

/** 開いているYouTubeタブの有無に合わせて、セッションを開始・終了する */
async function syncTabs(): Promise<void> {
  const now = Date.now();
  const settings = await store.getSettings();
  const tabs = await chrome.tabs.query({ url: YT_PATTERNS });
  let a = await store.getActive();

  if (a && (tabs.length === 0 || !settings.enabled || isStale(a, now))) {
    await endSession(a, isStale(a, now) ? a.lastVisibleAt : now);
    a = null;
  }
  if (!a && tabs.length > 0 && settings.enabled) await startSession();
}

const sync = () => locked(syncTabs);

// ---- content script からのメッセージ ----
async function onContent(msg: ContentMessage, sender: chrome.runtime.MessageSender): Promise<unknown> {
  const settings = await store.getSettings();
  const now = Date.now();
  let a = await store.getActive();

  if (a && isStale(a, now)) {
    await endSession(a, a.lastVisibleAt);
    a = null;
  }

  if (msg.type === 'STATE') {
    const view: StateView = { enabled: settings.enabled, needsPurpose: false, prompt: null, purposeLabel: null };
    if (!settings.enabled) return view;
    if (!a) a = await startSession(); // YouTubeページが動いている以上、セッションは存在するはず
    applyBeat(a, now, msg.visible);
    await store.setActive(a);

    const due = dueMilestone(a, settings);
    view.needsPurpose = settings.askPurpose && !a.purposePrompted;
    view.prompt = due !== null ? buildPrompt(due) : null;
    view.purposeLabel = a.session.initialPurposeDetail || a.session.initialPurpose;
    return view;
  }

  if (!a) return { ok: false };

  if (msg.type === 'SET_PURPOSE') {
    a.purposePrompted = true;
    if (msg.category) {
      const s = a.session;
      s.initialPurpose = s.finalPurpose = msg.category;
      s.initialPurposeDetail = s.finalPurposeDetail = msg.detail || null;
    }
    await store.setActive(a);
    return { ok: true };
  }

  if (msg.type === 'ANSWER') {
    const s = a.session;
    const checkIn: CheckIn = {
      id: crypto.randomUUID(),
      sessionId: s.id,
      elapsedTime: s.duration,
      question: msg.question,
      answer: msg.answer ?? '（答えずに続けた）',
      createdAt: now,
    };
    await store.addCheckIn(checkIn);
    s.interruptionCount += 1;

    // この間隔以前の確認は済んだことにする（たまっていても1回だけ出す）
    for (const m of settings.intervalsMin) {
      if (m <= msg.milestoneMin && !a.firedMilestones.includes(m)) a.firedMilestones.push(m);
    }

    if (msg.kind === 'off') setMode(a, 'off');
    if (msg.kind === 'on') setMode(a, 'on');

    if (msg.newPurposeDetail) {
      s.finalPurpose = OTHER_PURPOSE;
      s.finalPurposeDetail = msg.newPurposeDetail;
      s.purposeChanged = true;
      setMode(a, 'on'); // 目的を今の内容に合わせたので、目的外ではなくなる
    }
    await store.setActive(a);

    if (msg.action === 'close' && sender.tab?.id !== undefined) {
      await chrome.tabs.remove(sender.tab.id);
      // タブが閉じられると onRemoved → sync で必要ならセッションが終了する
    }
    return { ok: true };
  }
  return undefined;
}

// ---- Webアプリ / popup からのメッセージ ----
async function snapshot(): Promise<AllView> {
  const [user, settings, sessions, checkIns, a] = await Promise.all([
    store.getUser(),
    store.getSettings(),
    store.getSessions(),
    store.getCheckIns(),
    store.getActive(),
  ]);
  return { user, settings, sessions, checkIns, active: a ? liveSession(a) : null };
}

async function onWebOrPopup(msg: Message): Promise<unknown> {
  switch (msg.type) {
    case 'PING':
      return { ok: true, version: chrome.runtime.getManifest().version };
    case 'GET_ALL':
      return snapshot();
    case 'SAVE_SETTINGS': {
      const next: Settings = normalizeSettings(msg.payload);
      await store.saveSettings(next);
      await syncTabs(); // 無効にした場合は進行中のセッションを終える
      return next;
    }
    case 'SET_ENABLED': {
      const cur = await store.getSettings();
      await store.saveSettings({ ...cur, enabled: msg.enabled });
      await syncTabs();
      return { ok: true };
    }
    case 'CLEAR_ALL':
      await store.clearAll();
      await syncTabs();
      return { ok: true };
    case 'GET_POPUP': {
      const [settings, a] = await Promise.all([store.getSettings(), store.getActive()]);
      const view: PopupView = { settings, active: a ? liveSession(a) : null };
      return view;
    }
    default:
      return undefined;
  }
}

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  const isContent = msg.type === 'STATE' || msg.type === 'SET_PURPOSE' || msg.type === 'ANSWER';
  locked(() => (isContent ? onContent(msg as ContentMessage, sender) : onWebOrPopup(msg)))
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, error: String(e) }));
  return true; // 非同期で応答する
});

// ---- YouTubeタブの出入りを検知 ----
chrome.tabs.onUpdated.addListener((_id, info) => {
  if (info.url || info.status === 'complete') void sync();
});
chrome.tabs.onRemoved.addListener(() => void sync());
chrome.tabs.onReplaced.addListener(() => void sync());

// ---- 保険：1分ごとに状態を確認（ブラウザ再起動・タブ消失の取りこぼし対策）----
chrome.alarms.get(ALARM, (alarm) => {
  if (!alarm) chrome.alarms.create(ALARM, { periodInMinutes: 1 });
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) void sync();
});
chrome.runtime.onStartup.addListener(() => void sync());
chrome.runtime.onInstalled.addListener(() => void sync());

