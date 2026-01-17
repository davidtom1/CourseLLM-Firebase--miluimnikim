/**
 * Unit tests for ChatPanel component
 * Tests UI behavior, optimistic updates, and auto-scroll with mocked dependencies
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from '../chat-panel';

// Mock the AI chat function
const mockSocraticCourseChat = jest.fn();
jest.mock('@/features/ai/flows/socratic-course-chat', () => ({
  socraticCourseChat: (...args: unknown[]) => mockSocraticCourseChat(...args),
}));

// Mock the IST analysis function
const mockAnalyzeAndStoreIstForMessage = jest.fn();
jest.mock('@/features/ist/api/chatIst', () => ({
  analyzeAndStoreIstForMessage: (...args: unknown[]) => mockAnalyzeAndStoreIstForMessage(...args),
}));

// Mock the IntentInspector component
jest.mock('@/components/IntentInspector', () => {
  return function MockIntentInspector({ threadId, messageId }: { threadId: string; messageId: string }) {
    return (
      <div data-testid="intent-inspector">
        Intent Inspector: {threadId} / {messageId}
      </div>
    );
  };
});

// Mock scrollTo for auto-scroll tests
const mockScrollTo = jest.fn();

describe('ChatPanel', () => {
  const defaultProps = {
    courseMaterial: 'Sample course material about data structures.',
    courseId: 'test-course-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocraticCourseChat.mockResolvedValue({ response: 'This is a mock AI response.' });
    mockAnalyzeAndStoreIstForMessage.mockResolvedValue({});

    // Mock scrollTo on HTMLElement
    Element.prototype.scrollTo = mockScrollTo;
  });

  describe('Render', () => {
    it('renders chat input and send button', () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('renders Socratic Tutor title', () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByText('Socratic Tutor')).toBeInTheDocument();
    });

    it('renders without courseId prop', () => {
      render(<ChatPanel courseMaterial="Test material" />);

      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
    });
  });

  describe('Input Behavior', () => {
    it('send button is disabled when input is empty', () => {
      render(<ChatPanel {...defaultProps} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('send button is enabled when input has text', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'Hello');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('send button is disabled when input only has whitespace', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, '   ');

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Message Submission', () => {
    it('shows user message immediately after submission (optimistic UI)', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Help me understand recursion');
      await userEvent.click(sendButton);

      // User message should appear immediately
      await waitFor(() => {
        expect(screen.getByText('Help me understand recursion')).toBeInTheDocument();
      });
    });

    it('clears input after submission', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...') as HTMLInputElement;

      await userEvent.type(input, 'Test message');
      expect(input.value).toBe('Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('calls socraticCourseChat with correct parameters', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'What is Big O notation?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockSocraticCourseChat).toHaveBeenCalledWith(
          expect.objectContaining({
            courseMaterial: defaultProps.courseMaterial,
            studentQuestion: 'What is Big O notation?',
            courseId: defaultProps.courseId,
          })
        );
      });
    });

    it('calls analyzeAndStoreIstForMessage for IST analysis', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'Explain arrays');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockAnalyzeAndStoreIstForMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: defaultProps.courseId,
            messageText: 'Explain arrays',
          })
        );
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner during AI response', async () => {
      // Make the AI response slow
      mockSocraticCourseChat.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ response: 'Delayed response' }), 1000))
      );

      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'Test question');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      // Loading spinner should be visible
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
      });
    });

    it('disables input during AI response', async () => {
      mockSocraticCourseChat.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ response: 'Response' }), 500))
      );

      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...') as HTMLInputElement;
      await userEvent.type(input, 'Question');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('AI Response', () => {
    it('displays AI response after loading', async () => {
      mockSocraticCourseChat.mockResolvedValue({
        response: 'Recursion is a technique where a function calls itself.',
      });

      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'What is recursion?');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Recursion is a technique/)).toBeInTheDocument();
      });
    });

    it('displays error message when AI call fails', async () => {
      mockSocraticCourseChat.mockRejectedValue(new Error('API Error'));

      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'Question that fails');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-scroll', () => {
    it('scrolls to bottom when new message is added', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'First message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockScrollTo).toHaveBeenCalled();
      });
    });
  });

  describe('IntentInspector Integration', () => {
    it('renders IntentInspector for user messages with IDs', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'Test with IST');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('intent-inspector')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits on Enter key', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      await userEvent.type(input, 'Question via Enter{enter}');

      await waitFor(() => {
        expect(mockSocraticCourseChat).toHaveBeenCalled();
      });
    });

    it('does not submit empty form on Enter', async () => {
      render(<ChatPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Ask a question...');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockSocraticCourseChat).not.toHaveBeenCalled();
    });
  });
});

