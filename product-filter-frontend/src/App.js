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

// Function to convert array of objects to CSV string
const arrayToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quotes
      if (value.toString().includes(',') || value.toString().includes('"')) {
        return `"${value.toString().replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

function App() {
  const [dbThreshold, setDbThreshold] = useState('');
  const [soldThreshold, setSoldThreshold] = useState('');
  const [csvData, setCsvData] = useState('');
  const [tableData, setTableData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  useEffect(() => {
    const parsedData = parseCsv(csvData);
    setTableData(parsedData);
    setDisplayData(parsedData);
  }, [csvData]);

  const handleSort = (columnKey) => {
    let direction = 'ascending';
    if (sortConfig.key === columnKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: columnKey, direction });

    const sortedData = [...displayData].sort((a, b) => {
      // Parse values as numbers for db and sold columns
      let aVal = a[columnKey];
      let bVal = b[columnKey];
      
      if (columnKey === 'db' || columnKey === 'sold') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (aVal < bVal) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setDisplayData(sortedData);
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return ''; // No icon when not sorted
    }
    return sortConfig.direction === 'ascending' ? ' ▴' : ' ▾';
  };

  const handleGenerate = async () => {
    setCsvData('');
    setTableData([]);
    setDisplayData([]);
    setSortConfig({ key: null, direction: null });
    setError(''); // Clear previous error messages
    setLoading(true);

    // Client-side validation for empty fields
    if (!dbThreshold.trim() || !soldThreshold.trim()) {
      setError('Please fill in both DB Threshold and Sold Threshold fields.');
      setLoading(false); // Stop loading animation
      return; // Stop the function here
    }

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

  const handleDownloadCSV = () => {
    const csvContent = arrayToCSV(displayData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered_products_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onChange={(e) => { setDbThreshold(e.target.value); setError(''); }}
            placeholder="e.g., 0.5"
          />
        </div>
        <div className="input-group">
          <label htmlFor="soldThreshold">Sold Threshold:</label>
          <input
            type="number"
            id="soldThreshold"
            value={soldThreshold}
            onChange={(e) => { setSoldThreshold(e.target.value); setError(''); }}
            placeholder="e.g., 10"
          />
        </div>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Filtered Data'}
        </button>

        {error && <p className="error-message">{error}</p>}

        {loading && <p>Loading data...</p>}
        {displayData.length > 0 && !loading && (
          <div className="csv-table-container">
            <div className="table-header">
              <h2>Filtered  {displayData.length}  {displayData.length === 1 ? 'Product' : 'Products'}</h2>
              <button className="download-icon-btn" onClick={handleDownloadCSV} title="Download CSV">
                ⬇
              </button>
            </div>
            <div className="results-info">
              {sortConfig.key && (
                <span className="sort-info">
                  {' '}| Sorted by {sortConfig.key} ({sortConfig.direction})
                </span>
              )}
            </div>
            <div className="table-scroll-wrapper">
              <table className="csv-table">
                <thead>
                  <tr>
                    {Object.keys(displayData[0]).map(header => (
                      <th 
                        key={header}
                        className={header === 'db' || header === 'sold' ? 'sortable' : ''}
                        onClick={() => {
                          if (header === 'db' || header === 'sold') {
                            handleSort(header);
                          }
                        }}
                      >
                        {header}
                        {(header === 'db' || header === 'sold') && sortConfig.key === header && (
                          <span>{sortConfig.direction === 'ascending' ? '▴' : '▾'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, colIndex) => (
                        <td key={`${rowIndex}-${colIndex}`}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!loading && displayData.length === 0 && csvData && <p>No data found for the given filters.</p>}
      </div>
    </div>
  );
}

export default App;