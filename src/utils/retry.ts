/**
 * リトライ機能のユーティリティ
 */

import { VideoGenerationError } from '../types/errors';

/** リトライ設定 */
export interface RetryConfig {
  /** 最大リトライ回数 */
  maxRetries: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay: number;
  /** 指数バックオフを使用するか */
  exponentialBackoff: boolean;
}

/** デフォルトのリトライ設定 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true
};

/**
 * 指定した関数をリトライ付きで実行する
 * @param fn 実行する非同期関数
 * @param config リトライ設定
 * @returns 実行結果
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // VideoGenerationErrorの場合、リトライ可能かチェック
      if (error instanceof VideoGenerationError && !error.retryable) {
        throw error;
      }
      
      // 最大リトライ回数に達した場合は終了
      if (attempt === config.maxRetries) {
        break;
      }
      
      // リトライ間隔を計算
      const delay = config.exponentialBackoff 
        ? config.retryDelay * Math.pow(2, attempt)
        : config.retryDelay;
      
      // 待機
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
};

/**
 * 指定時間待機する
 * @param ms 待機時間（ミリ秒）
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
