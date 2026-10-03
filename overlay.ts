// YouTubeページ上に出す小さな確認画面。
// Shadow DOM の中に1要素だけ追加し、YouTube本体のDOMには触れません。
import { OTHER_PURPOSE, PURPOSES } from '../../../shared/constants';
import type { AnswerKind, CheckInPrompt } from '../../../shared/questions';
import { promptToText } from '../../../shared/questions';

const CSS = `
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

type Child = Node | string | null | undefined | false;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Record<string, string>> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) if (v !== undefined) node.setAttribute(k, v);
  for (const c of children) if (c) node.append(c);
  return node;
}

let host: HTMLElement | null = null;
export const isOpen = () => host !== null;

function mount(card: HTMLElement): void {
  close();
  host = document.createElement('div');
  host.id = 'kizuki-overlay-host';
  const root = host.attachShadow({ mode: 'open' });
  root.append(el('style', {}, CSS), el('div', { class: 'backdrop' }, card));
  // YouTubeのキーボードショートカット（スペース等）が入力中に反応しないようにする
  for (const t of ['keydown', 'keyup', 'keypress']) host.addEventListener(t, (e) => e.stopPropagation());
  document.documentElement.append(host);
  card.querySelector<HTMLElement>('button, input')?.focus();
}

export function close(): void {
  host?.remove();
  host = null;
}

// ---------- 目的の入力 ----------
export function showPurpose(onDone: (category: string | null, detail: string | null) => void): void {
  let selected: string | null = null;

  const finish = (c: string | null, d: string | null) => {
    close();
    onDone(c, d);
  };

  const input = el('input', { class: 'text', type: 'text', placeholder: '例：数学の解説を見る', maxlength: '80', 'aria-label': 'その他の目的' });
  input.style.display = 'none';
  const ok = el('button', { class: 'btn primary', type: 'button' }, '決める');
  ok.disabled = true;

  const buttons = PURPOSES.map((p) => {
    const b = el('button', { class: 'choice', type: 'button', 'aria-pressed': 'false' }, p);
    b.addEventListener('click', () => {
      selected = p;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      input.style.display = p === OTHER_PURPOSE ? 'block' : 'none';
      if (p === OTHER_PURPOSE) input.focus();
      ok.disabled = false;
    });
    return b;
  });

  ok.addEventListener('click', () => {
    if (!selected) return;
    const detail = selected === OTHER_PURPOSE ? input.value.trim() || null : null;
    finish(selected, detail);
  });
  const skip = el('button', { class: 'btn secondary', type: 'button' }, '今回は選ばない');
  skip.addEventListener('click', () => finish(null, null));

  mount(
    el('div', { class: 'card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'k-q' },
      el('h2', {}, 'YouTubeを開きました。'),
      el('p', { class: 'q', id: 'k-q' }, '何のために開きましたか？'),
      el('div', { class: 'choices' }, ...buttons),
      input,
      el('div', { class: 'row' }, ok, skip),
      el('p', { class: 'foot' }, 'この答えは、このブラウザの中にだけ保存されます。'),
    ),
  );
}

// ---------- 気づきの確認 ----------
export interface CheckInResult {
  answer: string | null;
  kind: AnswerKind;
  action: 'continue' | 'close';
  newPurposeDetail?: string;
  question: string;
}

export function showCheckIn(
  prompt: CheckInPrompt,
  purposeLabel: string | null,
  onDone: (r: CheckInResult) => void,
): void {
  let answer: string | null = null;
  let kind: AnswerKind = 'neutral';
  let newPurpose: string | undefined;

  const question = promptToText(prompt);
  const finish = (action: 'continue' | 'close') => {
    close();
    onDone({ answer, kind, action, newPurposeDetail: newPurpose, question });
  };

  const notice = el('p', { class: 'notice' });
  notice.style.display = 'none';
  const updateLink = el('button', { class: 'link', type: 'button' }, 'いま見ている内容に、目的を更新する');
  updateLink.style.display = 'none';
  const updateInput = el('input', { class: 'text', type: 'text', placeholder: '例：ゲーム実況を見る', maxlength: '80', 'aria-label': '新しい目的' });
  updateInput.style.display = 'none';

  const refresh = () => {
    const off = kind === 'off' && !!purposeLabel;
    notice.style.display = off ? 'block' : 'none';
    updateLink.style.display = off ? 'inline-block' : 'none';
    if (off) notice.textContent = '最初の目的とは違う動画を見ているようです。このまま続けますか？';
    if (!off) updateInput.style.display = 'none';
  };

  const buttons = prompt.choices.map((c) => {
    const b = el('button', { class: 'choice', type: 'button', 'aria-pressed': 'false' }, c.label);
    b.addEventListener('click', () => {
      answer = c.label;
      kind = c.kind;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      refresh();
    });
    return b;
  });

  updateLink.addEventListener('click', () => {
    updateInput.style.display = 'block';
    updateInput.focus();
  });
  updateInput.addEventListener('input', () => {
    newPurpose = updateInput.value.trim() || undefined;
  });

  const keep = el('button', { class: 'btn primary', type: 'button' }, 'このまま続ける');
  keep.addEventListener('click', () => finish('continue'));
  const leave = el('button', { class: 'btn secondary', type: 'button' }, 'YouTubeを閉じる');
  leave.addEventListener('click', () => finish('close'));

  mount(
    el('div', { class: 'card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'k-q' },
      el('h2', {}, prompt.title),
      el('p', { class: 'q', id: 'k-q' }, prompt.question),
      prompt.showPurpose && purposeLabel
        ? el('p', { class: 'purpose-note' }, `最初の目的：「${purposeLabel}」`)
        : null,
      el('div', { class: 'choices' }, ...buttons),
      notice,
      updateLink,
      updateInput,
      el('div', { class: 'row' }, keep, leave),
      el('p', { class: 'foot' }, 'どちらを選んでも大丈夫です。答えは、このブラウザの中にだけ保存されます。'),
    ),
  );
}
