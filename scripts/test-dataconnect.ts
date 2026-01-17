/**
 * Data Connect Validation Test Script
 *
 * This script tests that Data Connect is properly configured and working
 * with the Firebase emulator.
 *
 * Prerequisites:
 * 1. Firebase emulators must be running: `firebase emulators:start`
 * 2. Data Connect SDK must be generated: `npm run dataconnect:generate`
 *
 * Usage:
 *   npx tsx scripts/test-dataconnect.ts
 *
 * Expected output:
 *   - Tests for IST event creation and querying
 *   - Validates schema matches expected structure
 *   - Reports success/failure for each test
 */

import { initializeApp } from "firebase/app";
import {
  getDataConnect,
  connectDataConnectEmulator,
  executeQuery,
  executeMutation,
} from "firebase/data-connect";
import {
  connectorConfig,
  istEventsByUserAndCourseRef,
  createIstEventRef,
} from "@dataconnect/generated";

// Test configuration
const TEST_USER_ID = "test-user-" + Date.now();
const TEST_COURSE_ID = "test-course-cs101";
const TEST_THREAD_ID = "test-thread-" + Date.now();
const TEST_MESSAGE_ID = "test-message-" + Date.now();

// Results tracking
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

// Initialize Firebase and Data Connect
function initDataConnect() {
  const app = initializeApp(
    {
      projectId: "coursewise-f2421",
      apiKey: "demo-api-key",
      authDomain: "coursewise-f2421.firebaseapp.com",
    },
    "dataconnect-test"
  );

  const dc = getDataConnect(app, connectorConfig);

  // Connect to emulator
  connectDataConnectEmulator(dc, "127.0.0.1", 9400, false);
  console.log("✓ Connected to Data Connect emulator at 127.0.0.1:9400\n");

  return dc;
}

