// src/pages/SetupDemo.jsx

import React, { useState } from 'react';
import { createDefaultUsers } from '../utils/firebase';

const SetupDemo = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setMessage('Creating demo accounts...');
    
    try {
      const results = await createDefaultUsers();
      setResult(results);
      setMessage('✅ Demo accounts created successfully!');
      
      // Show account details
      console.log('Demo Accounts Created:', results);
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🔧 Setup Demo Accounts</h1>
      <p>This will create demo accounts for testing:</p>
      <ul>
        <li>👑 Admin: codesmartng1@gmail.com / Kb1217@#$%&</li>
        <li>👨‍🏫 Teacher: kabiralkasim6@gmail.com / Kb1217@#$%&</li>
        <li>👨‍🎓 Student: kabiralkasim9@gmail.com / Kb1217@#$%&</li>
      </ul>
      
      <button 
        onClick={handleSetup} 
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Creating...' : '🚀 Create Demo Accounts'}
      </button>
      
      {message && (
        <div style={{ marginTop: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
          {message}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Results:</h3>
          <pre style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#3b82f6' }}>← Back to Login</a>
      </div>
    </div>
  );
};

export default SetupDemo;