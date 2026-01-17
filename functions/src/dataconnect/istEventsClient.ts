import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDataConnect, connectDataConnectEmulator, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createIstEventRef } from '@dataconnect/functions-generated';

interface IstEventInput {
  userId: string;
  courseId: string;
  threadId: string;
  messageId: string;
  utterance: string;
  intent: string;
  skills: unknown;
  trajectory: unknown;
}

// Keep a singleton Data Connect instance
let dataConnectInstance: ReturnType<typeof getDataConnect> | null = null;
let emulatorConnected = false;

// Use a dedicated named app for Data Connect to avoid conflicts
const DC_APP_NAME = 'functions-dataconnect';

function getOrInitDataConnect() {
  if (dataConnectInstance) {
    return dataConnectInstance;
  }

  try {
    // 1. Ensure App Exists - Use a NAMED app to avoid conflicts
    let app: FirebaseApp;
    const existingApp = getApps().find(a => a.name === DC_APP_NAME);
    
    if (existingApp) {
      app = existingApp;
    } else {
      const configEnv = process.env.FIREBASE_CONFIG;
      if (configEnv) {
        const firebaseConfig = JSON.parse(configEnv);
        app = initializeApp(firebaseConfig, DC_APP_NAME);
      } else {
        // Fallback for emulator: provide fuller config to prevent SDK internal errors
        app = initializeApp({
          projectId: process.env.GCLOUD_PROJECT || 'coursewise-f2421',
          apiKey: 'demo-api-key',
          authDomain: 'coursewise-f2421.firebaseapp.com',
        }, DC_APP_NAME);
      }
    }

    // 2. Initialize DC with EXPLICIT App + RAW Config
    const dc = getDataConnect(app, connectorConfig);

    // 3. Connect to Emulator (Robust)
    const isEmulatorEnv = process.env.FUNCTIONS_EMULATOR === 'true' || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
    
    if (isEmulatorEnv && !emulatorConnected) {
      try {
        connectDataConnectEmulator(dc, '127.0.0.1', 9400, false);
        emulatorConnected = true;
        console.log('[DataConnect] Connected to emulator at 127.0.0.1:9400');
      } catch (connErr: any) {
        console.warn('[DataConnect] Could not connect to emulator:', connErr.message);
        emulatorConnected = true; // Avoid retry loops
      }
    }

    dataConnectInstance = dc;
    return dataConnectInstance;

  } catch (err) {
    console.error('[DataConnect] Fatal initialization error:', err);
    return null;
  }
}

export async function saveIstEventToDataConnect(input: IstEventInput): Promise<void> {
  const dc = getOrInitDataConnect();

  if (!dc) {
    console.warn('[DataConnect] Skipping save - client not initialized');
    return;
  }

  try {
    const ref = createIstEventRef(dc, {
      userId: input.userId,
      courseId: input.courseId,
      threadId: input.threadId,
      messageId: input.messageId,
      utterance: input.utterance,
      intent: input.intent,
      skills: input.skills,
      trajectory: input.trajectory,
    });

    await executeMutation(ref);
    console.log('[DataConnect] Saved IstEvent for messageId:', input.messageId);
  } catch (err: any) {
    console.error('[DataConnect] Failed to save IstEvent:', err?.message || err);
  }
}
