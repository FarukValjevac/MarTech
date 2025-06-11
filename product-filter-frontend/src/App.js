import React, { useState } from 'react';
import './App.css'; // Assuming you might have a separate CSS file for App component

function App() {
  const [dbThreshold, setDbThreshold] = useState('');
  const [soldThreshold, setSoldThreshold] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setMessage('');
    setError('');
    try {
      const response = await fetch('http://localhost:3000/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db: parseFloat(dbThreshold),
          sold: parseInt(soldThreshold, 10),
        }),
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.text(); // Assuming your NestJS returns plain text
      setMessage(data);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Filter</h1>
      </header>
      {/* Container for centering */}
      <div className="center-container">
        <div className="input-group">
          <label htmlFor="dbThreshold">DB Threshold:</label>
          <input
            type="number"
            id="dbThreshold"
            value={dbThreshold}
            onChange={(e) => setDbThreshold(e.target.value)}
            placeholder="e.g., 0.5"
          />
        </div>
        <div className="input-group">
          <label htmlFor="soldThreshold">Sold Threshold:</label>
          <input
            type="number"
            id="soldThreshold"
            value={soldThreshold}
            onChange={(e) => setSoldThreshold(e.target.value)}
            placeholder="e.g., 10"
          />
        </div>
        <button onClick={handleGenerate}>Generate Filtered Data</button>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default App;