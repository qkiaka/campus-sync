"use strict";
(() => {
  // ../shared/constants.ts
  var PURPOSES = [
    "\u898B\u305F\u3044\u52D5\u753B\u304C\u3042\u308B",
    "\u5B66\u7FD2\u30FB\u52C9\u5F37",
    "\u8ABF\u3079\u3082\u306E",
    "\u97F3\u697D\u3092\u8074\u304F",
    "\u6687\u3064\u3076\u3057",
    "\u306A\u3093\u3068\u306A\u304F",
    "\u305D\u306E\u4ED6"
  ];
  var OTHER_PURPOSE = "\u305D\u306E\u4ED6";

  // ../shared/questions.ts
  function promptToText(p) {
    return `${p.title}${p.question}`;
  }

  // src/content/overlay.ts
  var CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.backdrop {
  position: fixed; inset: 0; z-index: 2147483647;
  display: flex; align-items: center; justify-content: center;
  background: rgba(46, 36, 28, 0.32);
  font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", Meiryo, system-ui, sans-serif;
  color: #3b2f26;
}
.card {
  width: min(460px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto;
  background: #fffdf9; border: 1px solid #e6d9c6; border-radius: 16px;
  padding: 24px 24px 20px; box-shadow: 0 10px 36px rgba(46, 36, 28, 0.22);
}
h2 { margin: 0 0 4px; font-size: 14px; font-weight: 500; color: #6f6054; line-height: 1.6; }
p.q { margin: 0 0 16px; font-size: 20px; font-weight: 700; line-height: 1.5; }
.purpose-note {
  margin: 0 0 14px; padding: 10px 12px; border-radius: 10px;
  background: #f3e9db; font-size: 14px; line-height: 1.6;
}
.choices { display: flex; flex-direction: column; gap: 8px; margin: 0 0 16px; padding: 0; border: 0; }
.choice {
  all: unset; box-sizing: border-box; cursor: pointer; width: 100%;
  padding: 11px 14px; border: 1.5px solid #dccdb8; border-radius: 10px;
  font-size: 15px; line-height: 1.5; background: #fff;
}
.choice:hover { border-color: #8f6038; }
.choice[aria-pressed="true"] { border-color: #8f6038; background: #f3e9db; font-weight: 700; }
.choice:focus-visible, .btn:focus-visible, .link:focus-visible, input:focus-visible {
  outline: 3px solid #5b8bb5; outline-offset: 2px;
}
input.text {
  width: 100%; margin: 0 0 16px; padding: 11px 14px; font: inherit; font-size: 15px;
  border: 1.5px solid #dccdb8; border-radius: 10px; background: #fff; color: inherit;
}
.notice { margin: 0 0 14px; font-size: 14px; line-height: 1.7; color: #5a4a3c; }
.link {
  all: unset; cursor: pointer; font-size: 14px; color: #74492a; text-decoration: underline;
  text-underline-offset: 3px; display: inline-block; margin: 0 0 14px;
}
.row { display: flex; gap: 10px; flex-wrap: wrap; }
.btn {
  all: unset; box-sizing: border-box; cursor: pointer; text-align: center;
  padding: 11px 18px; border-radius: 10px; font-size: 15px; font-weight: 700; flex: 1 1 140px;
  border: 1.5px solid #8f6038;
}
.btn.primary { background: #8f6038; color: #fff; }
.btn.primary:hover { background: #74492a; }
.btn.secondary { background: transparent; color: #74492a; }
.btn.secondary:hover { background: #f3e9db; }
.btn[disabled] { opacity: .45; cursor: default; }
.foot { margin: 14px 0 0; font-size: 12px; color: #7a6a5c; line-height: 1.6; }
`;
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) if (v !== void 0) node.setAttribute(k, v);
    for (const c of children) if (c) node.append(c);
    return node;
  }
  var host = null;
  var isOpen = () => host !== null;
  function mount(card) {
    close();
    host = document.createElement("div");
    host.id = "kizuki-overlay-host";
    const root = host.attachShadow({ mode: "open" });
    root.append(el("style", {}, CSS), el("div", { class: "backdrop" }, card));
    for (const t of ["keydown", "keyup", "keypress"]) host.addEventListener(t, (e) => e.stopPropagation());
    document.documentElement.append(host);
    card.querySelector("button, input")?.focus();
  }
  function close() {
    host?.remove();
    host = null;
  }
  function showPurpose(onDone) {
    let selected = null;
    const finish = (c, d) => {
      close();
      onDone(c, d);
    };
    const input = el("input", { class: "text", type: "text", placeholder: "\u4F8B\uFF1A\u6570\u5B66\u306E\u89E3\u8AAC\u3092\u898B\u308B", maxlength: "80", "aria-label": "\u305D\u306E\u4ED6\u306E\u76EE\u7684" });
    input.style.display = "none";
    const ok = el("button", { class: "btn primary", type: "button" }, "\u6C7A\u3081\u308B");
    ok.disabled = true;
    const buttons = PURPOSES.map((p) => {
      const b = el("button", { class: "choice", type: "button", "aria-pressed": "false" }, p);
      b.addEventListener("click", () => {
        selected = p;
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        input.style.display = p === OTHER_PURPOSE ? "block" : "none";
        if (p === OTHER_PURPOSE) input.focus();
        ok.disabled = false;
      });
      return b;
    });
    ok.addEventListener("click", () => {
      if (!selected) return;
      const detail = selected === OTHER_PURPOSE ? input.value.trim() || null : null;
      finish(selected, detail);
    });
    const skip = el("button", { class: "btn secondary", type: "button" }, "\u4ECA\u56DE\u306F\u9078\u3070\u306A\u3044");
    skip.addEventListener("click", () => finish(null, null));
    mount(
      el(
        "div",
        { class: "card", role: "dialog", "aria-modal": "true", "aria-labelledby": "k-q" },
        el("h2", {}, "YouTube\u3092\u958B\u304D\u307E\u3057\u305F\u3002"),
        el("p", { class: "q", id: "k-q" }, "\u4F55\u306E\u305F\u3081\u306B\u958B\u304D\u307E\u3057\u305F\u304B\uFF1F"),
        el("div", { class: "choices" }, ...buttons),
        input,
        el("div", { class: "row" }, ok, skip),
        el("p", { class: "foot" }, "\u3053\u306E\u7B54\u3048\u306F\u3001\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u306E\u4E2D\u306B\u3060\u3051\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002")
      )
    );
  }
  function showCheckIn(prompt, purposeLabel, onDone) {
    let answer = null;
    let kind = "neutral";
    let newPurpose;
    const question = promptToText(prompt);
    const finish = (action) => {
      close();
      onDone({ answer, kind, action, newPurposeDetail: newPurpose, question });
    };
    const notice = el("p", { class: "notice" });
    notice.style.display = "none";
    const updateLink = el("button", { class: "link", type: "button" }, "\u3044\u307E\u898B\u3066\u3044\u308B\u5185\u5BB9\u306B\u3001\u76EE\u7684\u3092\u66F4\u65B0\u3059\u308B");
    updateLink.style.display = "none";
    const updateInput = el("input", { class: "text", type: "text", placeholder: "\u4F8B\uFF1A\u30B2\u30FC\u30E0\u5B9F\u6CC1\u3092\u898B\u308B", maxlength: "80", "aria-label": "\u65B0\u3057\u3044\u76EE\u7684" });
    updateInput.style.display = "none";
    const refresh = () => {
      const off = kind === "off" && !!purposeLabel;
      notice.style.display = off ? "block" : "none";
      updateLink.style.display = off ? "inline-block" : "none";
      if (off) notice.textContent = "\u6700\u521D\u306E\u76EE\u7684\u3068\u306F\u9055\u3046\u52D5\u753B\u3092\u898B\u3066\u3044\u308B\u3088\u3046\u3067\u3059\u3002\u3053\u306E\u307E\u307E\u7D9A\u3051\u307E\u3059\u304B\uFF1F";
      if (!off) updateInput.style.display = "none";
    };
    const buttons = prompt.choices.map((c) => {
      const b = el("button", { class: "choice", type: "button", "aria-pressed": "false" }, c.label);
      b.addEventListener("click", () => {
        answer = c.label;
        kind = c.kind;
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        refresh();
      });
      return b;
    });
    updateLink.addEventListener("click", () => {
      updateInput.style.display = "block";
      updateInput.focus();
    });
    updateInput.addEventListener("input", () => {
      newPurpose = updateInput.value.trim() || void 0;
    });
    const keep = el("button", { class: "btn primary", type: "button" }, "\u3053\u306E\u307E\u307E\u7D9A\u3051\u308B");
    keep.addEventListener("click", () => finish("continue"));
    const leave = el("button", { class: "btn secondary", type: "button" }, "YouTube\u3092\u9589\u3058\u308B");
    leave.addEventListener("click", () => finish("close"));
    mount(
      el(
        "div",
        { class: "card", role: "dialog", "aria-modal": "true", "aria-labelledby": "k-q" },
        el("h2", {}, prompt.title),
        el("p", { class: "q", id: "k-q" }, prompt.question),
        prompt.showPurpose && purposeLabel ? el("p", { class: "purpose-note" }, `\u6700\u521D\u306E\u76EE\u7684\uFF1A\u300C${purposeLabel}\u300D`) : null,
        el("div", { class: "choices" }, ...buttons),
        notice,
        updateLink,
        updateInput,
        el("div", { class: "row" }, keep, leave),
        el("p", { class: "foot" }, "\u3069\u3061\u3089\u3092\u9078\u3093\u3067\u3082\u5927\u4E08\u592B\u3067\u3059\u3002\u7B54\u3048\u306F\u3001\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u306E\u4E2D\u306B\u3060\u3051\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002")
      )
    );
  }

  // src/content/index.ts
  var POLL_MS = 5e3;
  var timer;
  async function send(msg) {
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch {
      if (timer !== void 0) window.clearInterval(timer);
      close();
      return null;
    }
  }
  async function tick() {
    const visible = document.visibilityState === "visible";
    const state = await send({ type: "STATE", visible });
    if (!state || !state.enabled || !visible || isOpen()) return;
    if (state.needsPurpose) {
      showPurpose((category, detail) => {
        void send({ type: "SET_PURPOSE", category, detail });
      });
      return;
    }
    if (state.prompt) {
      const prompt = state.prompt;
      showCheckIn(prompt, state.purposeLabel, (r) => {
        void send({
          type: "ANSWER",
          milestoneMin: prompt.milestoneMin,
          question: r.question,
          answer: r.answer,
          kind: r.kind,
          action: r.action,
          newPurposeDetail: r.newPurposeDetail
        });
      });
    }
  }
  timer = window.setInterval(() => void tick(), POLL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void tick();
  });
  void tick();
})();
