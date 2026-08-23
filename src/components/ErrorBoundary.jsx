import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      componentStack: '',
      showDetails: false // ✅ Added toggle for showing details
    };
  }

  static getDerivedStateFromError(error) {
    // ✅ Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // ✅ Log the error for debugging
    console.error('❌ Error caught by boundary:', error, errorInfo);
    
    // Extract component stack
    const componentStack = errorInfo?.componentStack || '';
    
    this.setState({
      errorInfo: errorInfo,
      componentStack: componentStack
    });

    // ✅ Log to error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // ✅ Send errors to an error reporting service (Sentry, LogRocket, etc.)
    console.group('🚨 Error Details for Reporting');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
    
    // ✅ You can add Sentry or other error tracking here
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  };

  extractFileInfo = (stack) => {
    if (!stack) return { fileName: 'Unknown', lineNumber: 'Unknown', columnNumber: 'Unknown' };
    
    try {
      // ✅ Extract file path and line number from stack trace
      const stackLines = stack.split('\n');
      if (stackLines.length > 1) {
        const relevantLine = stackLines[1]?.trim() || '';
        const fileMatch = relevantLine.match(/(https?:\/\/[^:]+):(\d+):(\d+)/);
        
        if (fileMatch) {
          const filePath = fileMatch[1];
          const fileName = filePath.split('/').pop() || 'Unknown';
          
          return {
            fileName,
            filePath,
            lineNumber: fileMatch[2] || 'Unknown',
            columnNumber: fileMatch[3] || 'Unknown'
          };
        }
      }
    } catch (e) {
      console.warn('Could not extract file info:', e);
    }
    
    return { fileName: 'Unknown', lineNumber: 'Unknown', columnNumber: 'Unknown' };
  };

  extractComponentName = (componentStack) => {
    if (!componentStack) return 'Unknown Component';
    
    try {
      const firstLine = componentStack.split('\n')[0]?.trim() || '';
      const componentMatch = firstLine.match(/at\s+(\w+)/);
      return componentMatch ? componentMatch[1] : 'Unknown Component';
    } catch {
      return 'Unknown Component';
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  renderErrorDetails = () => {
    const { error, componentStack, showDetails } = this.state;
    if (!error || !showDetails) return null;

    const fileInfo = this.extractFileInfo(error.stack);
    const componentName = this.extractComponentName(componentStack);

    return (
      <details open style={{ 
        marginTop: '1rem', 
        textAlign: 'left',
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '1rem'
      }}>
        <summary style={{ 
          cursor: 'pointer', 
          fontWeight: 'bold', 
          color: '#dc3545',
          userSelect: 'none'
        }}>
          🐛 Technical Error Details
        </summary>
        
        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          {/* Error Message */}
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Error Message:</strong>
            <div style={{ 
              background: '#fff', 
              padding: '0.75rem', 
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              marginTop: '0.25rem',
              fontFamily: 'monospace',
              color: '#dc3545',
              wordBreak: 'break-word'
            }}>
              {error.toString()}
            </div>
          </div>

          {/* Component Information */}
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>Component:</strong>
            <div style={{ 
              background: '#fff', 
              padding: '0.5rem', 
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              marginTop: '0.25rem',
              fontFamily: 'monospace'
            }}>
              {componentName}
            </div>
          </div>

          {/* File Information */}
          <div style={{ marginBottom: '0.75rem' }}>
            <strong>File Location:</strong>
            <div style={{ 
              background: '#fff', 
              padding: '0.5rem', 
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              marginTop: '0.25rem',
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}>
              📁 File: <strong>{fileInfo.fileName}</strong><br />
              📍 Line: <strong>{fileInfo.lineNumber}</strong><br />
              🎯 Column: <strong>{fileInfo.columnNumber}</strong>
            </div>
          </div>

          {/* Stack Trace */}
          {error.stack && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Stack Trace:</strong>
              <pre style={{ 
                background: '#1a1a2e', 
                color: '#e2e8f0',
                padding: '0.75rem',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {error.stack}
              </pre>
            </div>
          )}

          {/* Component Stack */}
          {componentStack && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Component Stack:</strong>
              <pre style={{ 
                background: '#1a1a2e', 
                color: '#e2e8f0',
                padding: '0.75rem',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            maxWidth: '800px',
            width: '100%',
            margin: '0 auto',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Error Icon */}
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚨</div>
            
            <h1 style={{ 
              color: '#dc3545', 
              marginBottom: '0.5rem',
              fontSize: '1.8rem'
            }}>
              Oops! Something went wrong
            </h1>
            
            <p style={{ 
              marginBottom: '0.5rem', 
              fontSize: '1.1rem',
              color: '#333'
            }}>
              We're working on fixing this issue.
            </p>
            
            <p style={{ 
              marginBottom: '2rem', 
              fontSize: '1rem',
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              (Please bear with us while we fix this)
            </p>

            {/* Action Buttons */}
            <div style={{ 
              marginBottom: '1.5rem',
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🔄 Reload Page
              </button>
              
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(220, 53, 69, 0.4)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🗑️ Clear Data & Reload
              </button>
              
              <button 
                onClick={this.toggleDetails}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {this.state.showDetails ? '🔽 Hide Details' : '🔍 Show Technical Details'}
              </button>
            </div>

            {/* Error Details */}
            {this.renderErrorDetails()}

            {/* Support Information */}
            <div style={{ 
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#004085'
            }}>
              <strong>💡 Need help?</strong> If this error persists, please contact support with the error details above.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
