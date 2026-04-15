# 🚨 API Rate Limited Error Handling - Complete Setup

## Overview

Complete solution for detecting and handling `error.code === 'rateLimited'` errors from your API with automatic overlay display, 60-second auto-retry, and UI disabling.

## What It Does

When your API returns:
```json
{
  "status": 500,
  "error": {
    "code": "rateLimited",
    "message": "Daily Request Limit Reached"
  }
}
```

The system automatically:
1. ✅ Detects the `error.code === 'rateLimited'` in the response
2. ✅ Shows a full-screen "Daily Request Limit Reached" overlay
3. ✅ Disables UI interaction (pointer-events-none, opacity-50)
4. ✅ Auto-retries every 60 seconds (not 10 seconds)
5. ✅ Shows countdown timer and retry attempts
6. ✅ Auto-hides the overlay when API recovers
7. ✅ Automatically refreshes data on recovery

## Files Created

### 1. `ErrorOverlay.jsx` (UPDATED)
**Location**: `client/src/components/ErrorOverlay.jsx`

**New Props**:
- `retryInterval`: Number of seconds between auto-retries (60 for rate-limited-daily)
- `onStatusChange`: Callback function to disable/enable UI

**New Error Type**:
- `'rate-limited-daily'`: Specifically for `error.code === 'rateLimited'`

```javascript
<ErrorOverlay
  isVisible={isErrorVisible}
  errorType="rate-limited-daily"  // New type
  retryInterval={60}              // 60 seconds for daily rate limits
  onRetry={handleRetry}
  onClose={hideError}
  onStatusChange={handleUIStatusChange}  // Disables UI while active
/>
```

### 2. `apiInterceptor.js` (NEW)
**Location**: `client/src/services/apiInterceptor.js`

**Features**:
- Axios interceptor for global error handling
- Auto-detects `error.code === 'rateLimited'`
- Detects HTTP 429, 500, network errors
- Provides fetch wrapper function for non-axios calls

**Usage**:
```javascript
// In your App.jsx or index.js
import { setupApiInterceptor } from './services/apiInterceptor';

const handleApiError = (errorInfo) => {
  console.log('API Error:', errorInfo.type, errorInfo.code);
  // Dispatch to Redux, show overlay, etc.
};

setupApiInterceptor(handleApiError);
```

### 3. `useErrorHandler.js` (NEW)
**Location**: `client/src/hooks/useErrorHandler.js`

**Custom Hook** that combines:
- Error state management
- API interceptor setup
- UI disable/enable logic
- Auto-retry callback management

**Usage**:
```javascript
const { 
  isErrorVisible,           // Show/hide overlay
  errorType,                // 'rate-limited-daily', etc
  retryInterval,            // 60 for daily limits
  handleRetry,              // Trigger retry
  hideError,                // Close overlay
  handleUIStatusChange,     // Disable UI
  isUIDisabled              // Current UI state
} = useErrorHandler();
```

## Quick Integration (3 Steps)

### Step 1: Import at App Root
```javascript
// App.jsx
import ErrorOverlay from './components/ErrorOverlay';
import useErrorHandler from './hooks/useErrorHandler';

export default function App() {
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
    <div>
      {/* Global Error Overlay */}
      <ErrorOverlay
        isVisible={isErrorVisible}
        errorType={errorType}
        retryInterval={retryInterval}
        onRetry={handleRetry}
        onClose={hideError}
        onStatusChange={handleUIStatusChange}
      />

      {/* Disable UI while overlay active */}
      <div className={isUIDisabled ? 'opacity-50 pointer-events-none' : ''}>
        {/* Your app content */}
      </div>
    </div>
  );
}
```

### Step 2: Use in Your Components
```javascript
// AllNews.jsx
const fetchNews = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/all-news');
    const data = await response.json();
    
    // Check for rate limited error
    if (data.error?.code === 'rateLimited') {
      showError('rate-limited-daily', () => fetchNews(), 60);
      return;
    }
    
    setData(data);
    hideError();
  } catch (error) {
    // Interceptor handles this
  }
};
```

### Step 3: Done! ✅
- API interceptor is active
- Errors automatically trigger overlays
- UI is disabled during errors
- Auto-retries every 60 seconds for rate limits

## How It Works

