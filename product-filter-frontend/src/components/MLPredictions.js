import React, { useState } from 'react';

function MLPredictions({ 
  prediction, 
  setPrediction, 
  modelStatus, 
  setModelStatus, 
  loading, 
  setLoading, 
  error, 
  setError, 
  modelCreating, 
  setModelCreating 
}) {
  const [price, setPrice] = useState('');

  const handleCreateModel = async () => {
    setModelCreating(true);
    setModelStatus('');
    setError('');

    try {
      const response = await fetch('http://localhost:3000/ml/create-model', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorData}`);
      }

      setModelStatus('Model created successfully!');
    } catch (err) {
      console.error('Failed to create model:', err);
      setError(`Error creating model: ${err.message}`);
    } finally {
      setModelCreating(false);
    }
  };

  const handlePredict = async () => {
    setError('');
    setPrediction(null);

    // Validation
    if (!price.trim()) {
      setError('Please enter a price');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid positive price');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/ml/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: priceValue }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      if (data.success && data.prediction) {
        setPrediction(data.prediction);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to get prediction:', err);
      setError(`Seems that the model is still not generated. Please generate the model.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header>
        <h1>ML Sales Predictions</h1>
      </header>
      <div className="center-container">
        <div className="ml-section">
          <h2>Model Management</h2>
          <button 
            onClick={handleCreateModel} 
            disabled={modelCreating}
            className="model-button"
          >
            {modelCreating ? 'Creating Model...' : 'Generate Model'}
          </button>
          {modelStatus && <p className="success-message">{modelStatus}</p>}
        </div>

        <div className="ml-section">
          <h2>Sales Prediction</h2>
          <div className="prediction-container">
            <div className="input-group">
              <label htmlFor="price">Product Price (€)</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setError(''); }}
                placeholder="e.g., 2.5"
                step="0.01"
                min="0.01"
              />
            </div>
            <button 
              onClick={handlePredict} 
              disabled={loading || !price.trim()}
              className="predict-button"
            >
              {loading ? 'Predicting...' : 'Predict Sales'}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          {prediction && (
            <div className="prediction-result">
              <h3>Prediction Results</h3>
              {prediction.rawOutput ? (
                <pre className="raw-output">{prediction.rawOutput}</pre>
              ) : (
                <div className="prediction-details">
                  <div className="prediction-item">
                    <span className="label">Price:</span>
                    <span className="value">€{prediction.price?.toFixed(2)}</span>
                  </div>
                  <div className="prediction-item">
                    <span className="label">Predicted Sales:</span>
                    <span className="value">{prediction.sales} units</span>
                  </div>
                  <div className="prediction-item highlight">
                    <span className="label">Expected Revenue:</span>
                    <span className="value">€{prediction.revenue?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MLPredictions;