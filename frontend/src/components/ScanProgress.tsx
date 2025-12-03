import React from 'react';
import { ScanStatus } from '@codecrypt/shared';

interface ScanProgressProps {
  scanId: string;
  status: ScanStatus;
  progressPercentage: number;
  filesProcessed: number;
  totalFiles: number;
  statusMessage?: string;
  onCancel?: () => void;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  status,
  progressPercentage,
  filesProcessed,
  totalFiles,
  statusMessage,
  onCancel,
}) => {
  const isActive = status === 'scanning' || status === 'analyzing';
  const isCancelled = status === 'cancelled';
  const isFailed = status === 'failed';
  const isCompleted = status === 'completed';

  // Determine progress bar color based on status
  const getProgressBarClass = () => {
    if (isCancelled) return 'bg-yellow-500';
    if (isFailed) return 'bg-red-500';
    if (isCompleted) return 'bg-green-500';
    return 'bg-purple-500';
  };

  // Determine container border color
  const getContainerClass = () => {
    if (isCancelled) return 'border-yellow-500';
    if (isFailed) return 'border-red-500';
    if (isCompleted) return 'border-green-500';
    return 'border-purple-500';
  };

  return (
    <div className={`border-2 ${getContainerClass()} rounded-lg p-6 bg-gray-900 shadow-lg`}>
      {/* Header with Status and Stop Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="animate-spin h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full" />
          )}
          <div>
            <div className="text-lg font-bold text-white">
              {statusMessage || `Status: ${status}`}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Scanning your repository for code quality issues
            </div>
          </div>
        </div>
        
        {/* Stop Button - More Prominent */}
        {isActive && onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 text-base font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            title="Cancel scan"
          >
            <span className="text-xl">🛑</span>
            STOP SCAN
          </button>
        )}
      </div>

      {/* Progress Bar - Larger and More Visual */}
      <div className="mb-4">
        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden shadow-inner">
          <div
            className={`h-full ${getProgressBarClass()} transition-all duration-500 ease-out flex items-center justify-end pr-2`}
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage > 10 && (
              <span className="text-xs font-bold text-white drop-shadow">
                {progressPercentage}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Stats - More Detailed */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{filesProcessed}</div>
            <div className="text-xs text-gray-400">Files Scanned</div>
          </div>
          <div className="text-gray-600">/</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-300">{totalFiles}</div>
            <div className="text-xs text-gray-400">Total Files</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-purple-400">
            {progressPercentage}%
          </div>
          <div className="text-xs text-gray-400">Complete</div>
        </div>
      </div>

      {/* Status Messages */}
      {isCancelled && (
        <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded-lg text-yellow-200 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span>Scan was cancelled by user</span>
        </div>
      )}
      {isFailed && (
        <div className="mt-4 p-3 bg-red-900 border border-red-600 rounded-lg text-red-200 flex items-center gap-2">
          <span className="text-xl">❌</span>
          <span>Scan failed - please try again</span>
        </div>
      )}
      {isCompleted && (
        <div className="mt-4 p-3 bg-green-900 border border-green-600 rounded-lg text-green-200 flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span>Scan complete! Check results below.</span>
        </div>
      )}
    </div>
  );
};
