import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// FIXED: Make sure ErrorBoundary exists at this path, or remove if not needed
import ErrorBoundary from './components/ErrorBoundary.jsx';
// FIXED: Create this file or remove the import
import './index.css';

// ========================================
// DEBUGGING & ENVIRONMENT INFO
// ========================================

// Only show logs in development
const isDevelopment = import.meta.env.MODE === 'development';

if (isDevelopment) {
  console.log('🚀 CodeSmartNG STEM Platform Starting...');
  console.log(`📍 Environment: ${import.meta.env.MODE}`);
  console.log(`📍 Base URL: ${import.meta.env.BASE_URL || '/'}`);
  console.log(`📍 Current URL: ${window.location.href}`);
  console.log(`📍 User Agent: ${navigator.userAgent}`);
}

// ========================================
// LOCAL STORAGE STATUS CHECK
// ========================================

const localStorageStatus = {
  available: typeof localStorage !== 'undefined',
  size: localStorage.length,
  keys: Object.keys(localStorage)
};

if (isDevelopment) {
  console.log('💾 Local Storage Status:', {
    available: localStorageStatus.available ? '✅ Available' : '❌ Not Available',
    items: localStorageStatus.size,
    keys: localStorageStatus.keys.length > 0 ? localStorageStatus.keys : 'Empty'
  });
}

// Check for required storage keys
const requiredKeys = [
  'hausaStem_users',
  'hausaStem_courses',
  'hausaStem_students',
  'hausaStem_currentUser'
];

const missingKeys = requiredKeys.filter(key => !localStorage.getItem(key));
if (isDevelopment && missingKeys.length > 0) {
  console.log('📦 Missing storage keys (will be created on init):', missingKeys);
} else if (isDevelopment) {
  console.log('✅ All required storage keys found');
}

// ========================================
// ROOT ELEMENT CHECK
// ========================================

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    ">
      <div style="
        background: rgba(255,255,255,0.1);
        padding: 40px;
        border-radius: 16px;
        backdrop-filter: blur(10px);
        max-width: 500px;
      ">
        <h1 style="font-size: 3rem; margin: 0;">❌</h1>
        <h2 style="margin: 10px 0;">Root Element Not Found</h2>
        <p style="opacity: 0.8;">Please check your index.html file and make sure there is a div with id="root".</p>
        <button 
          onclick="window.location.reload()"
          style="
            margin-top: 20px;
            padding: 10px 30px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
          "
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  `;
  throw new Error('Root element not found');
}

if (isDevelopment) {
  console.log('✅ Root element found');
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

if (isDevelopment && 'performance' in window && 'getEntriesByType' in performance) {
  const perfEntries = performance.getEntriesByType('navigation');
  if (perfEntries.length > 0) {
    const navTiming = perfEntries[0];
    const loadTime = Math.round(navTiming.loadEventEnd - navTiming.fetchStart);
    const domInteractive = Math.round(navTiming.domInteractive - navTiming.fetchStart);
    console.log(`⏱️ Page Load Time: ${loadTime}ms`);
    console.log(`⏱️ DOM Interactive: ${domInteractive}ms`);
  }
}

// ========================================
// NETWORK STATUS MONITORING
// ========================================

window.addEventListener('offline', () => {
  console.warn('📡 You are offline. Some features may not work.');
});

window.addEventListener('online', () => {
  console.log('📡 You are back online.');
});

if (isDevelopment) {
  console.log(`📡 Network Status: ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}`);
}

// ========================================
// STORAGE USAGE CHECK
// ========================================

const getStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2;
    }
  }
  return total;
};

if (isDevelopment) {
  const storageSize = getStorageSize();
  const storageSizeMB = (storageSize / (1024 * 1024)).toFixed(2);
  console.log(`💾 Storage Usage: ${storageSizeMB} MB`);

  if (storageSize > 5 * 1024 * 1024) {
    console.warn('⚠️ Storage usage is high (>5MB). Consider clearing unused data.');
  }
}

// ========================================
// RENDER APPLICATION
// ========================================

try {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  if (isDevelopment) {
    console.log('✅ React app rendered successfully');
    console.log('🎯 App is ready!');
  }
} catch (error) {
  console.error('❌ Error rendering React app:', error);
  console.error('Error details:', error.stack);
  
  // Display error on page
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
      ">
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 40px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          max-width: 500px;
          width: 100%;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2 style="margin: 0 0 8px 0;">Something Went Wrong</h2>
          <p style="opacity: 0.8; margin: 0 0 16px 0;">
            ${error.message || 'An unexpected error occurred while loading the app.'}
          </p>
          <div style="
            background: rgba(0,0,0,0.2);
            padding: 12px;
            border-radius: 8px;
            text-align: left;
            font-family: monospace;
            font-size: 12px;
            overflow: auto;
            max-height: 150px;
            margin-bottom: 16px;
          ">
            ${error.stack || 'No stack trace available'}
          </div>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button 
              onclick="window.location.reload()"
              style="
                padding: 10px 24px;
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseover="this.style.background='rgba(255,255,255,0.3)'"
              onmouseout="this.style.background='rgba(255,255,255,0.2)'"
            >
              🔄 Refresh
            </button>
            <button 
              onclick="localStorage.clear(); window.location.reload()"
              style="
                padding: 10px 24px;
                background: rgba(239,68,68,0.3);
                color: white;
                border: 1px solid rgba(239,68,68,0.3);
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseover="this.style.background='rgba(239,68,68,0.5)'"
              onmouseout="this.style.background='rgba(239,68,68,0.3)'"
            >
              🗑️ Clear Data & Refresh
            </button>
          </div>
          <p style="opacity: 0.5; font-size: 12px; margin-top: 16px;">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    `;
  }
}

// ========================================
// GLOBAL ERROR HANDLERS
// ========================================

window.addEventListener('error', (event) => {
  console.error('❌ Uncaught error:', event.error || event.message);
  console.error('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  console.error('Rejection details:', {
    reason: event.reason,
    promise: event.promise
  });
});

// ========================================
// LOCAL STORAGE HELPER FOR DEBUGGING
// ========================================

// Expose localStorage helper to console for debugging
window.__debugStorage = () => {
  console.log('=== LOCAL STORAGE DEBUG ===');
  const keys = Object.keys(localStorage);
  console.log(`Total items: ${keys.length}`);
  
  const hausaKeys = keys.filter(key => key.startsWith('hausaStem'));
  console.log('HausaSTEM keys:', hausaKeys);
  
  hausaKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      const parsed = JSON.parse(value);
      console.log(`📦 ${key}:`, parsed);
    } catch {
      console.log(`📦 ${key}:`, localStorage.getItem(key));
    }
  });
  console.log('=== END DEBUG ===');
};

if (isDevelopment) {
  console.log('💡 Tip: Run __debugStorage() in console to view localStorage data');
}

// ========================================
// APP READY
// ========================================

if (isDevelopment) {
  console.log('✅ Main.jsx initialization complete');
  console.log('🎯 CodeSmartNG STEM Platform is ready!');
  console.log(`📦 Data Storage: ${localStorageStatus.available ? 'LocalStorage' : 'Memory'}`);
  console.log(`👤 ${localStorage.getItem('hausaStem_currentUser') ? 'User session found' : 'No active session'}`);
}
