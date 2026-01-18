import '@testing-library/jest-dom';

// --- 0. Suppress known act() warnings from Radix UI and async components ---
// These warnings occur because:
// 1. Radix ScrollArea triggers state updates in refs
// 2. ChatPanel has async message handling (startTransition + IST analysis)
// React Testing Library cannot wrap these in act(). This is a known limitation.
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  // Suppress act() warnings for known async-heavy components
  if (
    typeof message === 'string' &&
    message.includes('not wrapped in act(...)') &&
    (
      message.includes('ScrollArea') ||
      message.includes('ChatPanel') ||
      args.some(a => typeof a === 'string' && (a.includes('scroll-area') || a.includes('chat-panel')))
    )
  ) {
    return; // Suppress this specific warning
  }
  originalConsoleError(...args);
};

// --- 1. Fix Radix UI Dependencies (Critical for ScrollArea) ---

// JSDOM lacks ResizeObserver, causing infinite render loops in Radix primitives
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    // Mock implementation - no-op for tests
  }
  unobserve() { }
  disconnect() { }
};

// Mock Pointer Capture methods (Required by Radix ScrollArea/Slider)
window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();
window.HTMLElement.prototype.hasPointerCapture = jest.fn(() => false);
window.HTMLElement.prototype.setPointerCapture = jest.fn();

// --- 2. Global Environment Mocks ---

// Mock window.scrollTo (Fixes ChatPanel auto-scroll logic tests)
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

// Mock matchMedia (Required by many Shadcn/UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

console.log('✅ CourseLLM Test Environment Loaded');
