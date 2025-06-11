import React, { useState, useEffect } from 'react';
import './App.css';

// Utility function to parse CSV string into an array of objects
const parseCsv = (csvString) => {
  if (!csvString) return [];

  const lines = csvString.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',');
  // Ensure headers are trimmed and handle potential empty lines
  const data = lines.slice(1).filter(line => line.trim() !== '').map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return row;
  });
  return data;
};

function App() {
  const [dbThreshold, setDbThreshold] = useState('');
  const [soldThreshold, setSoldThreshold] = useState('');
  const [csvData, setCsvData] = useState('');
  const [tableData, setTableData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTableData(parseCsv(csvData));
  }, [csvData]);


  const handleGenerate = async () => {
    setCsvData('');
    setTableData([]);
    setError(''); // Clear previous error messages
    setLoading(true);

    // --- NEW: Client-side validation for empty fields ---
    if (!dbThreshold.trim() || !soldThreshold.trim()) {
      setError('Please fill in both DB Threshold and Sold Threshold fields.');
      setLoading(false); // Stop loading animation
      return; // Stop the function here
    }
    // --- END NEW ---

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
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.text();
      setCsvData(data);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Filter</h1>
      </header>
      <div className="center-container">
        <div className="input-group">
          <label htmlFor="dbThreshold">DB Threshold:</label>
          <input
            type="number"
            id="dbThreshold"
            value={dbThreshold}
            onChange={(e) => { setDbThreshold(e.target.value); setError(''); }} // Clear error on change
            placeholder="e.g., 0.5"
          />
        </div>
        <div className="input-group">
          <label htmlFor="soldThreshold">Sold Threshold:</label>
          <input
            type="number"
            id="soldThreshold"
            value={soldThreshold}
            onChange={(e) => { setSoldThreshold(e.target.value); setError(''); }} // Clear error on change
            placeholder="e.g., 10"
          />
        </div>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Filtered Data'}
        </button>

        {error && <p className="error-message">{error}</p>}

        {loading && <p>Loading data...</p>}
        {tableData.length > 0 && !loading && (
          <div className="csv-table-container">
            <h2>Filtered Products:</h2>
            <table className="csv-table">
              <thead>
                <tr>
                  {Object.keys(tableData[0]).map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, colIndex) => (
                      <td key={`${rowIndex}-${colIndex}`}>{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && tableData.length === 0 && csvData && <p>No data found for the given filters.</p>}
      </div>
    </div>
  );
}

export default App;