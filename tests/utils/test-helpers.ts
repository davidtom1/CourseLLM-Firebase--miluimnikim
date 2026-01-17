/**
 * Emulator Reset Utility
 * 
 * Clears specific collections from the Firestore Emulator to prevent state pollution between tests.
 */

/**
 * Clears all documents from the Firestore Emulator
 * 
 * Uses the emulator's REST API to delete all documents in the database.
 * This is safe because it only works with the emulator, not production.
 */
export async function resetFirestoreEmulator() {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'coursewise-f2421';
  
  const url = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      console.log('[Reset] Firestore emulator cleared successfully');
    } else {
      console.warn('[Reset] Failed to clear Firestore emulator:', response.status);
    }
  } catch (error) {
    console.error('[Reset] Error clearing Firestore emulator:', error);
  }
}

/**
 * Clears only chat-related collections (messages, threads) while preserving user profiles
 * 
 * This is safer for E2E tests that need stable user accounts
 */
export async function resetChatData() {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const projectId = process.env.FIREBASE_PROJECT_ID || 'coursewise-f2421';
  
  // Collections to clear (add more as needed)
  const collectionsToReset = ['messages', 'threads', 'messageAnalysis'];
  
  try {
    for (const collection of collectionsToReset) {
      const url = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
      
      try {
        const response = await fetch(url, { method: 'DELETE' });
        if (response.ok || response.status === 404) {
          console.log(`[Reset] Cleared collection: ${collection}`);
        } else {
          console.warn(`[Reset] Failed to clear ${collection}:`, response.status);
        }
      } catch (err) {
        // Collection might not exist, that's okay
        console.log(`[Reset] Collection ${collection} not found (okay)`);
      }
    }
  } catch (error) {
    console.error('[Reset] Error clearing chat data:', error);
  }
}

/**
 * Recreates the seeded test user profiles using the test-token API
 * 
 * This ensures the profiles exist in Firestore after clearing chat data.
 * The Auth Emulator retains the accounts (student@test.com, teacher@test.com),
 * but we need to recreate their Firestore profiles.
 */
export async function ensureTestUserProfiles() {
  // Use the test-token API to create profiles for the standard test users
  // These UIDs must match what gets created when Mock Login is used
  const baseUrl = 'http://localhost:9002';
  
  const users = [
    { role: 'student', uid: 'mock-student-uid' },
    { role: 'teacher', uid: 'mock-teacher-uid' },
  ];

  try {
    for (const user of users) {
      const url = `${baseUrl}/api/test-token?uid=${user.uid}&role=${user.role}&createProfile=true`;
      const response = await fetch(url);
      
      if (response.ok) {
        console.log(`[Setup] Created profile for ${user.role}`);
      } else {
        console.warn(`[Setup] Failed to create profile for ${user.role}:`, response.status);
      }
    }
  } catch (error) {
    console.error('[Setup] Error creating test user profiles:', error);
  }
}

/**
 * Adds a delay to respect API rate limits (Gemini Free Tier: ~15 RPM)
 * 
 * @param ms - Milliseconds to wait (default: 5000ms = 5 seconds)
 */
export async function waitForRateLimit(ms: number = 5000) {
  console.log(`[Rate Limit] Waiting ${ms}ms before next API call...`);
  await new Promise(resolve => setTimeout(resolve, ms));
}

