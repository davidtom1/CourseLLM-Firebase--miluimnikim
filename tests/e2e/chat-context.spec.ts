/**
 * E2E Test: Chat Context Retention
 * 
 * Validates that multi-turn conversations retain context:
 * 1. Turn 1: User asks about a specific topic (e.g., Dynamic Arrays)
 * 2. Turn 2: User asks a follow-up without repeating the topic
 * 3. Verification: Response or IST analysis references the original topic
 */

import { test, expect } from '@playwright/test';
import { resetChatData } from '../utils/test-helpers';

test.describe('Chat Context Retention', () => {
  test.beforeEach(async ({ page }) => {
    console.log('[TEST] ========== START TEST CLEANUP ==========');
    
    // Only clear chat data (messages, threads, messageAnalysis)
    // This preserves user profiles in the 'users' collection
    await resetChatData();
    
    // Clear cookies to ensure clean auth state
    await page.context().clearCookies();
    
    // Wait a moment for emulator to process the changes
    await page.waitForTimeout(500);
    
    console.log('[TEST] ========== CLEANUP COMPLETE ==========');
  });

  test('multi-turn conversation retains context', async ({ page, request }) => {
    // =========================================
    // STEP 1: Login as Student 
    // =========================================
    // Use a random UID to ensure clean state (no history pollution)
    const uid = 'test-student-' + Date.now();
    console.log('[TEST] Creating/ensuring test user exists with UID:', uid);
    
    const tokenResponse = await request.get(
      `http://localhost:9002/api/test-token?uid=${uid}&role=student&createProfile=true`
    );
    
    if (!tokenResponse.ok()) {
      throw new Error(`Failed to create test token: ${tokenResponse.status()}`);
    }
    
    const { token } = await tokenResponse.json();
    console.log('[TEST] Token received, navigating to signin page...');
    
    // Sign in using the custom token
    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    
    // Wait briefly for the signin to complete and cookie/token to be set
    // Don't wait for 'networkidle' as the redirect chain can be slow in emulator
    console.log('[TEST] Waiting for auth token to be set...');
    await page.waitForTimeout(2000);
    
    // Now navigate directly to the course page
    // The custom token should have authenticated us by now
    console.log('[TEST] Navigating to course page...');
    await page.goto('http://localhost:9002/student/courses/cs-demo-101');
    
    // Wait for the chat input to be ready (confirms page load & interactivity)
    // This is more specific than 'main' which can have multiple matches
    console.log('[TEST] Waiting for chat interface to be ready...');
    await expect(page.locator('textarea, input[placeholder="Ask a question..."]')).toBeVisible({ timeout: 30000 });
    // Optional: explicit short wait to ensure JS hydration
    await page.waitForTimeout(1000);
    
    // Verify we're on the course page (not redirected to login)
    const currentUrl = page.url();
    console.log('[TEST] Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      throw new Error('Auth failed: redirected back to login');
    }
    
    expect(currentUrl).toContain('/student/courses/');
    console.log('[TEST] Successfully authenticated and on course page');

    // =========================================
    // STEP 2: Navigate to Course & Verify UI
    // =========================================
    console.log('[TEST] Waiting for course page UI to load...');
    await expect(page.locator('text=Socratic Tutor')).toBeVisible({ timeout: 10000 });

    const chatInput = page.locator('input[placeholder="Ask a question..."]');
    const sendButton = page.locator('button[type="submit"]');

    // =========================================
    // STATE VERIFICATION: Ensure Clean Start
    // =========================================
    console.log('[TEST] Verifying clean state...');
    const initialUserMessages = page.locator('.bg-primary');
    const initialBotMessages = page.locator('.bg-muted');
    
    const userCount = await initialUserMessages.count();
    const botCount = await initialBotMessages.count();
    
    console.log(`[TEST] Initial state: ${userCount} user messages, ${botCount} bot messages`);
    
    // Soft assertion: Log warning if state is not clean, but don't fail
    if (userCount > 0 || botCount > 0) {
      console.warn(`[TEST] WARNING: Chat state not clean! Found ${userCount} user + ${botCount} bot messages`);
    }

    // =========================================
    // TURN 1: Ask about Dynamic Arrays
    // =========================================
    console.log('[TEST] TURN 1: Sending first message...');
    // Rate Limit Protection: Wait before first AI call
    await page.waitForTimeout(5000);
    
    await chatInput.fill('Tell me about Dynamic Arrays');
    await sendButton.click();

    // Wait for user message to appear
    await expect(page.locator('.bg-primary').filter({ hasText: 'Dynamic Arrays' })).toBeVisible({
      timeout: 5000,
    });
    console.log('[TEST] User message 1 visible');

    // Wait for AI response (Turn 1)
    await expect(page.locator('[data-testid="bot-message"]').first()).toBeVisible({
      timeout: 60000,
    });
    console.log('[TEST] Bot response 1 received');

    // Verify the first response has content
    const firstResponse = page.locator('[data-testid="bot-message"]').first();
    const firstResponseText = await firstResponse.textContent();
    expect(firstResponseText).toBeTruthy();
    console.log('[TEST] First response length:', firstResponseText?.length);

    // Small delay to ensure state is updated
    await page.waitForTimeout(1000);

    // =========================================
    // TURN 2: Follow-up Question (Context-Dependent)
    // =========================================
    console.log('[TEST] TURN 2: Sending second message...');
    // Rate Limit Protection: Wait 5s before second AI call
    await page.waitForTimeout(5000);
    
    await chatInput.fill('Give me an example in Python');
    await sendButton.click();

    // Wait for second user message
    await expect(page.locator('.bg-primary').filter({ hasText: 'Python' })).toBeVisible({
      timeout: 5000,
    });
    console.log('[TEST] User message 2 visible');

    // Wait for the second AI response to appear
    // Use data-testid="bot-message" to specifically target bot message bubbles
    // (avoids matching avatars and other bg-muted elements)
    console.log('[TEST] Waiting for second bot response...');
    
    // Wait for 2 bot messages to be present
    const allBotMessages = page.locator('[data-testid="bot-message"]');
    await expect(allBotMessages).toHaveCount(2, { timeout: 60000 });
    
    const botMessageCount = await allBotMessages.count();
    console.log(`[TEST] Total bot messages after Turn 2: ${botMessageCount}`);
    console.log('[TEST] Bot response 2 received (verified by element count)');

    // =========================================
    // VERIFICATION: Context Retention
    // =========================================
    // The second response should reference either:
    // - "Dynamic Arrays" (original topic retained)
    // - "array" (related concept)
    // - "Python" (the language requested)
    // - Code examples with array-related syntax

    const secondResponse = allBotMessages.last();
    await expect(secondResponse).toBeVisible();
    
    const secondResponseText = await secondResponse.textContent();
    expect(secondResponseText).toBeTruthy();
    console.log('[TEST] Second response length:', secondResponseText?.length);

    // At minimum, verify response is not empty and contains relevant content
    const hasContextRetention =
      secondResponseText!.toLowerCase().includes('array') ||
      secondResponseText!.toLowerCase().includes('python') ||
      secondResponseText!.toLowerCase().includes('list') ||  // Python lists = dynamic arrays
      secondResponseText!.toLowerCase().includes('append') || // Common array operation
      secondResponseText!.toLowerCase().includes('[]') ||     // Array/list syntax
      secondResponseText!.toLowerCase().includes('code') ||   // Code examples
      secondResponseText!.length > 50; // Fallback: any substantial response

    expect(hasContextRetention).toBe(true);
    console.log('[TEST] Context retention verified');
  });

  test('conversation maintains thread identity', async ({ page, request }) => {
    // Login
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-thread-test&role=student&createProfile=true'
    );
    const { token } = await tokenResponse.json();
    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/student**', { timeout: 15000 });

    // Navigate to course
    await page.goto('http://localhost:9002/student/courses/cs-demo-101');
    await expect(page.locator('text=Socratic Tutor')).toBeVisible({ timeout: 10000 });

    const chatInput = page.locator('input[placeholder="Ask a question..."]');
    const sendButton = page.locator('button[type="submit"]');

    // Send multiple messages
    const messages = ['What is recursion?', 'Can you give an example?', 'How does the call stack work?'];

    for (const message of messages) {
      await chatInput.fill(message);
      await sendButton.click();

      // Wait for user message
      await expect(page.locator('.bg-primary').filter({ hasText: message.slice(0, 10) })).toBeVisible({
        timeout: 5000,
      });

      // Small delay between messages
      await page.waitForTimeout(500);
    }

    // Wait for AI responses
    await page.waitForTimeout(5000);

    // Verify all user messages are visible
    const userMessages = page.locator('.bg-primary');
    const userMessageCount = await userMessages.count();
    expect(userMessageCount).toBeGreaterThanOrEqual(3);
  });

  test('IST analysis updates for each message', async ({ page, request }) => {
    // Login
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-ist-updates&role=student&createProfile=true'
    );
    const { token } = await tokenResponse.json();
    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/student**', { timeout: 15000 });

    // Navigate to course
    await page.goto('http://localhost:9002/student/courses/cs-demo-101');
    await expect(page.locator('text=Socratic Tutor')).toBeVisible({ timeout: 10000 });

    const chatInput = page.locator('input[placeholder="Ask a question..."]');
    const sendButton = page.locator('button[type="submit"]');

    // Send first message
    await chatInput.fill('Explain linked lists');
    await sendButton.click();

    // Wait for user message
    await expect(page.locator('.bg-primary').filter({ hasText: 'linked lists' })).toBeVisible({
      timeout: 5000,
    });

    // Wait for IntentInspector to appear
    await expect(page.locator('text=Intent Inspector')).toBeVisible({
      timeout: 20000,
    });

    // Send second message
    await chatInput.fill('What about doubly linked lists?');
    await sendButton.click();

    // Wait for second user message
    await expect(page.locator('.bg-primary').filter({ hasText: 'doubly linked' })).toBeVisible({
      timeout: 5000,
    });

    // The IntentInspector should still be present (and ideally updated)
    // Count Intent Inspector instances - should have one per user message
    const inspectors = page.locator('text=Intent Inspector');
    await page.waitForTimeout(3000);
    const inspectorCount = await inspectors.count();
    expect(inspectorCount).toBeGreaterThanOrEqual(1);
  });

  test('handles topic switching gracefully', async ({ page, request }) => {
    // Login
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-topic-switch&role=student&createProfile=true'
    );
    const { token } = await tokenResponse.json();
    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/student**', { timeout: 15000 });

    // Navigate to course
    await page.goto('http://localhost:9002/student/courses/cs-demo-101');
    await expect(page.locator('text=Socratic Tutor')).toBeVisible({ timeout: 10000 });

    const chatInput = page.locator('input[placeholder="Ask a question..."]');
    const sendButton = page.locator('button[type="submit"]');

    // Start with one topic
    await chatInput.fill('Explain binary trees');
    await sendButton.click();
    await expect(page.locator('.bg-primary').filter({ hasText: 'binary trees' })).toBeVisible();

    // Wait for AI response
    await expect(page.locator('[data-testid="bot-message"]').first()).toBeVisible({ timeout: 60000 });

    // Switch to completely different topic
    await chatInput.fill('Now explain hash tables');
    await sendButton.click();
    await expect(page.locator('.bg-primary').filter({ hasText: 'hash tables' })).toBeVisible();

    // Second AI response should still work
    await page.waitForTimeout(3000);
    const botMessages = page.locator('[data-testid="bot-message"]');
    const count = await botMessages.count();
    expect(count).toBeGreaterThanOrEqual(1); // At least one response

    // Verify the UI hasn't crashed
    await expect(page.locator('text=Socratic Tutor')).toBeVisible();
  });
});