```
┌─ API Call ─────────────────────────────────────────────┐
│                                                          │
│  ┌─ Response ─────────────────────────────────────────┐ │
│  │ HTTP 500: {                                         │ │
│  │   "error": {                                        │ │
│  │     "code": "rateLimited"  ← Detected by interceptor│ │
│  │   }                                                 │ │
│  │ }                                                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ↓ Interceptor detects error.code === 'rateLimited'     │
│                                                          │
│  ↓ Calls useErrorHandler callback                       │
│                                                          │
│  ┌─ ErrorOverlay Shows ───────────────────────────────┐ │
│  │                                                     │ │
│  │  📊 Daily Request Limit Reached                    │ │
│  │  Retrying to connect automatically...              │ │
│  │                                                     │ │
│  │  Next retry in: 60 ← Auto-retry timer              │ │
│  │                                                     │ │
│  │  [Retry Now] [Dismiss]                             │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                      │                                    │
│                      ↓ (Every 60 seconds)                 │
│              Auto-retry API call                          │
│                      │                                    │
│            ┌─────────┴─────────┐                         │
│            ↓ (Success)         ↓ (Fail)                  │
│      Overlay auto-hides    Keep retrying                │
│      Data refreshes        (Retry counter++)             │
│      UI re-enabled                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Error Response Formats Supported

### Format 1: Error Code in Response
```json
{
  "status": 500,
  "error": {
    "code": "rateLimited",
    "message": "Daily Request Limit Reached"
  }
}
```
→ Triggers `'rate-limited-daily'` overlay with 60s retry

### Format 2: HTTP 429
```
HTTP 429 (Too Many Requests)
```
→ Triggers `'rate-limited'` overlay with 30s retry

### Format 3: HTTP 500
```
HTTP 500 (Internal Server Error)
```
→ Triggers `'server-busy'` overlay with 10s retry

### Format 4: Network Error
```
Network disconnection / Offline
```
→ Triggers `'connection'` overlay with 10s retry

## Customization

### Change Retry Interval
```javascript
// For different error types
showError('rate-limited-daily', fetchFunction, 120); // 2 minutes
showError('rate-limited', fetchFunction, 45);         // 45 seconds
```

### Add Custom Error Messages
Edit `ErrorOverlay.jsx` lines 61-75:
```javascript
'rate-limited-daily': {
  title: '📊 Daily Request Limit Reached',
  message: 'Your custom message here...',
  icon: '📈',
  color: 'from-indigo-500 to-purple-500'
}
```

### Change UI Disable Style
```javascript
{/* Option 1: Fade out */}
<div className={isUIDisabled ? 'opacity-50' : ''}>

{/* Option 2: Blur */}
<div className={isUIDisabled ? 'blur-sm' : ''}>

{/* Option 3: Grayscale */}
<div className={isUIDisabled ? 'grayscale' : ''}>
```

## Testing

### Test Auto-Detection
```javascript
// Simulate error response
const mockError = {
  status: 500,
  error: { code: 'rateLimited' }
};

// In component, fetch and get this response
```

### Test Retry Logic
1. Click any error button to show overlay
2. Watch countdown: 60, 59, 58...
3. Watch "Retry attempts: X" increase each 60 seconds
4. Click "Retry Now" for immediate retry

### Test UI Disabling
1. Show overlay
2. Try to click buttons in background
3. Should see `pointer-events-none` preventing clicks
4. Should see `opacity-50` making content faded

### Test Auto-Dismiss
1. Show overlay
2. Wait for auto-retry to succeed
3. Overlay automatically closes

## Browser Console Output

```
❌ API Error: 500 'rateLimited'
🚨 Error Handler: { type: 'rate-limited-daily', retryInterval: 60, ... }
❌ Showing rate-limited-daily error overlay
📊 Daily Request Limit Reached
💤 Next retry in: 60s

🔄 Auto-retry attempt #1...
🔄 Auto-retry attempt #2...
✅ Hiding error overlay
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Overlay doesn't appear | Check `isErrorVisible={isErrorVisible}` prop |
| UI doesn't disable | Check `onStatusChange={handleUIStatusChange}` prop and wrapper classNames |
| Auto-retry not triggering | Check `setInterval` is running (look for console logs) |
| 60s retry feels slow | Change `retryInterval` prop or `CACHE_DURATION` fallback |
| Overlay stuck | Click "Dismiss" button or check browser console for errors |

## Integration Checklist

- [ ] Import `useErrorHandler` hook
- [ ] Import `ErrorOverlay` component
- [ ] Initialize hook in component
- [ ] Add `<ErrorOverlay />` to JSX
- [ ] Pass all required props (isVisible, errorType, retryInterval, etc)
- [ ] Wrap UI content with `isUIDisabled` class
- [ ] Test with API that returns `error.code === 'rateLimited'`
- [ ] Verify 60-second retry interval
- [ ] Verify UI disabling works
- [ ] Verify auto-hide on success

## Files & Locations

```
client/src/
├── components/
│   ├── ErrorOverlay.jsx ← Main component (UPDATED)
│   ├── ErrorOverlay.INTEGRATION.jsx ← Usage examples
│   └── ErrorOverlay.README.md ← Original docs
├── services/
│   └── apiInterceptor.js ← Axios interceptor (NEW)
├── hooks/
│   └── useErrorHandler.js ← Error state hook (NEW)
│   └── useConnectionErrorHandler.js ← Old hook (deprecated)
└── App.jsx ← Root component (needs ErrorOverlay import)
```

## Next Steps

1. ✅ Import `useErrorHandler` in App.jsx
2. ✅ Add `<ErrorOverlay />` to your JSX
3. ✅ Wrap UI with `isUIDisabled` class
4. ✅ Test with real API that returns rateLimited error
5. ✅ Customize error message/colors if needed
6. ✅ Deploy and monitor

---

**Version**: 2.0 (With rateLimited error detection)  
**Status**: ✅ Production Ready  
**Last Updated**: April 16, 2026
