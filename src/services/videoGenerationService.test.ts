/**
 * 動画生成サービスのテスト
 */

import { VideoGenerationService } from './videoGenerationService';
import { VideoGenerationError } from '../types/errors';
import { ProgressState } from '../types/progress';

// モック関数
jest.mock('../utils/retry', () => ({
  withRetry: jest.fn((fn) => fn())
}));

describe('VideoGenerationService', () => {
  let service: VideoGenerationService;
  let mockOnProgress: jest.Mock<void, [ProgressState]>;

  beforeEach(() => {
    mockOnProgress = jest.fn();
    service = new VideoGenerationService({
      openaiApiKey: 'test-openai-key',
      didApiKey: 'test-did-key',
      onProgress: mockOnProgress
    });
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateVideo', () => {
    it('正常な台本で動画生成が成功する', async () => {
      const script = 'これは有効な台本です。テストに使用します。';
      
      // APIモックの設定
      jest.spyOn(service as any, 'callOpenAIAPI')
        .mockResolvedValue({ audioUrl: 'https://example.com/audio.mp3' });
      jest.spyOn(service as any, 'callDIDAPI')
        .mockResolvedValue({ videoUrl: 'https://example.com/video.mp4' });
      
      const resultPromise = service.generateVideo(script);
      
      // タイマーを進める（APIの待機時間をスキップ）
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(result).toEqual({
        videoUrl: 'https://example.com/video.mp4',
        audioUrl: 'https://example.com/audio.mp3',
        duration: expect.any(Number)
      });
      
      // 進捗コールバックが正しく呼ばれることを確認
      expect(mockOnProgress).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: 'VALIDATING' })
      );
      expect(mockOnProgress).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: 'GENERATING_AUDIO' })
      );
      expect(mockOnProgress).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: 'GENERATING_VIDEO' })
      );
      expect(mockOnProgress).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: 'COMPLETED' })
      );
    });

    it('無効な台本の場合、バリデーションエラーが発生する', async () => {
      const script = ''; // 空文字
      
      await expect(service.generateVideo(script)).rejects.toThrow(VideoGenerationError);
      await expect(service.generateVideo(script)).rejects.toThrow('台本を入力してください。');
      
      // エラー時の進捗更新を確認
      expect(mockOnProgress).toHaveBeenCalledWith(
        expect.objectContaining({ 
          currentStep: 'ERROR',
          error: expect.stringContaining('台本を入力してください')
        })
      );
    });

    it('OpenAI APIエラーの場合、適切なエラーが発生する', async () => {
      const script = 'これは有効な台本です。テストに使用します。';
      
      jest.spyOn(service as any, 'callOpenAIAPI')
        .mockRejectedValue(new Error('OpenAI API Error'));
      
      await expect(service.generateVideo(script)).rejects.toThrow(VideoGenerationError);
      
      // エラーメッセージの確認
      try {
        await service.generateVideo(script);
      } catch (error) {
        expect(error).toBeInstanceOf(VideoGenerationError);
        const vgError = error as VideoGenerationError;
        expect(vgError.type).toBe('OPENAI_ERROR');
        expect(vgError.message).toContain('OpenAI API');
      }
    });

    it('D-ID APIエラーの場合、適切なエラーが発生する', async () => {
      const script = 'これは有効な台本です。テストに使用します。';
      
      jest.spyOn(service as any, 'callOpenAIAPI')
        .mockResolvedValue({ audioUrl: 'https://example.com/audio.mp3' });
      jest.spyOn(service as any, 'callDIDAPI')
        .mockRejectedValue(new Error('D-ID API Error'));
      
      await expect(service.generateVideo(script)).rejects.toThrow(VideoGenerationError);
      
      try {
        await service.generateVideo(script);
      } catch (error) {
        expect(error).toBeInstanceOf(VideoGenerationError);
        const vgError = error as VideoGenerationError;
        expect(vgError.type).toBe('DID_ERROR');
        expect(vgError.message).toContain('D-ID API');
      }
    });
  });

  describe('isRetryableError', () => {
    it('ネットワークエラーはリトライ可能と判定される', () => {
      const error = new Error('network timeout');
      const result = (service as any).isRetryableError(error, 'NETWORK_ERROR');
      
      expect(result).toBe(true);
    });

    it('クレジット不足エラーはリトライ不可と判定される', () => {
      const error = new Error('insufficient credits');
      const result = (service as any).isRetryableError(error, 'CREDIT_INSUFFICIENT');
      
      expect(result).toBe(false);
    });

    it('バリデーションエラーはリトライ不可と判定される', () => {
      const error = new Error('validation failed');
      const result = (service as any).isRetryableError(error, 'VALIDATION_ERROR');
      
      expect(result).toBe(false);
    });

    it('レート制限エラーはリトライ可能と判定される', () => {
      const error = new Error('rate limit exceeded');
      const result = (service as any).isRetryableError(error, 'OPENAI_ERROR');
      
      expect(result).toBe(true);
    });
  });

  describe('progress tracking', () => {
    it('進捗コールバックが設定されていない場合、エラーにならない', async () => {
      const serviceWithoutCallback = new VideoGenerationService({
        openaiApiKey: 'test-key',
        didApiKey: 'test-key'
        // onProgress なし
      });
      
      jest.spyOn(serviceWithoutCallback as any, 'callOpenAIAPI')
        .mockResolvedValue({ audioUrl: 'https://example.com/audio.mp3' });
      jest.spyOn(serviceWithoutCallback as any, 'callDIDAPI')
        .mockResolvedValue({ videoUrl: 'https://example.com/video.mp4' });
      
      const script = 'これは有効な台本です。テストに使用します。';
      
      jest.runAllTimers();
      await expect(serviceWithoutCallback.generateVideo(script)).resolves.toBeDefined();
    });
  });
});
