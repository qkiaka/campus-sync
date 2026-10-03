export interface Bar {
  key: string;
  label: string;
  value: number;
  /** バーの上に出す文字 */
  display: string;
  highlight?: boolean;
}

/** 縦棒グラフ（依存ライブラリなし）。読み上げ用に表も同じ内容を持たせる。 */
export function BarChart({ bars, title }: { bars: Bar[]; title: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <figure aria-label={title} className="m-0">
      <div className="flex h-44 items-end gap-2 sm:gap-4">
        {bars.map((b) => (
          <div key={b.key} className="flex h-full flex-1 flex-col justify-end text-center">
            <span className="mb-1 text-xs text-muted">{b.display}</span>
            <div
              className={`mx-auto w-full max-w-12 rounded-t-md ${b.highlight ? 'bg-wood' : 'bg-wood/45'}`}
              style={{ height: `${Math.max((b.value / max) * 100, b.value > 0 ? 3 : 0)}%` }}
              role="img"
              aria-label={`${b.label} ${b.display}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-line pt-2 sm:gap-4">
        {bars.map((b) => (
          <span key={b.key} className={`flex-1 text-center text-xs ${b.highlight ? 'font-bold text-ink' : 'text-muted'}`}>
            {b.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function HBarList({ rows }: { rows: { label: string; value: number; display: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm">{r.label}</span>
          <div className="h-3 flex-1 rounded-full bg-wood-soft">
            <div className="h-3 rounded-full bg-wood" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="w-20 shrink-0 text-right text-sm text-muted">{r.display}</span>
        </li>
      ))}
    </ul>
  );
}
