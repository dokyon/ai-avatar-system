/**
 * エラー関連の型定義
 */

/** APIエラーのタイプ */
export type ApiErrorType = 'OPENAI_ERROR' | 'DID_ERROR' | 'CREDIT_INSUFFICIENT' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

/** カスタムエラークラス */
export class VideoGenerationError extends Error {
  constructor(
    message: string,
    public readonly type: ApiErrorType,
    public readonly originalError?: Error,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'VideoGenerationError';
  }
}

/** エラーメッセージマップ */
export const ERROR_MESSAGES: Record<ApiErrorType, string> = {
  OPENAI_ERROR: 'OpenAI APIでエラーが発生しました。しばらく時間をおいて再度お試しください。',
  DID_ERROR: 'D-ID APIでエラーが発生しました。動画生成に失敗しました。',
  CREDIT_INSUFFICIENT: 'クレジットが不足しています。プランをアップグレードするか、クレジットを追加してください。',
  VALIDATION_ERROR: '入力内容に問題があります。内容を確認して再度お試しください。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認して再度お試しください。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。しばらく時間をおいて再度お試しください。'
};
