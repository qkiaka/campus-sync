import type { CheckIn, Session } from '../../../shared/types';
import { formatDateTime, formatDuration } from '../lib/format';

function purposeText(s: Session, which: 'initial' | 'final'): string | null {
  const c = which === 'initial' ? s.initialPurpose : s.finalPurpose;
  const d = which === 'initial' ? s.initialPurposeDetail : s.finalPurposeDetail;
  return d || c;
}

export function SessionList({ sessions, checkIns }: { sessions: Session[]; checkIns: CheckIn[] }) {
  return (
    <ul className="m-0 list-none divide-y divide-line border-y border-line p-0">
      {sessions.map((s) => {
        const mine = checkIns.filter((c) => c.sessionId === s.id);
        const initial = purposeText(s, 'initial');
        const final = purposeText(s, 'final');
        return (
          <li key={s.id} className="py-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-bold">{formatDateTime(s.startedAt)}</span>
              <span>{formatDuration(s.duration)}</span>
              {s.endedAt === null && <span className="rounded bg-sage-soft px-2 text-sm text-sage">利用中</span>}
            </div>
            <dl className="m-0 mt-1 grid grid-cols-[auto_1fr] gap-x-4 text-sm">
              <dt className="text-muted">最初の目的</dt>
              <dd className="m-0">{initial ?? '選ばなかった'}</dd>
              <dt className="text-muted">途中の変更</dt>
              <dd className="m-0">{s.purposeChanged ? `あり（→ ${final}）` : 'なし'}</dd>
              <dt className="text-muted">目的外の時間</dt>
              <dd className="m-0">{formatDuration(s.offPurposeMs)}</dd>
            </dl>
            {mine.length > 0 && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-wood-dark">気づきへの答え（{mine.length}件）</summary>
                <ul className="m-0 mt-2 list-none space-y-2 p-0">
                  {mine.map((c) => (
                    <li key={c.id}>
                      <span className="text-muted">{Math.round(c.elapsedTime / 60000)}分の時点：</span>
                      {c.answer}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        );
      })}
    </ul>
  );
}
