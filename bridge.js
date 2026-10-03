"use strict";
(() => {
  // src/bridge.ts
  var ALLOWED = /* @__PURE__ */ new Set(["PING", "GET_ALL", "SAVE_SETTINGS", "CLEAR_ALL"]);
  window.addEventListener("message", async (ev) => {
    if (ev.source !== window || ev.origin !== window.location.origin) return;
    const d = ev.data;
    if (!d || d.source !== "kizuki-web" || typeof d.id !== "string") return;
    const reply = (body) => window.postMessage({ source: "kizuki-ext", id: d.id, ...body }, window.location.origin);
    if (!ALLOWED.has(d.type)) return reply({ ok: false, error: "unsupported" });
    try {
      const data = await chrome.runtime.sendMessage({ type: d.type, payload: d.payload });
      reply({ ok: true, data });
    } catch (e) {
      reply({ ok: false, error: String(e) });
    }
  });
})();
