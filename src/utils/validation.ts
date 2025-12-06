/**
 * バリデーション関連のユーティリティ
 */

import { VideoGenerationError } from '../types/errors';

/** 台本の最大文字数 */
export const MAX_SCRIPT_LENGTH = 5000;

/** 台本のバリデーション結果 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 台本のバリデーションを行う
 * @param script 台本テキスト
 * @returns バリデーション結果
 */
export const validateScript = (script: string): ValidationResult => {
  const errors: string[] = [];

  // 空文字チェック
  if (!script || script.trim().length === 0) {
    errors.push('台本を入力してください。');
  }

  // 文字数制限チェック
  if (script.length > MAX_SCRIPT_LENGTH) {
    errors.push(`台本は${MAX_SCRIPT_LENGTH}文字以内で入力してください。現在：${script.length}文字`);
  }

  // 最小文字数チェック
  if (script.trim().length > 0 && script.trim().length < 10) {
    errors.push('台本は10文字以上で入力してください。');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * バリデーションエラーを投げる
 * @param script 台本テキスト
 * @throws VideoGenerationError バリデーションに失敗した場合
 */
export const validateScriptOrThrow = (script: string): void => {
  const result = validateScript(script);
  if (!result.isValid) {
    throw new VideoGenerationError(
      result.errors.join(' '),
      'VALIDATION_ERROR',
      undefined,
      false
    );
  }
};
