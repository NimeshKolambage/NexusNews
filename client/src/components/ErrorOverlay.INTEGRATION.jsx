/**
 * INTEGRATION GUIDE: Using ErrorOverlay with API Error Detection
 * 
 * This shows how to integrate the new error handling system into your components
 * to automatically detect and handle rateLimited errors with 60-second retries.
 */

import { useEffect, useState } from 'react';
import ErrorOverlay from './components/ErrorOverlay';
import useErrorHandler from './hooks/useErrorHandler';

/**
 * Example 1: AllNews.jsx Integration
 */
export function AllNewsIntegration() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize error handler - includes API interceptor setup
  const { 
    isErrorVisible, 
    errorType, 
    retryInterval,
    showError, 
    hideError, 
    handleRetry,
    handleUIStatusChange,
    isUIDisabled 
  } = useErrorHandler();

  // Your fetch function
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/all-news');
      
      // Check for error structure: {"status":500, "error":{"code":"rateLimited",...}}
      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.error?.code === 'rateLimited') {
          showError(
            'rate-limited-daily',
            () => fetchNews(),
            60 // 60 seconds retry for daily limit
          );
          return;
        }
        
        if (response.status === 500) {
          showError('server-busy', () => fetchNews(), 10);
          return;
        }
      }

      const result = await response.json();
      setData(result.articles || result);
      hideError(); // Auto-hide on success
      
    } catch (error) {
      console.error('Fetch error:', error);
      // API interceptor will handle this and show overlay
      
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className={isUIDisabled ? 'opacity-50 pointer-events-none' : ''}>
      {/* ERROR OVERLAY - Automatically shows on rateLimited error */}
      <ErrorOverlay
        isVisible={isErrorVisible}
        errorType={errorType}
        retryInterval={retryInterval}
        onRetry={handleRetry}
        onClose={hideError}
        onStatusChange={handleUIStatusChange}
      />

      {/* Your normal component content (disabled while overlay active) */}
      {isLoading && <div>Loading...</div>}
      {data && data.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  );
}

/**
 * Example 2: CountryNews.jsx Integration
 */
export function CountryNewsIntegration() {
  const [data, setData] = useState([]);
  const [country, setCountry] = useState('us');
  
  const { 
    isErrorVisible, 
    errorType, 
    retryInterval,
    handleRetry,
    hideError,
    handleUIStatusChange,
    isUIDisabled 
  } = useErrorHandler();

  const fetchCountryNews = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/country/${country}`
      );

      // Check for rate limit error in response body
      const responseData = await response.json();
      
      if (responseData.error?.code === 'rateLimited') {
        // Overlay will show automatically via interceptor
        // But we can also manually trigger it:
        console.log('Rate limit detected in country news');
        return;
      }

      if (response.ok) {
        setData(responseData.articles);
        hideError();
      }

    } catch (error) {
      // Interceptor handles this
      console.error('Country news error:', error);
    }
  };

  useEffect(() => {
    fetchCountryNews();
  }, [country]);

  return (
    <div className={isUIDisabled ? 'opacity-50 pointer-events-none' : ''}>
      <ErrorOverlay
        isVisible={isErrorVisible}
        errorType={errorType}
        retryInterval={retryInterval}
        onRetry={handleRetry}
        onClose={hideError}
        onStatusChange={handleUIStatusChange}
      />

      <select 
        value={country} 
        onChange={(e) => setCountry(e.target.value)}
        disabled={isUIDisabled}
      >
        <option value="us">United States</option>
        <option value="gb">United Kingdom</option>
        <option value="lk">Sri Lanka</option>
      </select>

      {data && data.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  );
}

/**
 * Example 3: App.jsx Root Integration
 * 
 * Add ErrorOverlay at the app root level so it shows globally
 * for all API errors
 */
export function AppIntegration() {
  const { 
    isErrorVisible, 
    errorType, 
    retryInterval,
    handleRetry,
    hideError,
    handleUIStatusChange,
    isUIDisabled 
  } = useErrorHandler();

  return (
    <div className={isUIDisabled ? 'pointer-events-none' : ''}>
      {/* Global Error Overlay */}
      <ErrorOverlay
        isVisible={isErrorVisible}
        errorType={errorType}
        retryInterval={retryInterval}
        onRetry={handleRetry}
        onClose={hideError}
        onStatusChange={handleUIStatusChange}
      />

      {/* Apply opacity to entire app while error is showing */}
      <div className={isUIDisabled ? 'opacity-40' : 'opacity-100'}>
        {/* Your app content here */}
      </div>
    </div>
  );
}

/**
 * INTEGRATION CHECKLIST:
 * 
 * ✅ 1. Import useErrorHandler hook and ErrorOverlay component
 * ✅ 2. Call useErrorHandler() to initialize
 * ✅ 3. Add <ErrorOverlay /> to your JSX
 * ✅ 4. Pass retryInterval prop (60 for daily rate limits)
 * ✅ 5. Wrap component content with isUIDisabled conditionally
 * ✅ 6. API interceptor automatically detects errors
 * 
 * WHAT HAPPENS:
 * 
 * 1. User makes API call → API returns {"status":500, "error":{"code":"rateLimited"}}
 * 2. Interceptor detects error.code === 'rateLimited'
 * 3. ErrorOverlay automatically shows with:
 *    - Title: "Daily Request Limit Reached"
 *    - 60-second retry interval (not 10 seconds)
 *    - UI becomes non-interactive (opacity-50, pointer-events-none)
 * 4. Auto-retry every 60 seconds
 * 5. When API responds with success, overlay auto-hides
 * 6. UI returns to normal
 * 7. Data refreshes automatically
 * 
 * ERROR TYPES SUPPORTED:
 * 
 * - 'connection': Network/offline errors
 * - 'server-busy': HTTP 500 errors
 * - 'rate-limited': HTTP 429 (30s retry)
 * - 'rate-limited-daily': error.code === 'rateLimited' (60s retry) ← New!
 * 
 * CUSTOMIZATION:
 * 
 * Change retry interval: retryInterval={120} for 2 minutes
 * Disable UI when error: className={isUIDisabled ? 'opacity-50' : ''}
 * Refresh data on recovery: Call fetchNews() in handleRetry callback
 * 
 * ERROR RESPONSE FORMAT DETECTED:
 * 
 * {
 *   "status": 500,
 *   "error": {
 *     "code": "rateLimited",  // ← This triggers 'rate-limited-daily' overlay
 *     "message": "Daily Request Limit Reached",
 *     ...
 *   }
 * }
 */
