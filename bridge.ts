// 拡張機能の「橋渡しスクリプト」と postMessage でやり取りするクライアント。
// 拡張がなければ timeout で失敗するだけなので、Webアプリ単体でも動きます。
let seq = 0;

// 拡張機能の中のページとして開かれているときは、橋渡しなしで直接やり取りできる
interface ChromeLike { runtime?: { id?: string; sendMessage: (m: unknown) => Promise<unknown> } }
const ext = (globalThis as unknown as { chrome?: ChromeLike }).chrome;
const isExtensionPage = !!ext?.runtime?.id;

export function extRequest<T = unknown>(type: string, payload?: unknown, timeoutMs = 1500): Promise<T> {
  if (isExtensionPage) return ext!.runtime!.sendMessage({ type, payload }) as Promise<T>;
  return new Promise((resolve, reject) => {
    const id = `${Date.now()}-${seq++}`;
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error('timeout'));
    }, timeoutMs);

    function onMessage(ev: MessageEvent) {
      if (ev.source !== window) return;
      const d = ev.data;
      if (!d || d.source !== 'kizuki-ext' || d.id !== id) return;
      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      if (d.ok) resolve(d.data as T);
      else reject(new Error(d.error ?? 'error'));
    }
    window.addEventListener('message', onMessage);
    window.postMessage({ source: 'kizuki-web', id, type, payload }, window.location.origin);
  });
}

/** 拡張機能が入っているか（数回試す） */
export async function detectExtension(): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    try {
      await extRequest('PING', undefined, 700);
      return true;
    } catch {
      /* 次の試行へ */
    }
  }
  return false;
}
