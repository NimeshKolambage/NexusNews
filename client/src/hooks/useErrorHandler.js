import { useState, useCallback, useEffect } from 'react';
import { setupApiInterceptor } from '../services/apiInterceptor';

/**
 * Advanced hook for handling API errors with auto-recovery
 * 
 * Features:
 * - Auto-detects error.code === 'rateLimited'
 * - 60-second retry interval for daily limits
 * - Makes UI non-interactive while overlay is active
 * - Auto-retries in background
 * - Auto-hides on success
 * 
 * Usage:
 * const { 
 *   isErrorVisible, 
 *   errorType, 
 *   retryInterval,
 *   showError, 
 *   hideError, 
 *   handleRetry,
 *   isUIDisabled 
 * } = useErrorHandler();
 */
export const useErrorHandler = () => {
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [errorType, setErrorType] = useState('connection');
  const [retryInterval, setRetryInterval] = useState(10);
  const [retryCallback, setRetryCallback] = useState(null);
  const [isUIDisabled, setIsUIDisabled] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Setup API interceptor on mount
  useEffect(() => {
    setupApiInterceptor(handleApiError);
  }, []);

  const handleApiError = useCallback((errorInfo) => {
    console.log('🚨 Error Handler:', errorInfo);
    setLastError(errorInfo);
    setErrorType(errorInfo.type || 'connection');
    setRetryInterval(errorInfo.retryInterval || 10);
    setIsErrorVisible(true);
  }, []);

  const showError = useCallback((type = 'connection', callback = null, interval = 10) => {
    console.log(`❌ Showing ${type} error overlay`);
    setErrorType(type);
    setRetryCallback(() => callback);
    setRetryInterval(interval);
    setIsErrorVisible(true);
  }, []);

  const hideError = useCallback(() => {
    console.log('✅ Hiding error overlay');
    setIsErrorVisible(false);
  }, []);

  const handleRetry = useCallback(async () => {
    if (retryCallback && typeof retryCallback === 'function') {
      try {
        await retryCallback();
        hideError();
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  }, [retryCallback, hideError]);

  const handleUIStatusChange = useCallback((overlayVisible) => {
    setIsUIDisabled(overlayVisible);
  }, []);

  return {
    isErrorVisible,
    errorType,
    retryInterval,
    showError,
    hideError,
    handleRetry,
    handleUIStatusChange,
    isUIDisabled,
    lastError
  };
};

export default useErrorHandler;
