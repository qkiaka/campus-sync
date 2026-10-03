"use strict";
(() => {
  // ../shared/questions.ts
  function formatMinutes(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}\u5206`;
    return m === 0 ? `${h}\u6642\u9593` : `${h}\u6642\u9593${m}\u5206`;
  }
  function buildPrompt(milestoneMin) {
    const t = formatMinutes(milestoneMin);
    if (milestoneMin < 15) {
      return {
        milestoneMin,
        title: `YouTube\u3092\u4F7F\u3044\u59CB\u3081\u3066${t}\u3067\u3059\u3002`,
        question: "\u4ECA\u3001\u4F55\u3092\u3057\u3066\u3044\u307E\u3059\u304B\uFF1F",
        showPurpose: false,
        choices: [
          { label: "\u6700\u521D\u306E\u76EE\u7684\u306E\u305F\u3081\u306B\u4F7F\u3063\u3066\u3044\u308B", kind: "on" },
          { label: "\u5225\u306E\u52D5\u753B\u3092\u898B\u3066\u3044\u308B", kind: "off" },
          { label: "\u306A\u3093\u3068\u306A\u304F\u898B\u3066\u3044\u308B", kind: "off" },
          { label: "\u308F\u304B\u3089\u306A\u3044", kind: "neutral" }
        ]
      };
    }
    if (milestoneMin < 30) {
      return {
        milestoneMin,
        title: `YouTube\u3092\u4F7F\u3063\u3066${t}\u305F\u3061\u307E\u3057\u305F\u3002`,
        question: "\u6700\u521D\u306BYouTube\u3092\u958B\u3044\u305F\u76EE\u7684\u3092\u899A\u3048\u3066\u3044\u307E\u3059\u304B\uFF1F",
        showPurpose: true,
        choices: [
          { label: "\u899A\u3048\u3066\u3044\u3066\u3001\u4ECA\u3082\u305D\u306E\u76EE\u7684\u3067\u4F7F\u3063\u3066\u3044\u308B", kind: "on" },
          { label: "\u899A\u3048\u3066\u3044\u308B\u3051\u308C\u3069\u3001\u5225\u306E\u3053\u3068\u3092\u3057\u3066\u3044\u308B", kind: "off" },
          { label: "\u5FD8\u308C\u3066\u3044\u305F", kind: "neutral" }
        ]
      };
    }
    if (milestoneMin < 45) {
      return {
        milestoneMin,
        title: `YouTube\u3092${t}\u4F7F\u3063\u3066\u3044\u307E\u3059\u3002`,
        question: "\u4ECA\u3082\u7D9A\u3051\u305F\u3044\u3067\u3059\u304B\uFF1F",
        showPurpose: true,
        choices: [
          { label: "\u7D9A\u3051\u305F\u3044", kind: "neutral" },
          { label: "\u5C11\u3057\u8FF7\u3063\u3066\u3044\u308B", kind: "neutral" },
          { label: "\u305D\u308D\u305D\u308D\u533A\u5207\u308A\u3092\u3064\u3051\u305F\u3044", kind: "neutral" }
        ]
      };
    }
    if (milestoneMin < 60) {
      return {
        milestoneMin,
        title: `${t}\u305F\u3061\u307E\u3057\u305F\u3002`,
        question: "\u4ECA\u898B\u3066\u3044\u308B\u3082\u306E\u306F\u3001\u81EA\u5206\u3067\u9078\u3093\u3060\u3082\u306E\u3067\u3059\u304B\uFF1F",
        showPurpose: true,
        choices: [
          { label: "\u81EA\u5206\u3067\u9078\u3093\u3067\u3044\u308B", kind: "on" },
          { label: "\u6D41\u308C\u3067\u898B\u3066\u3044\u308B", kind: "off" },
          { label: "\u3088\u304F\u308F\u304B\u3089\u306A\u3044", kind: "neutral" }
        ]
      };
    }
    return {
      milestoneMin,
      title: `YouTube\u3092${t}\u4F7F\u3063\u3066\u3044\u307E\u3059\u3002`,
      question: "\u3053\u3053\u307E\u3067\u306E\u6642\u9593\u306F\u3001\u601D\u3063\u3066\u3044\u305F\u611F\u899A\u3068\u5408\u3063\u3066\u3044\u307E\u3059\u304B\uFF1F",
      showPurpose: true,
      choices: [
        { label: "\u3060\u3044\u305F\u3044\u601D\u3063\u3066\u3044\u305F\u901A\u308A", kind: "neutral" },
        { label: "\u601D\u3063\u3066\u3044\u305F\u3088\u308A\u9577\u304B\u3063\u305F", kind: "neutral" },
        { label: "\u308F\u304B\u3089\u306A\u3044", kind: "neutral" }
      ]
    };
  }

  // ../shared/constants.ts
  var DEFAULT_SETTINGS = {
    enabled: true,
    askPurpose: true,
    intervalsMin: [5, 15, 30, 45, 60]
  };
  var OTHER_PURPOSE = "\u305D\u306E\u4ED6";
  var MAX_INTERVALS = 10;
  var MAX_INTERVAL_MIN = 600;
  function normalizeIntervals(values) {
    if (!Array.isArray(values)) return [...DEFAULT_SETTINGS.intervalsMin];
    const nums = values.map((v) => Math.round(Number(v))).filter((n) => Number.isFinite(n) && n >= 1 && n <= MAX_INTERVAL_MIN);
    return [...new Set(nums)].sort((a, b) => a - b).slice(0, MAX_INTERVALS);
  }
  function normalizeSettings(input) {
    return {
      enabled: input?.enabled ?? DEFAULT_SETTINGS.enabled,
      askPurpose: input?.askPurpose ?? DEFAULT_SETTINGS.askPurpose,
      intervalsMin: input?.intervalsMin ? normalizeIntervals(input.intervalsMin) : [...DEFAULT_SETTINGS.intervalsMin]
    };
  }

  // src/session.ts
  var BEAT_CAP_MS = 7e3;
  var IDLE_END_MS = 10 * 60 * 1e3;
  var MIN_SESSION_MS = 10 * 1e3;
  function newActive(userId, now) {
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
        offPurposeMs: 0
      },
      firedMilestones: [],
      purposePrompted: false,
      mode: "on",
      modeSinceMs: 0,
      lastVisibleAt: now
    };
  }
  function applyBeat(a, now, visible) {
    if (!visible) return;
    const dt = Math.max(0, now - a.lastVisibleAt);
    if (dt <= BEAT_CAP_MS) a.session.duration += dt;
    a.lastVisibleAt = now;
  }
  function isStale(a, now) {
    return now - a.lastVisibleAt > IDLE_END_MS;
  }
  function dueMilestone(a, settings) {
    const elapsedMin = a.session.duration / 6e4;
    const due = settings.intervalsMin.filter((m) => elapsedMin >= m && !a.firedMilestones.includes(m));
    return due.length ? Math.max(...due) : null;
  }
  function setMode(a, mode) {
    if (a.mode === mode) return;
    if (a.mode === "off") a.session.offPurposeMs += a.session.duration - a.modeSinceMs;
    a.mode = mode;
    a.modeSinceMs = a.session.duration;
  }
  function liveSession(a) {
    const open = a.mode === "off" ? a.session.duration - a.modeSinceMs : 0;
    return { ...a.session, offPurposeMs: a.session.offPurposeMs + open };
  }
  function finalize(a, endedAt) {
    setMode(a, "on");
    return { ...a.session, endedAt };
  }

  // src/storage.ts
  var get = async (key) => {
    const r = await chrome.storage.local.get(key);
    return r[key];
  };
  var set = (key, value) => chrome.storage.local.set({ [key]: value });
  async function getUser() {
    let u = await get("user");
    if (!u) {
      u = { id: crypto.randomUUID(), createdAt: Date.now() };
      await set("user", u);
    }
    return u;
  }
  async function getSettings() {
    return normalizeSettings(await get("settings"));
  }
  var saveSettings = (s) => set("settings", s);
  var getSessions = async () => await get("sessions") ?? [];
  var getCheckIns = async () => await get("checkIns") ?? [];
  async function addSession(s) {
    await set("sessions", [...await getSessions(), s]);
  }
  async function addCheckIn(c) {
    await set("checkIns", [...await getCheckIns(), c]);
  }
  var getActive = () => get("active").then((a) => a ?? null);
  var setActive = (a) => set("active", a);
  var clearActive = () => chrome.storage.local.remove("active");
  async function clearAll() {
    await chrome.storage.local.remove(["sessions", "checkIns", "active"]);
  }

  // src/background.ts
  var YT_PATTERNS = ["*://*.youtube.com/*"];
  var ALARM = "sync";
  var chain = Promise.resolve();
  function locked(fn) {
    const run = chain.then(fn, fn);
    chain = run.catch(() => void 0);
    return run;
  }
  async function endSession(a, endedAt) {
    const s = finalize(a, endedAt);
    if (s.duration >= MIN_SESSION_MS) await addSession(s);
    await clearActive();
  }
  async function startSession() {
    const user = await getUser();
    const a = newActive(user.id, Date.now());
    await setActive(a);
    return a;
  }
  async function syncTabs() {
    const now = Date.now();
    const settings = await getSettings();
    const tabs = await chrome.tabs.query({ url: YT_PATTERNS });
    let a = await getActive();
    if (a && (tabs.length === 0 || !settings.enabled || isStale(a, now))) {
      await endSession(a, isStale(a, now) ? a.lastVisibleAt : now);
      a = null;
    }
    if (!a && tabs.length > 0 && settings.enabled) await startSession();
  }
  var sync = () => locked(syncTabs);
  async function onContent(msg, sender) {
    const settings = await getSettings();
    const now = Date.now();
    let a = await getActive();
    if (a && isStale(a, now)) {
      await endSession(a, a.lastVisibleAt);
      a = null;
    }
    if (msg.type === "STATE") {
      const view = { enabled: settings.enabled, needsPurpose: false, prompt: null, purposeLabel: null };
      if (!settings.enabled) return view;
      if (!a) a = await startSession();
      applyBeat(a, now, msg.visible);
      await setActive(a);
      const due = dueMilestone(a, settings);
      view.needsPurpose = settings.askPurpose && !a.purposePrompted;
      view.prompt = due !== null ? buildPrompt(due) : null;
      view.purposeLabel = a.session.initialPurposeDetail || a.session.initialPurpose;
      return view;
    }
    if (!a) return { ok: false };
    if (msg.type === "SET_PURPOSE") {
      a.purposePrompted = true;
      if (msg.category) {
        const s = a.session;
        s.initialPurpose = s.finalPurpose = msg.category;
        s.initialPurposeDetail = s.finalPurposeDetail = msg.detail || null;
      }
      await setActive(a);
      return { ok: true };
    }
    if (msg.type === "ANSWER") {
      const s = a.session;
      const checkIn = {
        id: crypto.randomUUID(),
        sessionId: s.id,
        elapsedTime: s.duration,
        question: msg.question,
        answer: msg.answer ?? "\uFF08\u7B54\u3048\u305A\u306B\u7D9A\u3051\u305F\uFF09",
        createdAt: now
      };
      await addCheckIn(checkIn);
      s.interruptionCount += 1;
      for (const m of settings.intervalsMin) {
        if (m <= msg.milestoneMin && !a.firedMilestones.includes(m)) a.firedMilestones.push(m);
      }
      if (msg.kind === "off") setMode(a, "off");
      if (msg.kind === "on") setMode(a, "on");
      if (msg.newPurposeDetail) {
        s.finalPurpose = OTHER_PURPOSE;
        s.finalPurposeDetail = msg.newPurposeDetail;
        s.purposeChanged = true;
        setMode(a, "on");
      }
      await setActive(a);
      if (msg.action === "close" && sender.tab?.id !== void 0) {
        await chrome.tabs.remove(sender.tab.id);
      }
      return { ok: true };
    }
    return void 0;
  }
  async function snapshot() {
    const [user, settings, sessions, checkIns, a] = await Promise.all([
      getUser(),
      getSettings(),
      getSessions(),
      getCheckIns(),
      getActive()
    ]);
    return { user, settings, sessions, checkIns, active: a ? liveSession(a) : null };
  }
  async function onWebOrPopup(msg) {
    switch (msg.type) {
      case "PING":
        return { ok: true, version: chrome.runtime.getManifest().version };
      case "GET_ALL":
        return snapshot();
      case "SAVE_SETTINGS": {
        const next = normalizeSettings(msg.payload);
        await saveSettings(next);
        await syncTabs();
        return next;
      }
      case "SET_ENABLED": {
        const cur = await getSettings();
        await saveSettings({ ...cur, enabled: msg.enabled });
        await syncTabs();
        return { ok: true };
      }
      case "CLEAR_ALL":
        await clearAll();
        await syncTabs();
        return { ok: true };
      case "GET_POPUP": {
        const [settings, a] = await Promise.all([getSettings(), getActive()]);
        const view = { settings, active: a ? liveSession(a) : null };
        return view;
      }
      default:
        return void 0;
    }
  }
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const isContent = msg.type === "STATE" || msg.type === "SET_PURPOSE" || msg.type === "ANSWER";
    locked(() => isContent ? onContent(msg, sender) : onWebOrPopup(msg)).then(sendResponse).catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  });
  chrome.tabs.onUpdated.addListener((_id, info) => {
    if (info.url || info.status === "complete") void sync();
  });
  chrome.tabs.onRemoved.addListener(() => void sync());
  chrome.tabs.onReplaced.addListener(() => void sync());
  chrome.alarms.get(ALARM, (alarm) => {
    if (!alarm) chrome.alarms.create(ALARM, { periodInMinutes: 1 });
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM) void sync();
  });
  chrome.runtime.onStartup.addListener(() => void sync());
  chrome.runtime.onInstalled.addListener(() => void sync());
})();
