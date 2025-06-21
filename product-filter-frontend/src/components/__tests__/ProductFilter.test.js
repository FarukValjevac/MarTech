import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductFilter from '../ProductFilter';

// Mock fetch
global.fetch = jest.fn();

const mockProps = {
  results: [],
  setResults: jest.fn(),
  loading: false,
  setLoading: jest.fn(),
  error: '',
  setError: jest.fn(),
  csvData: '',
  setCsvData: jest.fn(),
};

describe('ProductFilter', () => {
  beforeEach(() => {
    fetch.mockClear();
    Object.values(mockProps).forEach(mock => {
      if (typeof mock === 'function') mock.mockClear();
    });
  });

  // Test component renders with all required form elements
  it('renders ProductFilter component', () => {
    render(<ProductFilter {...mockProps} />);
    expect(screen.getByText('Product Filter')).toBeInTheDocument();
    expect(screen.getByLabelText('DB Threshold')).toBeInTheDocument();
    expect(screen.getByLabelText('Sold Threshold')).toBeInTheDocument();
  });

  // Test form validation for empty required fields
  it('validates empty fields', async () => {
    render(<ProductFilter {...mockProps} />);
    
    const generateButton = screen.getByText('Generate Filtered Data');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockProps.setError).toHaveBeenCalledWith(
        'Please fill in both DB Threshold and Sold Threshold fields.'
      );
    });
  });

  // Test API call when form is submitted with valid data
  it('makes API call with valid inputs', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('product,db,sold\ntest,7.5,100'),
    });

    render(<ProductFilter {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText('DB Threshold'), { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Sold Threshold'), { target: { value: '50' } });
    fireEvent.click(screen.getByText('Generate Filtered Data'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db: 7, sold: 50 }),
      });
    });
  });
});