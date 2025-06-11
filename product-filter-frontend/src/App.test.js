import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; 
import App from './App';

// Mock the global fetch function to prevent actual network requests during tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve('mocked,csv,data\n1,2,3'), // Mock a successful CSV response
  })
);

describe('App Component - Client-Side Validation', () => {

  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  it('should display an error message and not call fetch if input fields are empty', async () => {
    render(<App />);

    const generateButton = screen.getByRole('button', { name: /Generate Filtered Data/i });
    fireEvent.click(generateButton);

    const errorMessage = await screen.findByText(/Please fill in both DB Threshold and Sold Threshold fields./i);
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('error-message'); 
  });
});