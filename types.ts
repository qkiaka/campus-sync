// WebアプリとChrome拡張の両方が使う型。
// 時間はすべてミリ秒、日時は epoch ミリ秒で持ちます。

export interface User {
  id: string;
  createdAt: number;
}

export interface Session {
  id: string;
  userId: string;
  startedAt: number;
  /** 終了していないセッションは null */
  endedAt: number | null;
  /** YouTubeが画面に表示されていた時間(ms) */
  duration: number;
  /** 最初に選んだ目的（カテゴリ名）。選ばなかった場合は null */
  initialPurpose: string | null;
  /** 「その他」の自由入力 */
  initialPurposeDetail: string | null;
  /** 最後の時点での目的。途中で更新しなければ initialPurpose と同じ */
  finalPurpose: string | null;
  finalPurposeDetail: string | null;
  purposeChanged: boolean;
  /** 表示された「気づき」の回数 */
  interruptionCount: number;
  /** 「目的とは違う」と自分で答えていた間の時間(ms) */
  offPurposeMs: number;
}

export interface CheckIn {
  id: string;
  sessionId: string;
  /** セッション開始からの利用時間(ms) */
  elapsedTime: number;
  question: string;
  answer: string;
  createdAt: number;
}

export interface Settings {
  /** false のとき、記録も介入も行わない */
  enabled: boolean;
  /** YouTubeを開いたときに目的を聞く */
  askPurpose: boolean;
  /** 気づきを入れる間隔（分） */
  intervalsMin: number[];
}

/** Webアプリが拡張から受け取るデータ一式 */
export interface Snapshot {
  user: User;
  settings: Settings;
  sessions: Session[];
  checkIns: CheckIn[];
  /** 進行中のセッション（なければ null） */
  active: Session | null;
}
