/**
 * 進捗管理の型定義
 */

/** 進捗ステップ */
export type ProgressStep = 'VALIDATING' | 'GENERATING_AUDIO' | 'GENERATING_VIDEO' | 'COMPLETED' | 'ERROR';

/** 進捗状態 */
export interface ProgressState {
  /** 現在のステップ */
  currentStep: ProgressStep;
  /** 進捗率（0-100） */
  progress: number;
  /** ステップの説明 */
  message: string;
  /** エラーメッセージ（エラー時のみ） */
  error?: string;
}

/** 進捗ステップの設定 */
export const PROGRESS_STEPS: Record<ProgressStep, { progress: number; message: string }> = {
  VALIDATING: { progress: 10, message: '台本を検証しています...' },
  GENERATING_AUDIO: { progress: 30, message: '音声を生成しています...' },
  GENERATING_VIDEO: { progress: 70, message: '動画を生成しています...' },
  COMPLETED: { progress: 100, message: '動画生成が完了しました！' },
  ERROR: { progress: 0, message: 'エラーが発生しました' }
};
