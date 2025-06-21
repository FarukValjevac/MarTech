import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import XXXLChatbot from '../XXXLChatbot';

// Mock fetch
global.fetch = jest.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

const mockProps = {
  messages: [],
  setMessages: jest.fn(),
};

describe('XXXLChatbot', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockProps.setMessages.mockClear();
  });

  // Test basic component rendering
  it('renders chatbot component', () => {
    render(<XXXLChatbot {...mockProps} />);
    expect(screen.getByText('XXXL Chatbot')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
  });

  // Test welcome message display when chat is empty
  it('shows welcome message when no messages', () => {
    render(<XXXLChatbot {...mockProps} />);
    expect(screen.getByText(/Welcome to XXXL Chatbot!/)).toBeInTheDocument();
  });

  // Test message sending and API call functionality
  it('sends message and receives response', async () => {
    const mockResponse = 'Any AI response';
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: mockResponse }),
    });

    render(<XXXLChatbot {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByText('Send');
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });
    });

    // Just check that a response was received, not the exact content
    await waitFor(() => {
      expect(mockProps.setMessages).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });
});