"use strict";
(() => {
  // ../shared/questions.ts
  function formatMinutes(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}\u5206`;
    return m === 0 ? `${h}\u6642\u9593` : `${h}\u6642\u9593${m}\u5206`;
  }

  // src/popup/popup.ts
  var app = document.getElementById("app");
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  async function render() {
    const view = await chrome.runtime.sendMessage({ type: "GET_POPUP" });
    app.replaceChildren();
    app.append(el("h1", void 0, "\u304D\u3065\u304D\u30BF\u30A4\u30E0"));
    const a = view.active;
    const mins = a ? Math.floor(a.duration / 6e4) : 0;
    app.append(el("p", "status", a ? `YouTube\u3092\u4F7F\u3063\u3066\u3044\u307E\u3059\uFF08${mins === 0 ? "1\u5206\u672A\u6E80" : formatMinutes(mins)}\uFF09` : "\u3044\u307E\u306F\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093"));
    const purpose = a ? a.finalPurposeDetail || a.finalPurpose : null;
    app.append(el("p", "sub", purpose ? `\u76EE\u7684\uFF1A${purpose}` : view.settings.enabled ? "YouTube\u3092\u958B\u304F\u3068\u3001\u8A18\u9332\u304C\u59CB\u307E\u308A\u307E\u3059\u3002" : "\u4E00\u6642\u505C\u6B62\u4E2D\u3067\u3059\u3002"));
    const label = el("label", "toggle");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = view.settings.enabled;
    cb.addEventListener("change", async () => {
      await chrome.runtime.sendMessage({ type: "SET_ENABLED", enabled: cb.checked });
      void render();
    });
    label.append(cb, el("span", void 0, "\u6C17\u3065\u304D\u306E\u78BA\u8A8D\u3092\u4F7F\u3046"));
    app.append(label);
    const open = el("a", "btn", "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u3092\u958B\u304F");
    open.href = chrome.runtime.getURL("app/index.html");
    open.target = "_blank";
    open.rel = "noreferrer";
    app.append(open);
    app.append(el("p", "note", "\u8A18\u9332\u3059\u308B\u306E\u306F\u3001\u5229\u7528\u6642\u9593\u30FB\u5165\u529B\u3057\u305F\u76EE\u7684\u30FB\u6C17\u3065\u304D\u3078\u306E\u7B54\u3048\u3060\u3051\u3067\u3059\u3002\u52D5\u753B\u306E\u30BF\u30A4\u30C8\u30EB\u3084URL\u306F\u4FDD\u5B58\u3057\u307E\u305B\u3093\u3002"));
  }
  void render();
})();
