import React, { useState } from 'react';
import './App.css';
import ProductFilter from './components/ProductFilter';
import MLPredictions from './components/MLPredictions';
import XXXLChatbot from './components/XXXLChatbot';

function App() {
  const [currentPage, setCurrentPage] = useState('product-filter');
  const [chatMessages, setChatMessages] = useState([]);

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
            ML Predictions
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
        {currentPage === 'product-filter' && <ProductFilter />}
        {currentPage === 'ml-predictions' && <MLPredictions />}
        {currentPage === 'chatbot' && <XXXLChatbot messages={chatMessages} setMessages={setChatMessages} />}
      </div>
    </div>
  );
}

export default App;