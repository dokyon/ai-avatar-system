/**
 * 動画生成サービス
 */

import { VideoGenerationError, ApiErrorType, ERROR_MESSAGES } from '../types/errors';
import { ProgressState, ProgressStep, PROGRESS_STEPS } from '../types/progress';
import { validateScriptOrThrow } from '../utils/validation';
import { withRetry } from '../utils/retry';

/** 動画生成の設定 */
export interface VideoGenerationConfig {
  /** OpenAI APIキー */
  openaiApiKey: string;
  /** D-ID APIキー */
  didApiKey: string;
  /** 進捗コールバック */
  onProgress?: (progress: ProgressState) => void;
}

/** 動画生成の結果 */
export interface VideoGenerationResult {
  /** 動画URL */
  videoUrl: string;
  /** 音声URL */
  audioUrl: string;
  /** 生成時間（秒） */
  duration: number;
}

/**
 * 動画生成サービスクラス
 */
export class VideoGenerationService {
  constructor(private config: VideoGenerationConfig) {}

  /**
   * 動画を生成する
   * @param script 台本テキスト
   * @returns 動画生成結果
   */
  async generateVideo(script: string): Promise<VideoGenerationResult> {
    const startTime = Date.now();
    
    try {
      // バリデーション
      this.updateProgress('VALIDATING');
      validateScriptOrThrow(script);
      
      // 音声生成
      this.updateProgress('GENERATING_AUDIO');
      const audioUrl = await withRetry(() => this.generateAudio(script));
      
      // 動画生成
      this.updateProgress('GENERATING_VIDEO');
      const videoUrl = await withRetry(() => this.generateVideoFromAudio(audioUrl));
      
      // 完了
      this.updateProgress('COMPLETED');
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      return {
        videoUrl,
        audioUrl,
        duration
      };
      
    } catch (error) {
      this.updateProgress('ERROR', this.getErrorMessage(error));
      throw error;
    }
  }

  /**
   * 音声を生成する（OpenAI API）
   * @param script 台本テキスト
   * @returns 音声URL
   */
  private async generateAudio(script: string): Promise<string> {
    try {
      // OpenAI APIを呼び出し（実装は省略）
      const response = await this.callOpenAIAPI(script);
      return response.audioUrl;
    } catch (error) {
      throw this.createApiError(error, 'OPENAI_ERROR');
    }
  }

  /**
   * 音声から動画を生成する（D-ID API）
   * @param audioUrl 音声URL
   * @returns 動画URL
   */
  private async generateVideoFromAudio(audioUrl: string): Promise<string> {
    try {
      // D-ID APIを呼び出し（実装は省略）
      const response = await this.callDIDAPI(audioUrl);
      return response.videoUrl;
    } catch (error) {
      throw this.createApiError(error, 'DID_ERROR');
    }
  }

  /**
   * OpenAI APIを呼び出す（モック実装）
   * @param script 台本テキスト
   * @returns API応答
   */
  private async callOpenAIAPI(script: string): Promise<{ audioUrl: string }> {
    // 実際の実装では、OpenAI APIを呼び出す
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error('OpenAI API Error'));
        } else {
          resolve({ audioUrl: 'https://example.com/audio.mp3' });
        }
      }, 2000);
    });
  }

  /**
   * D-ID APIを呼び出す（モック実装）
   * @param audioUrl 音声URL
   * @returns API応答
   */
  private async callDIDAPI(audioUrl: string): Promise<{ videoUrl: string }> {
    // 実際の実装では、D-ID APIを呼び出す
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error('D-ID API Error'));
        } else {
          resolve({ videoUrl: 'https://example.com/video.mp4' });
        }
      }, 3000);
    });
  }

  /**
   * 進捗を更新する
   * @param step 進捗ステップ
   * @param error エラーメッセージ（オプション）
   */
  private updateProgress(step: ProgressStep, error?: string): void {
    if (!this.config.onProgress) return;
    
    const stepConfig = PROGRESS_STEPS[step];
    const progress: ProgressState = {
      currentStep: step,
      progress: stepConfig.progress,
      message: stepConfig.message,
      error
    };
    
    this.config.onProgress(progress);
  }

  /**
   * APIエラーを作成する
   * @param error 元のエラー
   * @param type エラータイプ
   * @returns VideoGenerationError
   */
  private createApiError(error: unknown, type: ApiErrorType): VideoGenerationError {
    const originalError = error instanceof Error ? error : new Error(String(error));
    const isRetryable = this.isRetryableError(originalError, type);
    
    return new VideoGenerationError(
      ERROR_MESSAGES[type],
      type,
      originalError,
      isRetryable
    );
  }

  /**
   * リトライ可能なエラーかどうかを判定する
   * @param error エラー
   * @param type エラータイプ
   * @returns リトライ可能かどうか
   */
  private isRetryableError(error: Error, type: ApiErrorType): boolean {
    // クレジット不足やバリデーションエラーはリトライ不可
    if (type === 'CREDIT_INSUFFICIENT' || type === 'VALIDATION_ERROR') {
      return false;
    }
    
    // 一時的なネットワークエラーやサーバーエラーはリトライ可能
    const retryableMessages = ['timeout', 'network', '5xx', 'rate limit'];
    const errorMessage = error.message.toLowerCase();
    
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * エラーメッセージを取得する
   * @param error エラー
   * @returns エラーメッセージ
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof VideoGenerationError) {
      return error.message;
    }
    
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}
