// 時間に応じて変わる「気づき」の問いかけ。
// 責めない・決めつけない・自分で判断できる、を守った文面にしています。

export type AnswerKind = 'on' | 'off' | 'neutral';

export interface Choice {
  label: string;
  /** on: 目的どおり / off: 目的とは違う / neutral: どちらでもない */
  kind: AnswerKind;
}

export interface CheckInPrompt {
  milestoneMin: number;
  title: string;
  question: string;
  choices: Choice[];
  /** 最初の目的を画面に添えるか */
  showPurpose: boolean;
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export function buildPrompt(milestoneMin: number): CheckInPrompt {
  const t = formatMinutes(milestoneMin);

  if (milestoneMin < 15) {
    return {
      milestoneMin,
      title: `YouTubeを使い始めて${t}です。`,
      question: '今、何をしていますか？',
      showPurpose: false,
      choices: [
        { label: '最初の目的のために使っている', kind: 'on' },
        { label: '別の動画を見ている', kind: 'off' },
        { label: 'なんとなく見ている', kind: 'off' },
        { label: 'わからない', kind: 'neutral' },
      ],
    };
  }
  if (milestoneMin < 30) {
    return {
      milestoneMin,
      title: `YouTubeを使って${t}たちました。`,
      question: '最初にYouTubeを開いた目的を覚えていますか？',
      showPurpose: true,
      choices: [
        { label: '覚えていて、今もその目的で使っている', kind: 'on' },
        { label: '覚えているけれど、別のことをしている', kind: 'off' },
        { label: '忘れていた', kind: 'neutral' },
      ],
    };
  }
  if (milestoneMin < 45) {
    return {
      milestoneMin,
      title: `YouTubeを${t}使っています。`,
      question: '今も続けたいですか？',
      showPurpose: true,
      choices: [
        { label: '続けたい', kind: 'neutral' },
        { label: '少し迷っている', kind: 'neutral' },
        { label: 'そろそろ区切りをつけたい', kind: 'neutral' },
      ],
    };
  }
  if (milestoneMin < 60) {
    return {
      milestoneMin,
      title: `${t}たちました。`,
      question: '今見ているものは、自分で選んだものですか？',
      showPurpose: true,
      choices: [
        { label: '自分で選んでいる', kind: 'on' },
        { label: '流れで見ている', kind: 'off' },
        { label: 'よくわからない', kind: 'neutral' },
      ],
    };
  }
  return {
    milestoneMin,
    title: `YouTubeを${t}使っています。`,
    question: 'ここまでの時間は、思っていた感覚と合っていますか？',
    showPurpose: true,
    choices: [
      { label: 'だいたい思っていた通り', kind: 'neutral' },
      { label: '思っていたより長かった', kind: 'neutral' },
      { label: 'わからない', kind: 'neutral' },
    ],
  };
}

/** CheckIn.question に保存する文字列 */
export function promptToText(p: CheckInPrompt): string {
  return `${p.title}${p.question}`;
}
