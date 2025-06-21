import React, { useState } from 'react';
import './App.css';
import ProductFilter from './components/ProductFilter';
import MLPredictions from './components/MLPredictions';
import XXXLChatbot from './components/XXXLChatbot';

function App() {
  const [currentPage, setCurrentPage] = useState('product-filter');
  const [chatMessages, setChatMessages] = useState([]);
  
  // Product Filter state
  const [filterResults, setFilterResults] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [filterCsvData, setFilterCsvData] = useState('');
  
  // ML Predictions state
  const [mlPrediction, setMlPrediction] = useState(null);
  const [mlModelStatus, setMlModelStatus] = useState('');
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');
  const [mlModelCreating, setMlModelCreating] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <nav className="navigation">
          <button 
            className={`nav-button ${currentPage === 'product-filter' ? 'active' : ''}`}
            onClick={() => setCurrentPage('product-filter')}
          >
            Product Filter
          </button>
          <button 
            className={`nav-button ${currentPage === 'ml-predictions' ? 'active' : ''}`}
            onClick={() => setCurrentPage('ml-predictions')}
          >
            ML Sales Predictions
          </button>
          <button 
            className={`nav-button ${currentPage === 'chatbot' ? 'active' : ''}`}
            onClick={() => setCurrentPage('chatbot')}
          >
            XXXL Chatbot
          </button>
        </nav>
      </header>
      
      <div className="content">
        {currentPage === 'product-filter' && (
          <ProductFilter 
            results={filterResults}
            setResults={setFilterResults}
            loading={filterLoading}
            setLoading={setFilterLoading}
            error={filterError}
            setError={setFilterError}
            csvData={filterCsvData}
            setCsvData={setFilterCsvData}
          />
        )}
        {currentPage === 'ml-predictions' && (
          <MLPredictions 
            prediction={mlPrediction}
            setPrediction={setMlPrediction}
            modelStatus={mlModelStatus}
            setModelStatus={setMlModelStatus}
            loading={mlLoading}
            setLoading={setMlLoading}
            error={mlError}
            setError={setMlError}
            modelCreating={mlModelCreating}
            setModelCreating={setMlModelCreating}
          />
        )}
        {currentPage === 'chatbot' && <XXXLChatbot messages={chatMessages} setMessages={setChatMessages} />}
      </div>
    </div>
  );
}

export default App;