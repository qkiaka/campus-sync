import { formatMinutes } from '../../../shared/questions';
import type { PopupView } from '../messages';

const app = document.getElementById('app')!;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

async function render() {
  const view = (await chrome.runtime.sendMessage({ type: 'GET_POPUP' })) as PopupView;
  app.replaceChildren();
  app.append(el('h1', undefined, 'きづきタイム'));

  const a = view.active;
  const mins = a ? Math.floor(a.duration / 60000) : 0;
  app.append(el('p', 'status', a ? `YouTubeを使っています（${mins === 0 ? '1分未満' : formatMinutes(mins)}）` : 'いまは記録していません'));
  const purpose = a ? a.finalPurposeDetail || a.finalPurpose : null;
  app.append(el('p', 'sub', purpose ? `目的：${purpose}` : view.settings.enabled ? 'YouTubeを開くと、記録が始まります。' : '一時停止中です。'));

  const label = el('label', 'toggle');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = view.settings.enabled;
  cb.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: cb.checked });
    void render();
  });
  label.append(cb, el('span', undefined, '気づきの確認を使う'));
  app.append(label);

  const open = el('a', 'btn', 'ダッシュボードを開く');
  open.href = chrome.runtime.getURL('app/index.html');
  open.target = '_blank';
  open.rel = 'noreferrer';
  app.append(open);

  app.append(el('p', 'note', '記録するのは、利用時間・入力した目的・気づきへの答えだけです。動画のタイトルやURLは保存しません。'));
}

void render();
