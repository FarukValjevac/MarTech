import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MLPredictions from '../MLPredictions';

// Mock fetch
global.fetch = jest.fn();

const mockProps = {
  prediction: null,
  setPrediction: jest.fn(),
  modelStatus: '',
  setModelStatus: jest.fn(),
  loading: false,
  setLoading: jest.fn(),
  error: '',
  setError: jest.fn(),
  modelCreating: false,
  setModelCreating: jest.fn(),
};

describe('MLPredictions', () => {
  beforeEach(() => {
    fetch.mockClear();
    Object.values(mockProps).forEach(mock => {
      if (typeof mock === 'function') mock.mockClear();
    });
  });

  // Test component renders with ML interface elements
  it('renders ML Predictions component', () => {
    render(<MLPredictions {...mockProps} />);
    expect(screen.getByText('ML Sales Predictions')).toBeInTheDocument();
    expect(screen.getByText('Generate Model')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Price (€)')).toBeInTheDocument();
  });

  // Test ML model creation functionality
  it('creates model successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('Model created successfully'),
    });

    render(<MLPredictions {...mockProps} />);
    
    fireEvent.click(screen.getByText('Generate Model'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/ml/create-model', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  // Test sales prediction API call with price input
  it('makes prediction with valid price', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        prediction: { sales: 100, revenue: 250 } 
      }),
    });

    render(<MLPredictions {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText('Product Price (€)'), { target: { value: '2.5' } });
    fireEvent.click(screen.getByText('Predict Sales'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 2.5 }),
      });
    });
  });
});