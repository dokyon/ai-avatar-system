/**
 * バリデーション関連のテスト
 */

import { validateScript, validateScriptOrThrow, MAX_SCRIPT_LENGTH } from './validation';
import { VideoGenerationError } from '../types/errors';

describe('validateScript', () => {
  it('正常な台本の場合、バリデーションが成功する', () => {
    const script = 'これは有効な台本です。';
    const result = validateScript(script);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('空文字の場合、バリデーションが失敗する', () => {
    const result = validateScript('');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('台本を入力してください。');
  });

  it('空白文字のみの場合、バリデーションが失敗する', () => {
    const result = validateScript('   ');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('台本を入力してください。');
  });

  it('文字数制限を超える場合、バリデーションが失敗する', () => {
    const longScript = 'a'.repeat(MAX_SCRIPT_LENGTH + 1);
    const result = validateScript(longScript);
    
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('台本は5000文字以内で入力してください');
  });

  it('最小文字数を下回る場合、バリデーションが失敗する', () => {
    const shortScript = 'short';
    const result = validateScript(shortScript);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('台本は10文字以上で入力してください。');
  });

  it('複数のエラーが同時に発生する場合', () => {
    const result = validateScript('');
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateScriptOrThrow', () => {
  it('正常な台本の場合、エラーを投げない', () => {
    const script = 'これは有効な台本です。';
    
    expect(() => validateScriptOrThrow(script)).not.toThrow();
  });

  it('無効な台本の場合、VideoGenerationErrorを投げる', () => {
    const script = '';
    
    expect(() => validateScriptOrThrow(script)).toThrow(VideoGenerationError);
    expect(() => validateScriptOrThrow(script)).toThrow('台本を入力してください。');
  });

  it('投げられるエラーが正しい型とプロパティを持つ', () => {
    const script = '';
    
    try {
      validateScriptOrThrow(script);
    } catch (error) {
      expect(error).toBeInstanceOf(VideoGenerationError);
      const vgError = error as VideoGenerationError;
      expect(vgError.type).toBe('VALIDATION_ERROR');
      expect(vgError.retryable).toBe(false);
    }
  });
});
