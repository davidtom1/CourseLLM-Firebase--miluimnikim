/**
 * E2E Test: Student Journey
 * 
 * Validates the complete student flow:
 * 1. Auth bypass via Mock Student
 * 2. Course navigation
 * 3. Socratic Chat interaction
 * 4. AI Response display
 * 5. IST (IntentInspector) update
 */

import { test, expect } from '@playwright/test';
import { resetFirestoreEmulator } from '../utils/test-helpers';

test.describe('Student Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start fresh - clear cookies and Firestore state
    await page.context().clearCookies();
    await resetFirestoreEmulator();
  });

  test('complete chat flow with IST analysis', async ({ page, request }) => {
    // =========================================
    // STEP 1: Login via Mock Student
    // =========================================
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-student-journey&role=student&createProfile=true'
    );
    expect(tokenResponse.ok()).toBeTruthy();
    
    const { token } = await tokenResponse.json();
    expect(token).toBeTruthy();

    // Navigate to test signin with token
    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);

    // Wait for redirect to student area
    await page.waitForURL('**/student**', { timeout: 15000 });
    
    // Verify we're in the student section
    expect(page.url()).toContain('/student');

    // =========================================
    // STEP 2: Navigate to Course
    // =========================================
    await page.goto('http://localhost:9002/student/courses/cs-demo-101');
    
    // Wait for course page to load
    await expect(page.locator('text=Data Structures & Algorithms')).toBeVisible({ timeout: 10000 });
    
    // Verify chat panel is present
    await expect(page.locator('text=Socratic Tutor')).toBeVisible();

    // =========================================
    // STEP 3: Send a Message
    // =========================================
    const chatInput = page.locator('input[placeholder="Ask a question..."]');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();

    // Rate Limit Protection: Wait 5s before triggering AI call
    // This ensures we stay under Gemini Free Tier limit (~15 RPM)
    await page.waitForTimeout(5000);

    // Type the message
    await chatInput.fill('Help me understand recursion');
    
    // Find and click send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // =========================================
    // STEP 4: Verify Optimistic UI Update
    // =========================================
    // User message should appear immediately (optimistic update)
    await expect(page.locator('.bg-primary').filter({ hasText: 'recursion' })).toBeVisible({
      timeout: 5000,
    });

    // =========================================
    // STEP 5: Wait for AI Response
    // =========================================
    // AI response should appear (this may take some time)
    // Look for a new bot message (bg-muted class)
    await expect(page.locator('.bg-muted').last()).toBeVisible({
      timeout: 60000, // Allow up to 60s for AI response
    });

    // Verify the response contains some text (not empty)
    const botResponse = page.locator('.bg-muted').last();
    await expect(botResponse).not.toBeEmpty();

    // =========================================
    // STEP 6: Verify IntentInspector
    // =========================================
    // The IntentInspector should be visible and contain Skills section
    // Note: This depends on the IST service being available
    await expect(page.locator('text=Intent Inspector')).toBeVisible({
      timeout: 15000,
    });

    // Check for Skills section (indicates successful IST analysis)
    await expect(page.locator('text=Skills')).toBeVisible({
      timeout: 10000,
    });
  });

  test('handles chat input validation', async ({ page, request }) => {
    // Login
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-student-validation&role=student&createProfile=true'
    );
    const { token } = await tokenResponse.json();
    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/student**', { timeout: 15000 });

    // Navigate to course
    await page.goto('http://localhost:9002/student/courses/cs101');
    await expect(page.locator('text=Socratic Tutor')).toBeVisible({ timeout: 10000 });

    // Verify send button is disabled with empty input
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeDisabled();

    // Type whitespace only - button should still be disabled
    const chatInput = page.locator('input[placeholder="Ask a question..."]');
    await chatInput.fill('   ');
    await expect(sendButton).toBeDisabled();

    // Type valid text - button should be enabled
    await chatInput.fill('Valid question');
    await expect(sendButton).toBeEnabled();
  });

  test('displays course materials', async ({ page, request }) => {
    // Login
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-student-materials&role=student&createProfile=true'
    );
    const { token } = await tokenResponse.json();
    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/student**', { timeout: 15000 });

    // Navigate to course
    await page.goto('http://localhost:9002/student/courses/cs-demo-101');

    // Verify course materials section is visible
    await expect(page.locator('text=Course Materials')).toBeVisible({ timeout: 10000 });

    // Verify at least one material is listed
    await expect(page.locator('text=Module 1')).toBeVisible();
  });
});

