import { useState } from 'react';
import { DEFAULT_SETTINGS, MAX_INTERVALS, MAX_INTERVAL_MIN, normalizeIntervals } from '../../../shared/constants';
import { formatMinutes } from '../../../shared/questions';
import type { Settings as S } from '../../../shared/types';

interface Props {
  settings: S;
  connected: boolean;
  onSave: (s: S) => Promise<void>;
  onClear: () => Promise<void>;
}

export function Settings({ settings, connected, onSave, onClear }: Props) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [askPurpose, setAskPurpose] = useState(settings.askPurpose);
  const [intervals, setIntervals] = useState(settings.intervalsMin);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState('');

  const add = () => {
    const n = Math.round(Number(draft));
    if (!Number.isFinite(n) || n < 1 || n > MAX_INTERVAL_MIN) {
      setMsg(`1〜${MAX_INTERVAL_MIN}の数字を入れてください。`);
      return;
    }
    if (intervals.length >= MAX_INTERVALS) {
      setMsg(`間隔は${MAX_INTERVALS}個までです。`);
      return;
    }
    setIntervals(normalizeIntervals([...intervals, n]));
    setDraft('');
    setMsg('');
  };

  const save = async () => {
    try {
      await onSave({ enabled, askPurpose, intervalsMin: normalizeIntervals(intervals) });
      setMsg('保存しました。');
    } catch {
      setMsg('保存できませんでした。拡張機能が有効か確認してください。');
    }
  };

  const clear = async () => {
    if (!window.confirm('これまでの記録をすべて削除します。元に戻せません。よろしいですか？')) return;
    await onClear();
    setMsg('記録を削除しました。');
  };

  return (
    <div className="max-w-xl">
      <h1 className="m-0 text-2xl font-bold">設定</h1>
      {!connected && (
        <p className="mt-3 rounded-lg bg-ochre-soft px-4 py-3 text-sm">
          拡張機能につながっていないため、ここでの変更はこの画面の表示にだけ反映されます。
        </p>
      )}

      <div className="mt-6 space-y-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1.5 h-5 w-5 accent-wood" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>
            気づきの確認を使う
            <span className="block text-sm text-muted">オフにすると、記録も確認画面もお休みします。</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1.5 h-5 w-5 accent-wood" checked={askPurpose} onChange={(e) => setAskPurpose(e.target.checked)} />
          <span>
            YouTubeを開いたときに、目的を聞く
            <span className="block text-sm text-muted">選びたくないときは「今回は選ばない」を押せます。</span>
          </span>
        </label>
      </div>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="m-0 text-lg font-bold">確認を出すタイミング</h2>
        <p className="m-0 mt-1 text-sm text-muted">YouTubeを使い始めてから、この時間がたったときに確認します。</p>
        <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
          {intervals.map((m) => (
            <li key={m} className="flex items-center gap-1 rounded-full bg-wood-soft py-1 pl-4 pr-1">
              {formatMinutes(m)}
              <button
                type="button"
                className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent text-lg leading-none text-wood-dark hover:bg-wood/15"
                aria-label={`${formatMinutes(m)}を削除`}
                onClick={() => setIntervals(intervals.filter((x) => x !== m))}
              >
                ×
              </button>
            </li>
          ))}
          {intervals.length === 0 && <li className="text-sm text-muted">確認は出ません（目的の入力と記録だけ行います）。</li>}
        </ul>
        <div className="mt-4 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            追加（分）
            <input
              type="number" min={1} max={MAX_INTERVAL_MIN} inputMode="numeric" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              className="w-24 rounded-lg border border-line bg-white px-3 py-2"
            />
          </label>
          <button type="button" onClick={add} className="cursor-pointer rounded-lg border border-wood bg-transparent px-4 py-2 font-bold text-wood-dark hover:bg-wood-soft">
            追加
          </button>
          <button type="button" onClick={() => setIntervals([...DEFAULT_SETTINGS.intervalsMin])} className="cursor-pointer border-0 bg-transparent px-2 py-2 text-sm text-wood-dark underline underline-offset-4">
            初期値に戻す
          </button>
        </div>
      </section>

      <div className="mt-8 flex items-center gap-4">
        <button type="button" onClick={save} className="cursor-pointer rounded-lg border-0 bg-wood px-6 py-3 font-bold text-white hover:bg-wood-dark">
          保存する
        </button>
        <span role="status" className="text-sm text-muted">{msg}</span>
      </div>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="m-0 text-lg font-bold">記録の削除</h2>
        <p className="m-0 mt-1 text-sm text-muted">これまでのセッションと気づきへの答えを、すべて消します。</p>
        <button type="button" onClick={clear} className="mt-3 cursor-pointer rounded-lg border border-wood bg-transparent px-4 py-2 font-bold text-wood-dark hover:bg-wood-soft">
          記録をすべて削除する
        </button>
      </section>
    </div>
  );
}
