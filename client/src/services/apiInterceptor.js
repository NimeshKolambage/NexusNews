import axios from 'axios';

/**
 * API Interceptor for Error Handling
 * 
 * Automatically detects:
 * - error.code === 'rateLimited' → Shows rate-limited-daily overlay with 60s retry
 * - HTTP 500 with "Failed to fetch data" → Shows server-busy overlay
 * - Network errors → Shows connection overlay
 * 
 * Usage:
 * import { setupApiInterceptor } from './services/apiInterceptor';
 * setupApiInterceptor(errorHandlerCallback);
 */

let errorCallback;

export const setupApiInterceptor = (onError) => {
  errorCallback = onError;

  // Response interceptor for error handling
  axios.interceptors.response.use(
    (response) => {
      // Check if response contains error code
      if (response.data?.error?.code === 'rateLimited') {
        console.error('❌ Rate Limited Error Detected');
        onError({
          type: 'rate-limited-daily',
          code: 'rateLimited',
          retryInterval: 60, // 60 seconds for daily rate limit
          response: response.data
        });
        // Don't throw, let caller decide if they want to handle it
      }
      return response;
    },
    (error) => {
      console.error('❌ API Error:', error.response?.status, error.message);

      // Extract error details
      const status = error.response?.status;
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = error.response?.data?.message || error.message;

      // Determine error type
      let errorType = 'connection';
      let retryInterval = 10;

      if (errorCode === 'rateLimited') {
        errorType = 'rate-limited-daily';
        retryInterval = 60;
      } else if (status === 429) {
        errorType = 'rate-limited';
        retryInterval = 30;
      } else if (status === 500) {
        if (errorMessage.includes('Failed to fetch data')) {
          errorType = 'server-busy';
        } else {
          errorType = 'server-busy';
        }
        retryInterval = 10;
      } else if (!navigator.onLine || error.message === 'Network Error') {
        errorType = 'connection';
        retryInterval = 10;
      }

      // Trigger error overlay
      onError?.({
        type: errorType,
        status,
        code: errorCode,
        message: errorMessage,
        retryInterval,
        originalError: error
      });

      return Promise.reject(error);
    }
  );
};

/**
 * Fetch wrapper that handles rateLimited errors
 * Usage: const response = await apiFetch(url);
 */
export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Check if response is JSON and contains error
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();

      // Check for rateLimited error in response body
      if (data?.error?.code === 'rateLimited') {
        console.error('❌ Rate Limited Error Detected');
        errorCallback?.({
          type: 'rate-limited-daily',
          code: 'rateLimited',
          retryInterval: 60,
          response: data
        });
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return { ok: true, status: response.status, data };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    return { ok: true, status: response.status, data: text };

  } catch (error) {
    console.error('❌ Fetch Error:', error.message);

    let errorType = 'connection';
    let retryInterval = 10;

    if (error.message.includes('Failed to fetch')) {
      errorType = 'connection';
    } else if (error.message.includes('429')) {
      errorType = 'rate-limited';
      retryInterval = 30;
    } else if (error.message.includes('500')) {
      errorType = 'server-busy';
      retryInterval = 10;
    }

    errorCallback?.({
      type: errorType,
      message: error.message,
      retryInterval,
      originalError: error
    });

    throw error;
  }
};
