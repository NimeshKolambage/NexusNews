import { useState, useEffect } from 'react';

/**
 * Full-screen error overlay with auto-retry and offline support
 * 
 * Props:
 * - isVisible: boolean - Show/hide overlay
 * - errorType: string - 'connection' | 'server-busy' | 'rate-limited' | 'rate-limited-daily'
 * - retryInterval: number - Seconds between auto-retries (default: 10, use 60 for daily rate limits)
 * - onRetry: function - Callback for retry (should return Promise)
 * - onClose: function - Callback for dismiss button
 * - onStatusChange: function - Called when overlayappears/disappears (for disabling UI)
 */
export default function ErrorOverlay({ 
  isVisible, 
  onRetry, 
  errorType = 'connection',
  retryInterval = 10,
  onClose,
  onStatusChange
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(retryInterval);
  const [isRetrying, setIsRetrying] = useState(false);

  // Notify parent when overlay visibility changes (to disable/enable UI)
  useEffect(() => {
    onStatusChange?.(isVisible);
  }, [isVisible, onStatusChange]);

  // Countdown timer for next auto-retry
  useEffect(() => {
    if (!isVisible || !isRetrying) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleAutoRetry();
          return retryInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, isRetrying, retryInterval]);

  // Listen for offline/online events
  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Back online!');
      handleManualRetry();
    };

    const handleOffline = () => {
      console.log('🔌 Connection lost');
      setIsRetrying(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAutoRetry = async () => {
    setRetryCount(prev => prev + 1);
    console.log(`🔄 Auto-retry attempt #${retryCount + 1}...`);
    
    try {
      await onRetry?.();
      // If success, parent will set isVisible to false
    } catch (error) {
      console.error('Retry failed:', error);
      // Keep retrying
    }
  };

  const handleManualRetry = async () => {
    setRetryCount(prev => prev + 1);
    setCountdown(retryInterval);
    console.log(`🔄 Manual retry attempt #${retryCount + 1}...`);
    
    try {
      await onRetry?.();
      // If success, parent will set isVisible to false
    } catch (error) {
      console.error('Retry failed:', error);
      setIsRetrying(true);
    }
  };

  if (!isVisible) return null;

  const errorConfig = {
    connection: {
      title: '🔌 Connection Lost',
      message: 'Unable to connect to server. Attempting to reconnect...',
      icon: '📡',
      color: 'from-orange-500 to-red-500'
    },
    'server-busy': {
      title: '⚙️ Server Busy',
      message: 'Too many requests. The server is taking a break. We\'re retrying...',
      icon: '🔄',
      color: 'from-yellow-500 to-orange-500'
    },
    'rate-limited': {
      title: '⏱️ Rate Limited',
      message: 'Too many requests in a short time. Please wait while we retry...',
      icon: '⏳',
      color: 'from-red-500 to-pink-500'
    },
    'rate-limited-daily': {
      title: '📊 Daily Request Limit Reached',
      message: 'We\'ve reached today\'s API limit. Retrying to connect automatically...',
      icon: '📈',
      color: 'from-indigo-500 to-purple-500'
    }
  };

  const config = errorConfig[errorType] || errorConfig.connection;

  return (
    <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${
      isVisible ? 'bg-black/60 backdrop-blur-md' : 'bg-black/0'
    }`}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20 animate-pulse`}></div>
      </div>

      {/* Center Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className={`text-6xl ${
              errorType === 'server-busy' ? 'animate-spin' : 'animate-bounce'
            }`}>
              {config.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
            {config.title}
          </h2>

          {/* Message */}
          <p className="text-center text-gray-600 mb-6 text-sm">
            {config.message}
          </p>

          {/* Retry Counter */}
          <div className="text-center text-xs text-gray-500 mb-4">
            Retry attempts: <span className="font-semibold text-gray-700">{retryCount}</span>
          </div>

          {/* Progress Bar / Animated Loading */}
          <div className="mb-6">
            {/* Animated loading dots */}
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-300`}
                style={{ width: `${((retryInterval - countdown) / retryInterval) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="text-center text-sm text-gray-600 mb-6">
            {isRetrying ? (
              <>
                <p>Next retry in <span className="font-bold text-lg text-blue-600">{countdown}</span>s</p>
              </>
            ) : (
              <p className="text-green-600 font-semibold">✅ Preparing to retry...</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleManualRetry}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                'bg-gradient-to-r ' + config.color + ' text-white hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              🔄 Retry Now
            </button>
            
            <button
              onClick={() => onClose?.()}
              className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200 active:scale-95"
            >
              Dismiss
            </button>
          </div>

          {/* Status Indicator */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Auto-retrying in background...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-4">
        <p className="text-white/80 text-center text-sm">
          {navigator.onLine ? '📡 Online' : '🔌 Offline'} · 
          Retrying: {isRetrying ? '🟢 Active' : '⏸️ Paused'}
        </p>
      </div>
    </div>
  );
}
