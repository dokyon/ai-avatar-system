/**
 * 動画生成の進捗表示コンポーネント
 */

import React from 'react';
import { ProgressState, ProgressStep } from '../types/progress';

/** プロップス */
interface VideoGenerationProgressProps {
  /** 進捗状態 */
  progress: ProgressState;
  /** 表示するかどうか */
  visible: boolean;
}

/**
 * 動画生成進捗コンポーネント
 */
export const VideoGenerationProgress: React.FC<VideoGenerationProgressProps> = ({
  progress,
  visible
}) => {
  if (!visible) return null;

  return (
    <div className="video-generation-progress">
      <div className="progress-header">
        <h3>動画生成中...</h3>
        <span className="progress-percentage">{progress.progress}%</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      
      <div className="progress-steps">
        <StepIndicator 
          step="VALIDATING" 
          currentStep={progress.currentStep}
          label="検証"
        />
        <StepIndicator 
          step="GENERATING_AUDIO" 
          currentStep={progress.currentStep}
          label="音声生成"
        />
        <StepIndicator 
          step="GENERATING_VIDEO" 
          currentStep={progress.currentStep}
          label="動画生成"
        />
        <StepIndicator 
          step="COMPLETED" 
          currentStep={progress.currentStep}
          label="完了"
        />
      </div>
      
      <div className="progress-message">
        {progress.error ? (
          <span className="error-message">{progress.error}</span>
        ) : (
          <span className="status-message">{progress.message}</span>
        )}
      </div>
    </div>
  );
};

/** ステップインジケーターのプロップス */
interface StepIndicatorProps {
  step: ProgressStep;
  currentStep: ProgressStep;
  label: string;
}

/**
 * ステップインジケーター
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({ step, currentStep, label }) => {
  const getStepStatus = (): 'completed' | 'current' | 'pending' | 'error' => {
    if (currentStep === 'ERROR') return 'error';
    if (currentStep === step) return 'current';
    
    const stepOrder: ProgressStep[] = ['VALIDATING', 'GENERATING_AUDIO', 'GENERATING_VIDEO', 'COMPLETED'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);
    
    return stepIndex < currentIndex ? 'completed' : 'pending';
  };

  const status = getStepStatus();

  return (
    <div className={`step-indicator step-${status}`}>
      <div className="step-icon">
        {status === 'completed' && '✓'}
        {status === 'current' && '●'}
        {status === 'error' && '✕'}
        {status === 'pending' && '○'}
      </div>
      <span className="step-label">{label}</span>
    </div>
  );
};
