import { useCallback, useEffect, useState } from 'react';
import type { Settings as S, Snapshot } from '../../shared/types';
import { About } from './components/About';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { detectExtension, extRequest } from './lib/bridge';
import { makeDemoSnapshot } from './lib/demo';

type Tab = 'dashboard' | 'settings' | 'about';
type Mode = 'checking' | 'extension' | 'demo';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'ダッシュボード' },
  { id: 'settings', label: '設定' },
  { id: 'about', label: '記録について' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [mode, setMode] = useState<Mode>('checking');
  const [snap, setSnap] = useState<Snapshot | null>(null);

  // 起動時：拡張機能を探す。なければサンプルデータで表示する
  useEffect(() => {
    let alive = true;
    (async () => {
      const found = await detectExtension();
      if (!alive) return;
      if (found) {
        setSnap(await extRequest<Snapshot>('GET_ALL'));
        setMode('extension');
      } else {
        setSnap(makeDemoSnapshot());
        setMode('demo');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      setSnap(await extRequest<Snapshot>('GET_ALL'));
    } catch {
      /* 一時的な失敗は次回に任せる */
    }
  }, []);

  // 拡張につながっているときは、定期的・画面に戻ったときに更新
  useEffect(() => {
    if (mode !== 'extension') return;
    const t = window.setInterval(refresh, 20000);
    const onVis = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [mode, refresh]);

  const saveSettings = async (next: S) => {
    if (mode === 'extension') {
      const saved = await extRequest<S>('SAVE_SETTINGS', next);
      setSnap((s) => (s ? { ...s, settings: saved } : s));
    } else {
      setSnap((s) => (s ? { ...s, settings: next } : s));
    }
  };

  const clearAll = async () => {
    if (mode === 'extension') {
      await extRequest('CLEAR_ALL');
      await refresh();
    } else {
      setSnap((s) => (s ? { ...s, sessions: [], checkIns: [], active: null } : s));
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-0 pt-6">
        <div className="pb-3 text-xl font-bold tracking-wide">きづきタイム</div>
        <nav aria-label="メニュー" className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`-mb-px cursor-pointer border-0 border-b-4 bg-transparent px-3 pb-3 pt-2 text-base ${
                tab === t.id ? 'border-wood font-bold text-ink' : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {mode === 'demo' && (
        <p className="mt-6 rounded-lg bg-ochre-soft px-4 py-3 text-sm">
          いまはサンプルデータを表示しています。Chrome拡張機能を入れると、あなた自身の記録が表示されます。
        </p>
      )}
      {mode === 'extension' && (
        <p className="mb-0 mt-6 text-sm text-sage">● 拡張機能につながっています</p>
      )}

      <main className="mt-8">
        {mode === 'checking' || !snap ? (
          <p className="text-muted">拡張機能を探しています…</p>
        ) : tab === 'dashboard' ? (
          <Dashboard snap={snap} />
        ) : tab === 'settings' ? (
          <Settings key={mode} settings={snap.settings} connected={mode === 'extension'} onSave={saveSettings} onClear={clearAll} />
        ) : (
          <About />
        )}
      </main>
    </div>
  );
}
