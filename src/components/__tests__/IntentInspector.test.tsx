/**
 * Unit tests for IntentInspector component
 * Tests loading, error, empty, and success states with mocked Firestore
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import IntentInspector from '../IntentInspector';
import type { MessageAnalysis } from '@/shared/types';

// Mock Firebase Firestore
const mockOnSnapshot = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

jest.mock('@/shared/firebase/client', () => ({
  db: { type: 'mock-db' },
}));

// Sample mock data
const mockAnalysis: MessageAnalysis = {
  intent: {
    labels: ['ASK_EXPLANATION', 'ASK_EXAMPLES'],
    primary: 'ASK_EXPLANATION',
    confidence: 0.92,
  },
  skills: {
    items: [
      { id: 'recursion', displayName: 'Recursion', confidence: 0.88, role: 'FOCUS' },
      { id: 'call-stack', displayName: 'Call Stack', confidence: 0.75, role: 'SECONDARY' },
    ],
  },
  trajectory: {
    currentNodes: ['recursion-basics'],
    suggestedNextNodes: [
      { id: 'tree-traversal', reason: 'Natural progression', priority: 1 },
    ],
    status: 'ON_TRACK',
  },
  metadata: {
    processedAt: '2024-01-15T10:00:00Z',
    modelVersion: 'ist-v1',
    threadId: 'test-thread-123',
    messageId: 'test-msg-456',
    uid: 'test-user',
  },
};

describe('IntentInspector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue({ path: 'threads/test-thread/analysis/test-msg' });
  });

  describe('Loading State', () => {
    it('renders loading state initially', () => {
      // Mock onSnapshot to not call callback immediately (simulates loading)
      mockOnSnapshot.mockImplementation(() => {
        // Return unsubscribe function but don't call snapshot callback
        return jest.fn();
      });

      render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      expect(screen.getByText('Intent Inspector')).toBeInTheDocument();
      expect(screen.getByText('Loading analysis...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error state when Firestore returns an error', async () => {
      mockOnSnapshot.mockImplementation((ref, onSuccess, onError) => {
        // Simulate Firestore error
        setTimeout(() => {
          onError({ code: 'permission-denied', message: 'Missing permissions' });
        }, 0);
        return jest.fn();
      });

      render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      await waitFor(() => {
        expect(screen.getByText(/Firestore error:/)).toBeInTheDocument();
      });

      expect(screen.getByText('No analysis available for this message.')).toBeInTheDocument();
    });

    it('renders error state when threadId is missing', () => {
      render(<IntentInspector threadId="" messageId="test-msg" />);

      expect(screen.getByText('Missing threadId or messageId for IntentInspector')).toBeInTheDocument();
    });

    it('renders error state when messageId is missing', () => {
      render(<IntentInspector threadId="test-thread" messageId="" />);

      expect(screen.getByText('Missing threadId or messageId for IntentInspector')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when document does not exist', async () => {
      mockOnSnapshot.mockImplementation((ref, onSuccess) => {
        // Simulate document not existing
        setTimeout(() => {
          onSuccess({ exists: () => false, data: () => null });
        }, 0);
        return jest.fn();
      });

      render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      await waitFor(() => {
        expect(screen.getByText('No analysis available for this message.')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('renders analysis data when document exists', async () => {
      mockOnSnapshot.mockImplementation((ref, onSuccess) => {
        // Simulate successful document fetch
        setTimeout(() => {
          onSuccess({
            exists: () => true,
            data: () => mockAnalysis,
          });
        }, 0);
        return jest.fn();
      });

      render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      await waitFor(() => {
        expect(screen.getByText('Intent Inspector')).toBeInTheDocument();
      });

      // Check primary intent
      expect(screen.getByText(/Primary Intent:/)).toBeInTheDocument();
      expect(screen.getByText(/ASK_EXPLANATION/)).toBeInTheDocument();

      // Check confidence
      expect(screen.getByText(/0.92/)).toBeInTheDocument();

      // Check all intents
      expect(screen.getByText(/All Intents:/)).toBeInTheDocument();
      expect(screen.getByText(/ASK_EXPLANATION, ASK_EXAMPLES/)).toBeInTheDocument();

      // Check skills section
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText(/Recursion/)).toBeInTheDocument();
      expect(screen.getByText(/Call Stack/)).toBeInTheDocument();

      // Check trajectory
      expect(screen.getByText('Trajectory')).toBeInTheDocument();
      expect(screen.getByText(/ON_TRACK/)).toBeInTheDocument();
    });

    it('renders skill roles correctly', async () => {
      mockOnSnapshot.mockImplementation((ref, onSuccess) => {
        setTimeout(() => {
          onSuccess({
            exists: () => true,
            data: () => mockAnalysis,
          });
        }, 0);
        return jest.fn();
      });

      render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      await waitFor(() => {
        expect(screen.getByText(/FOCUS/)).toBeInTheDocument();
        expect(screen.getByText(/SECONDARY/)).toBeInTheDocument();
      });
    });

    it('renders suggested next nodes', async () => {
      mockOnSnapshot.mockImplementation((ref, onSuccess) => {
        setTimeout(() => {
          onSuccess({
            exists: () => true,
            data: () => mockAnalysis,
          });
        }, 0);
        return jest.fn();
      });

      render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      await waitFor(() => {
        expect(screen.getByText('Suggested Next Nodes')).toBeInTheDocument();
        expect(screen.getByText(/tree-traversal/)).toBeInTheDocument();
        expect(screen.getByText(/Natural progression/)).toBeInTheDocument();
      });
    });

    it('renders metadata section', async () => {
      mockOnSnapshot.mockImplementation((ref, onSuccess) => {
        setTimeout(() => {
          onSuccess({
            exists: () => true,
            data: () => mockAnalysis,
          });
        }, 0);
        return jest.fn();
      });

      render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      await waitFor(() => {
        expect(screen.getByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText(/ist-v1/)).toBeInTheDocument();
        expect(screen.getByText(/test-thread-123/)).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes from Firestore on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(<IntentInspector threadId="test-thread" messageId="test-msg" />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

