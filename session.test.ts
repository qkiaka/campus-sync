import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPrompt } from '../../shared/questions';
import { DEFAULT_SETTINGS, normalizeIntervals } from '../../shared/constants';
import { applyBeat, dueMilestone, finalize, isStale, liveSession, newActive, setMode, BEAT_CAP_MS, IDLE_END_MS } from '../src/session';

const T0 = 1_700_000_000_000;

function runFor(a: ReturnType<typeof newActive>, ms: number, step = 5000) {
  let t = a.lastVisibleAt;
  for (let e = 0; e < ms; e += step) {
    t += step;
    applyBeat(a, t, true);
  }
  return t;
}

test('表示されている間だけ時間が増える', () => {
  const a = newActive('u', T0);
  applyBeat(a, T0 + 5000, true);
  applyBeat(a, T0 + 10000, false); // 非表示
  applyBeat(a, T0 + 15000, true); // 空白が長いので、この回は加算しない
  applyBeat(a, T0 + 20000, true);
  assert.equal(a.session.duration, 10000);
});

test('長い空白は利用時間に混ざらない', () => {
  const a = newActive('u', T0);
  applyBeat(a, T0 + 3_600_000, true);
  assert.equal(a.session.duration, 0);
  assert.ok(BEAT_CAP_MS > 5000);
});

test('5分で最初の確認が出る', () => {
  const a = newActive('u', T0);
  runFor(a, 4 * 60_000);
  assert.equal(dueMilestone(a, DEFAULT_SETTINGS), null);
  runFor(a, 60_000);
  assert.equal(dueMilestone(a, DEFAULT_SETTINGS), 5);
  a.firedMilestones.push(5);
  assert.equal(dueMilestone(a, DEFAULT_SETTINGS), null);
});

test('たまった確認は一番大きい間隔を1回だけ', () => {
  const a = newActive('u', T0);
  a.session.duration = 31 * 60_000;
  assert.equal(dueMilestone(a, DEFAULT_SETTINGS), 30);
});

test('目的外の時間を集計できる', () => {
  const a = newActive('u', T0);
  a.session.duration = 5 * 60_000;
  setMode(a, 'off');
  a.session.duration = 12 * 60_000;
  assert.equal(liveSession(a).offPurposeMs, 7 * 60_000);
  a.session.duration = 15 * 60_000;
  const s = finalize(a, T0 + 20 * 60_000);
  assert.equal(s.offPurposeMs, 10 * 60_000);
  assert.equal(s.endedAt, T0 + 20 * 60_000);
});

test('10分見られなければ終了対象', () => {
  const a = newActive('u', T0);
  assert.equal(isStale(a, T0 + IDLE_END_MS - 1), false);
  assert.equal(isStale(a, T0 + IDLE_END_MS + 1), true);
});

test('質問は時間で変わり、必ず選択肢がある', () => {
  for (const m of [5, 15, 30, 45, 60, 90]) {
    const p = buildPrompt(m);
    assert.ok(p.choices.length >= 3);
    assert.ok(!/使いすぎ|無駄/.test(p.title + p.question));
  }
  assert.match(buildPrompt(5).title, /5分/);
  assert.match(buildPrompt(90).title, /1時間30分/);
});

test('間隔の設定は整えられる', () => {
  assert.deepEqual(normalizeIntervals([30, 5, 5, 0, -1, 'x', 10000]), [5, 30]);
});