// Test helper
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`✓ PASS: ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      passed: false,
      error: errorMsg,
      duration: Date.now() - start,
    });
    console.log(`✗ FAIL: ${name}`);
    console.log(`  Error: ${errorMsg}\n`);
  }
}

// Assertion helpers
function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(`${message}: value is undefined or null`);
  }
  return value;
}

function assertArrayLength(arr: unknown[], minLength: number, message: string): void {
  if (arr.length < minLength) {
    throw new Error(`${message}: expected at least ${minLength} items, got ${arr.length}`);
  }
}

// ============================================================================
// Test Cases
// ============================================================================

async function testCreateIstEvent(
  dc: ReturnType<typeof getDataConnect>
): Promise<void> {
  const ref = createIstEventRef(dc, {
    userId: TEST_USER_ID,
    courseId: TEST_COURSE_ID,
    threadId: TEST_THREAD_ID,
    messageId: TEST_MESSAGE_ID,
    utterance: "How do I implement a binary search tree?",
    intent: "CLARIFICATION",
    skills: ["binary search trees", "data structures", "algorithms"],
    trajectory: ["understand BST basics", "implement insert", "implement search"],
  });

  const result = await executeMutation(ref);

  // Mutation should succeed
  assertDefined(result, "Mutation result should not be null");
  console.log("  Created IST event successfully");
}

async function testQueryIstEvents(
  dc: ReturnType<typeof getDataConnect>
): Promise<void> {
  const ref = istEventsByUserAndCourseRef(dc, {
    userId: TEST_USER_ID,
    courseId: TEST_COURSE_ID,
  });

  const result = await executeQuery(ref);

  // Query should return array
  assertDefined(result.data, "Query result data should not be null");
  assertDefined(result.data.istEvents, "istEvents array should exist");
  assertArrayLength(result.data.istEvents, 1, "Should have at least 1 event");

  // Verify event structure
  const event = result.data.istEvents[0];
  assertEqual(event.userId, TEST_USER_ID, "userId should match");
  assertEqual(event.courseId, TEST_COURSE_ID, "courseId should match");
  assertEqual(event.threadId, TEST_THREAD_ID, "threadId should match");
  assertEqual(event.messageId, TEST_MESSAGE_ID, "messageId should match");
  assertDefined(event.utterance, "utterance should exist");
  assertDefined(event.intent, "intent should exist");
  assertDefined(event.createdAt, "createdAt should exist");

  console.log(`  Retrieved ${result.data.istEvents.length} event(s)`);
  console.log(`  Event ID: ${event.id}`);
  console.log(`  Intent: ${event.intent}`);
}

async function testEmptyQuery(
  dc: ReturnType<typeof getDataConnect>
): Promise<void> {
  const ref = istEventsByUserAndCourseRef(dc, {
    userId: "nonexistent-user-" + Date.now(),
    courseId: "nonexistent-course",
  });

  const result = await executeQuery(ref);

  // Query should return empty array, not error
  assertDefined(result.data, "Query result data should not be null");
  assertDefined(result.data.istEvents, "istEvents array should exist");
  assertEqual(result.data.istEvents.length, 0, "Should return empty array");

  console.log("  Empty query returned empty array (correct behavior)");
}

async function testMultipleEvents(
  dc: ReturnType<typeof getDataConnect>
): Promise<void> {
  // Create multiple events
  const events = [
    {
      userId: TEST_USER_ID,
      courseId: TEST_COURSE_ID,
      threadId: TEST_THREAD_ID + "-multi",
      messageId: TEST_MESSAGE_ID + "-1",
      utterance: "What is recursion?",
      intent: "CONCEPT_INQUIRY",
      skills: ["recursion", "functions"],
      trajectory: ["understand base case"],
    },
    {
      userId: TEST_USER_ID,
      courseId: TEST_COURSE_ID,
      threadId: TEST_THREAD_ID + "-multi",
      messageId: TEST_MESSAGE_ID + "-2",
      utterance: "Can you show me an example?",
      intent: "EXAMPLE_REQUEST",
      skills: ["recursion", "practice"],
      trajectory: ["see example", "try implementation"],
    },
  ];

  for (const eventData of events) {
    const ref = createIstEventRef(dc, eventData);
    await executeMutation(ref);
  }

  // Query all events
  const queryRef = istEventsByUserAndCourseRef(dc, {
    userId: TEST_USER_ID,
    courseId: TEST_COURSE_ID,
  });
  const result = await executeQuery(queryRef);

  // Should have at least 3 events (1 from first test + 2 from this test)
  assertArrayLength(result.data.istEvents, 3, "Should have at least 3 events");

  console.log(`  Created 2 additional events, total: ${result.data.istEvents.length}`);
}

async function testJsonFields(
  dc: ReturnType<typeof getDataConnect>
): Promise<void> {
  // Create event with complex JSON
  const complexSkills = [
    { name: "algorithms", level: "intermediate" },
    { name: "data structures", level: "beginner" },
  ];
  const complexTrajectory = {
    currentNode: "introduction",
    nextNodes: ["basics", "advanced"],
    completedNodes: [],
  };

  const ref = createIstEventRef(dc, {
    userId: TEST_USER_ID + "-json",
    courseId: TEST_COURSE_ID,
    threadId: TEST_THREAD_ID + "-json",
    messageId: TEST_MESSAGE_ID + "-json",
    utterance: "Testing JSON fields",
    intent: "TEST",
    skills: complexSkills,
    trajectory: complexTrajectory,
  });

  await executeMutation(ref);

  // Query back and verify
  const queryRef = istEventsByUserAndCourseRef(dc, {
    userId: TEST_USER_ID + "-json",
    courseId: TEST_COURSE_ID,
  });
  const result = await executeQuery(queryRef);

  assertArrayLength(result.data.istEvents, 1, "Should find the event");
  const event = result.data.istEvents[0];

  // Verify JSON was stored (structure may vary based on serialization)
  assertDefined(event.skills, "skills JSON should exist");
  assertDefined(event.trajectory, "trajectory JSON should exist");

  console.log("  Complex JSON fields stored and retrieved successfully");
  console.log(`  Skills: ${JSON.stringify(event.skills)}`);
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("Data Connect Validation Tests");
  console.log("=".repeat(60));
  console.log();

  let dc: ReturnType<typeof getDataConnect>;

  try {
    dc = initDataConnect();
  } catch (error) {
    console.error("✗ Failed to initialize Data Connect");
    console.error("  Make sure Firebase emulators are running:");
    console.error("    firebase emulators:start");
    console.error();
    console.error("  And that the Data Connect SDK is generated:");
    console.error("    npm run dataconnect:generate");
    console.error();
    console.error("Error:", error);
    process.exit(1);
  }

  console.log("Running tests...\n");

  // Run all tests
  await runTest("Create IST Event", () => testCreateIstEvent(dc));
  await runTest("Query IST Events", () => testQueryIstEvents(dc));
  await runTest("Empty Query Returns Empty Array", () => testEmptyQuery(dc));
  await runTest("Multiple Events", () => testMultipleEvents(dc));
  await runTest("JSON Fields (skills, trajectory)", () => testJsonFields(dc));

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("Test Summary");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTotal: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${totalTime}ms`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log("\n" + "=".repeat(60));

  if (failed > 0) {
    console.log("RESULT: TESTS FAILED");
    process.exit(1);
  } else {
    console.log("RESULT: ALL TESTS PASSED");
    console.log("\nData Connect is working correctly with the emulator.");
    console.log("You can now use IST event queries and mutations.");
  }
}

// Run
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
