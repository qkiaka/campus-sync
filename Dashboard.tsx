import type { Snapshot } from '../../../shared/types';
import { formatDuration } from '../lib/format';
import { allSessions, dailySeries, purposeSeries, todayStats } from '../lib/stats';
import { BarChart, HBarList } from './BarChart';
import { SessionList } from './SessionList';

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="m-0 text-lg font-bold">{title}</h2>
      {note && <p className="m-0 mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-4 first:pl-0 sm:px-6">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold sm:text-4xl">{value}</div>
    </div>
  );
}

export function Dashboard({ snap }: { snap: Snapshot }) {
  const today = todayStats(snap);
  const days = dailySeries(snap, 7);
  const purposes = purposeSeries(snap, 7);
  const recent = [...allSessions(snap)].sort((a, b) => b.startedAt - a.startedAt).slice(0, 8);

  return (
    <div>
      <section className="pb-8">
        <h1 className="m-0 text-2xl font-bold">今日のYouTube</h1>
        <div className="mt-5 flex divide-x divide-line">
          <Figure label="利用時間" value={formatDuration(today.totalMs)} />
          <Figure label="セッション数" value={`${today.count}回`} />
          <Figure label="目的外" value={formatDuration(today.offPurposeMs)} />
        </div>
        <p className="m-0 mt-3 max-w-prose text-sm text-muted">
          「目的外」は、気づきの質問に「最初の目的とは違う」と自分で答えていた間の時間です。動画の内容を判定しているわけではありません。
        </p>
      </section>

      <Section title="日ごとの利用時間" note="直近7日間。YouTubeが画面に表示されていた時間です。">
        <BarChart
          title="日ごとの利用時間"
          bars={days.map((d) => ({
            key: d.key,
            label: d.label.replace(/（.）/, ''),
            value: d.totalMs,
            display: d.totalMs === 0 ? '' : formatDuration(d.totalMs),
            highlight: d.isToday,
          }))}
        />
      </Section>

      <Section title="セッション数" note="YouTubeを開いてから離れるまでを1回と数えます。">
        <BarChart
          title="日ごとのセッション数"
          bars={days.map((d) => ({
            key: d.key,
            label: d.label.replace(/（.）/, ''),
            value: d.count,
            display: d.count === 0 ? '' : `${d.count}回`,
            highlight: d.isToday,
          }))}
        />
      </Section>

      <Section title="目的別の利用時間" note="直近7日間。最初に選んだ目的ごとの合計です。">
        {purposes.length === 0 ? (
          <p className="m-0 text-muted">まだデータがありません。</p>
        ) : (
          <HBarList rows={purposes.map((p) => ({ label: p.label, value: p.ms, display: formatDuration(p.ms) }))} />
        )}
      </Section>

      <Section title="最近のYouTube利用">
        {recent.length === 0 ? (
          <p className="m-0 text-muted">まだ記録がありません。YouTubeを開くと、ここに表示されます。</p>
        ) : (
          <SessionList sessions={recent} checkIns={snap.checkIns} />
        )}
      </Section>
    </div>
  );
}
