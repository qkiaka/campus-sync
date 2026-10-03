import type { AnswerKind, CheckInPrompt } from '../../shared/questions';
import type { Session, Settings, Snapshot } from '../../shared/types';

/** YouTubeページ(content script) → background */
export type ContentMessage =
  | { type: 'STATE'; visible: boolean }
  | { type: 'SET_PURPOSE'; category: string | null; detail: string | null }
  | {
      type: 'ANSWER';
      milestoneMin: number;
      question: string;
      answer: string | null;
      kind: AnswerKind;
      action: 'continue' | 'close';
      /** 「いまの目的に更新する」で入力された文 */
      newPurposeDetail?: string;
    };

/** Webアプリ(bridge) → background */
export type WebMessage =
  | { type: 'PING' }
  | { type: 'GET_ALL' }
  | { type: 'SAVE_SETTINGS'; payload: Settings }
  | { type: 'CLEAR_ALL' };

/** popup → background */
export type PopupMessage = { type: 'GET_POPUP' } | { type: 'SET_ENABLED'; enabled: boolean };

export type Message = ContentMessage | WebMessage | PopupMessage;

export interface StateView {
  enabled: boolean;
  needsPurpose: boolean;
  prompt: CheckInPrompt | null;
  purposeLabel: string | null;
}

export interface PopupView {
  settings: Settings;
  active: Session | null;
}

export type AllView = Snapshot;
