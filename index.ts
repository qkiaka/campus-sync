// YouTubeページで動く content script。
// 5秒ごとに background へ「今表示されています」と伝え、確認が必要なら画面を出す。
import type { ContentMessage, StateView } from '../messages';
import * as overlay from './overlay';

const POLL_MS = 5000;
let timer: number | undefined;

async function send<T>(msg: ContentMessage): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(msg)) as T;
  } catch {
    // 拡張機能が更新・無効化されると古い content script は通信できなくなる
    if (timer !== undefined) window.clearInterval(timer);
    overlay.close();
    return null;
  }
}

async function tick(): Promise<void> {
  const visible = document.visibilityState === 'visible';
  const state = await send<StateView>({ type: 'STATE', visible });
  if (!state || !state.enabled || !visible || overlay.isOpen()) return;

  if (state.needsPurpose) {
    overlay.showPurpose((category, detail) => {
      void send({ type: 'SET_PURPOSE', category, detail });
    });
    return;
  }
  if (state.prompt) {
    const prompt = state.prompt;
    overlay.showCheckIn(prompt, state.purposeLabel, (r) => {
      void send({
        type: 'ANSWER',
        milestoneMin: prompt.milestoneMin,
        question: r.question,
        answer: r.answer,
        kind: r.kind,
        action: r.action,
        newPurposeDetail: r.newPurposeDetail,
      });
    });
  }
}

timer = window.setInterval(() => void tick(), POLL_MS);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void tick();
});
void tick();
