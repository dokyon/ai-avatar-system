/**
 * リトライ機能のテスト
 */

import { withRetry, DEFAULT_RETRY_CONFIG } from './retry';
import { VideoGenerationError } from '../types/errors';

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('成功する関数は1回で完了する', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('一時的なエラーの後に成功する場合、リトライされる', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('temporary error'))
      .mockResolvedValue('success');
    
    const resultPromise = withRetry(mockFn);
    
    // 最初のリトライ待機時間を進める
    jest.advanceTimersByTime(1000);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('最大リトライ回数に達した場合、最後のエラーを投げる', async () => {
    const error = new Error('persistent error');
    const mockFn = jest.fn().mockRejectedValue(error);
    
    const resultPromise = withRetry(mockFn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2 });
    
    // すべてのリトライ待機時間を進める
    jest.advanceTimersByTime(10000);
    
    await expect(resultPromise).rejects.toThrow('persistent error');
    expect(mockFn).toHaveBeenCalledTimes(3); // 初回 + 2回のリトライ
  });

  it('リトライ不可能なVideoGenerationErrorの場合、リトライしない', async () => {
    const error = new VideoGenerationError(
      'validation error',
      'VALIDATION_ERROR',
      undefined,
      false
    );
    const mockFn = jest.fn().mockRejectedValue(error);
    
    await expect(withRetry(mockFn)).rejects.toThrow(VideoGenerationError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('リトライ可能なVideoGenerationErrorの場合、リトライする', async () => {
    const error = new VideoGenerationError(
      'network error',
      'NETWORK_ERROR',
      undefined,
      true
    );
    const mockFn = jest.fn().mockRejectedValue(error);
    
    const resultPromise = withRetry(mockFn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 1 });
    
    // リトライ待機時間を進める
    jest.advanceTimersByTime(2000);
    
    await expect(resultPromise).rejects.toThrow(VideoGenerationError);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('指数バックオフが正しく動作する', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('error'));
    
    const resultPromise = withRetry(mockFn, {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    });
    
    // 各リトライの待機時間をチェック
    setTimeout(() => {
      expect(mockFn).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1000); // 1秒後
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(2);
        jest.advanceTimersByTime(2000); // 2秒後
        
        setTimeout(() => {
          expect(mockFn).toHaveBeenCalledTimes(3);
          jest.advanceTimersByTime(4000); // 4秒後
        }, 0);
      }, 0);
    }, 0);
    
    jest.runAllTimers();
    
    await expect(resultPromise).rejects.toThrow();
    expect(mockFn).toHaveBeenCalledTimes(4);
  });
});
