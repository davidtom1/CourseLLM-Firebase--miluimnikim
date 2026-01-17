/**
 * E2E Test: Teacher Analytics
 * 
 * Validates:
 * 1. Teacher login via Mock Teacher
 * 2. Role-based access control (RBAC) - teacher cannot access student routes
 * 3. Dashboard access
 * 4. IST Report generation
 * 5. Data rendering in reports
 */

import { test, expect } from '@playwright/test';
import { resetFirestoreEmulator } from '../utils/test-helpers';

test.describe('Teacher Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Clear state to prevent pollution between tests
    await page.context().clearCookies();
    await resetFirestoreEmulator();
  });

  test('teacher login and dashboard access', async ({ page, request }) => {
    // =========================================
    // STEP 1: Login via Mock Teacher
    // =========================================
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-teacher-analytics&role=teacher&createProfile=true'
    );
    expect(tokenResponse.ok()).toBeTruthy();
    
    const { token } = await tokenResponse.json();
    expect(token).toBeTruthy();

    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);

    // Wait for redirect to teacher area
    await page.waitForURL('**/teacher**', { timeout: 15000 });
    
    // Verify we're in the teacher section
    expect(page.url()).toContain('/teacher');

    // =========================================
    // STEP 2: Verify Dashboard Content
    // =========================================
    // Should see Analytics Overview heading
    await expect(page.locator('text=Analytics Overview')).toBeVisible({ timeout: 10000 });

    // Should see dashboard cards
    await expect(page.locator('text=Total Students')).toBeVisible();
    await expect(page.locator('text=At-Risk Students')).toBeVisible();
    await expect(page.locator('text=Most Practiced Topic')).toBeVisible();

    // Should see the analytics chart section
    await expect(page.locator('text=Average Mastery Level per Topic')).toBeVisible();
  });

  test('RBAC - teacher blocked from student routes', async ({ page, request }) => {
    // =========================================
    // Login as Teacher
    // =========================================
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-teacher-rbac&role=teacher&createProfile=true'
    );
    const { token } = await tokenResponse.json();

    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/teacher**', { timeout: 15000 });

    // =========================================
    // Attempt to Access Student Route
    // =========================================
    await page.goto('http://localhost:9002/student');

    // Should be redirected back to teacher area (not allowed in student section)
    await page.waitForURL('**/teacher**', { timeout: 10000 });
    
    // Verify we're still in teacher section
    expect(page.url()).toContain('/teacher');
    expect(page.url()).not.toContain('/student');
  });

  test('generate IST class report with data', async ({ page, request }) => {
    // =========================================
    // STEP 1: Login as Teacher
    // =========================================
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-teacher-report&role=teacher&createProfile=true'
    );
    const { token } = await tokenResponse.json();

    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/teacher**', { timeout: 15000 });

    // =========================================
    // STEP 2: Navigate to Course Management
    // =========================================
    await page.goto('http://localhost:9002/teacher/courses/cs-demo-101');

    // Wait for page to load
    await expect(page.locator('text=IST Class Report')).toBeVisible({ timeout: 10000 });

    // =========================================
    // STEP 3: Generate Report
    // =========================================
    const generateButton = page.locator('button', { hasText: 'Generate IST Class Report' });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();

    await generateButton.click();

    // =========================================
    // STEP 4: Verify Report Renders with Data
    // =========================================
    // Wait for report generation (may take a moment to process)
    // Should see Executive Summary section
    await expect(page.locator('text=Executive Summary')).toBeVisible({ timeout: 15000 });

    // Should NOT see "No IST events found" (empty state)
    // This mock data file exists and has events for cs-demo-101
    await expect(page.locator('text=No IST events found')).not.toBeVisible({ timeout: 2000 });

    // Verify some data is rendered
    await expect(page.locator('text=Total events')).toBeVisible();
    await expect(page.locator('text=Unique skills')).toBeVisible();

    // Verify Top Skills section exists
    await expect(page.locator('text=Top skills')).toBeVisible();
  });

  test('report shows trends section', async ({ page, request }) => {
    // Login as teacher
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-teacher-trends&role=teacher&createProfile=true'
    );
    const { token } = await tokenResponse.json();

    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/teacher**', { timeout: 15000 });

    // Navigate to course
    await page.goto('http://localhost:9002/teacher/courses/cs-demo-101');
    await expect(page.locator('text=IST Class Report')).toBeVisible({ timeout: 10000 });

    // Generate report
    await page.click('button:has-text("Generate IST Class Report")');

    // Wait for trends section
    await expect(page.locator('text=Trends')).toBeVisible({ timeout: 15000 });

    // Check for trend indicators
    await expect(page.locator('text=Last 7 days')).toBeVisible();
    await expect(page.locator('text=Prev 7 days')).toBeVisible();
  });

  test('report shows data quality metrics', async ({ page, request }) => {
    // Login as teacher
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-teacher-quality&role=teacher&createProfile=true'
    );
    const { token } = await tokenResponse.json();

    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/teacher**', { timeout: 15000 });

    // Navigate to course
    await page.goto('http://localhost:9002/teacher/courses/cs-demo-101');

    // Generate report
    await page.click('button:has-text("Generate IST Class Report")');

    // Wait for data quality section
    await expect(page.locator('text=Data quality')).toBeVisible({ timeout: 15000 });

    // Check for quality metrics
    await expect(page.locator('text=Events missing skills field')).toBeVisible();
  });

  test('teacher can access materials management', async ({ page, request }) => {
    // Login as teacher
    const tokenResponse = await request.get(
      'http://localhost:9002/api/test-token?uid=e2e-teacher-materials&role=teacher&createProfile=true'
    );
    const { token } = await tokenResponse.json();

    await page.goto(`http://localhost:9002/test/signin?token=${encodeURIComponent(token)}`);
    await page.waitForURL('**/teacher**', { timeout: 15000 });

    // Navigate to materials page
    await page.goto('http://localhost:9002/teacher/materials');

    // Verify materials page loads (even if it shows placeholder content)
    await page.waitForLoadState('networkidle');
    
    // Should be on materials page
    expect(page.url()).toContain('/teacher/materials');
  });
});

