/**
 * 動画生成進捗コンポーネントのテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { VideoGenerationProgress } from './VideoGenerationProgress';
import { ProgressState } from '../types/progress';

describe('VideoGenerationProgress', () => {
  const defaultProgress: ProgressState = {
    currentStep: 'VALIDATING',
    progress: 10,
    message: 'バリデーション中...',
  };

  it('visible=falseの場合、何も表示されない', () => {
    const { container } = render(
      <VideoGenerationProgress progress={defaultProgress} visible={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('visible=trueの場合、進捗が表示される', () => {
    render(
      <VideoGenerationProgress progress={defaultProgress} visible={true} />
    );
    
    expect(screen.getByText('動画生成中...')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('バリデーション中...')).toBeInTheDocument();
  });

  it('進捗バーの幅が正しく設定される', () => {
    const progress: ProgressState = {
      currentStep: 'GENERATING_AUDIO',
      progress: 30,
      message: '音声生成中...',
    };
    
    render(
      <VideoGenerationProgress progress={progress} visible={true} />
    );
    
    const progressFill = document.querySelector('.progress-fill') as HTMLElement;
    expect(progressFill).toHaveStyle({ width: '30%' });
  });

  it('エラー状態の場合、エラーメッセージが表示される', () => {
    const errorProgress: ProgressState = {
      currentStep: 'ERROR',
      progress: 0,
      message: 'エラーが発生しました',
      error: 'OpenAI APIでエラーが発生しました。'
    };
    
    render(
      <VideoGenerationProgress progress={errorProgress} visible={true} />
    );
    
    expect(screen.getByText('OpenAI APIでエラーが発生しました。')).toBeInTheDocument();
    
    const errorElement = screen.getByText('OpenAI APIでエラーが発生しました。');
    expect(errorElement).toHaveClass('error-message');
  });

  it('各ステップインジケーターが正しく表示される', () => {
    const progress: ProgressState = {
      currentStep: 'GENERATING_VIDEO',
      progress: 70,
      message: '動画生成中...',
    };
    
    render(
      <VideoGenerationProgress progress={progress} visible={true} />
    );
    
    expect(screen.getByText('検証')).toBeInTheDocument();
    expect(screen.getByText('音声生成')).toBeInTheDocument();
    expect(screen.getByText('動画生成')).toBeInTheDocument();
    expect(screen.getByText('完了')).toBeInTheDocument();
  });

  describe('ステップインジケーター', () => {
    it('完了したステップには✓が表示される', () => {
      const progress: ProgressState = {
        currentStep: 'GENERATING_VIDEO',
        progress: 70,
        message: '動画生成中...',
      };
      
      render(
        <VideoGenerationProgress progress={progress} visible={true} />
      );
      
      // 完了したステップ（VALIDATING, GENERATING_AUDIO）
      const stepIndicators = document.querySelectorAll('.step-completed');
      expect(stepIndicators.length).toBeGreaterThan(0);
      
      // ✓マークが表示されているかチェック
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('現在のステップには●が表示される', () => {
      const progress: ProgressState = {
        currentStep: 'GENERATING_AUDIO',
        progress: 30,
        message: '音声生成中...',
      };
      
      render(
        <VideoGenerationProgress progress={progress} visible={true} />
      );
      
      // 現在のステップ
      const currentStep = document.querySelector('.step-current');
      expect(currentStep).toBeInTheDocument();
      
      // ●マークが表示されているかチェック
      expect(screen.getByText('●')).toBeInTheDocument();
    });

    it('保留中のステップには○が表示される', () => {
      const progress: ProgressState = {
        currentStep: 'VALIDATING',
        progress: 10,
        message: 'バリデーション中...',
      };
      
      render(
        <VideoGenerationProgress progress={progress} visible={true} />
      );
      
      // 保留中のステップ
      const pendingSteps = document.querySelectorAll('.step-pending');
      expect(pendingSteps.length).toBeGreaterThan(0);
      
      // ○マークが表示されているかチェック
      expect(screen.getByText('○')).toBeInTheDocument();
    });

    it('エラー状態では✕が表示される', () => {
      const errorProgress: ProgressState = {
        currentStep: 'ERROR',
        progress: 0,
        message: 'エラーが発生しました',
        error: 'APIエラー'
      };
      
      render(
        <VideoGenerationProgress progress={errorProgress} visible={true} />
      );
      
      // エラーステップ
      const errorSteps = document.querySelectorAll('.step-error');
      expect(errorSteps.length).toBeGreaterThan(0);
      
      // ✕マークが表示されているかチェック
      expect(screen.getByText('✕')).toBeInTheDocument();
    });
  });

  it('完了状態では100%とメッセージが表示される', () => {
    const completedProgress: ProgressState = {
      currentStep: 'COMPLETED',
      progress: 100,
      message: '動画生成が完了しました！',
    };
    
    render(
      <VideoGenerationProgress progress={completedProgress} visible={true} />
    );
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('動画生成が完了しました！')).toBeInTheDocument();
  });
});
