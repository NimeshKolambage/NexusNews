import { useState, useCallback } from 'react';

/**
 * Custom hook for handling connection errors with auto-retry
 * Returns state and handlers for use with ErrorOverlay component
 * 
 * Usage:
 * const { showError, hideError, isErrorVisible, errorType, handleRetry } = useConnectionErrorHandler();
 * 
 * // In your fetch logic:
 * } catch (error) {
 *   if (error.response?.status === 500 || error.response?.status === 429) {
 *     showError(error.response.status === 429 ? 'rate-limited' : 'server-busy');
 *   } else {
 *     showError('connection');
 *   }
 * }
 */
export const useConnectionErrorHandler = () => {
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [errorType, setErrorType] = useState('connection');
  const [retryCallback, setRetryCallback] = useState(null);

  const showError = useCallback((type = 'connection', callback = null) => {
    console.log(`❌ Showing ${type} error overlay`);
    setErrorType(type);
    setRetryCallback(() => callback);
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

  return {
    isErrorVisible,
    errorType,
    showError,
    hideError,
    handleRetry
  };
};

export default useConnectionErrorHandler;
