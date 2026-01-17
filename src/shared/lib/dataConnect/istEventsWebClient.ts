// src/shared/lib/dataConnect/istEventsWebClient.ts

"use server";

import { getApps, initializeApp } from "firebase/app";
import {
  getDataConnect,
  connectDataConnectEmulator,
  executeQuery,
} from "firebase/data-connect";
import {
  connectorConfig,
  istEventsByUserAndCourseRef,
} from "@dataconnect/generated";

type ListParams = {
  userId: string;
  courseId: string;
};

let dataConnectInstance: ReturnType<typeof getDataConnect> | null = null;
let emulatorConnected = false;

// Use a dedicated named app for Data Connect to avoid conflicts with other Firebase initializations
const DATA_CONNECT_APP_NAME = "dataconnect-client";

function getOrInitDataConnect() {
  if (dataConnectInstance) return dataConnectInstance;

  try {
    // 1. Get or create a NAMED app specifically for Data Connect
    // This avoids conflicts with the default app initialized elsewhere
    let app = getApps().find((a) => a.name === DATA_CONNECT_APP_NAME);
    
    if (!app) {
      app = initializeApp(
        {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "coursewise-f2421",
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "coursewise-f2421.firebaseapp.com",
        },
        DATA_CONNECT_APP_NAME
      );
      console.log("[DataConnect] Created dedicated Firebase app:", DATA_CONNECT_APP_NAME);
    }

    // 2. Initialize DC with EXPLICIT App + RAW Config
    const dc = getDataConnect(app, connectorConfig);

    // 3. Connect to Emulator (Safe Mode)
    // Check for emulator mode using the environment variable
    const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";
    
    if (useEmulator && !emulatorConnected) {
      try {
        // Use 127.0.0.1 to avoid Node 17+ IPv6 issues
        connectDataConnectEmulator(dc, "127.0.0.1", 9400, false);
        emulatorConnected = true;
        console.log("[DataConnect] Connected to emulator at 127.0.0.1:9400 (SSL disabled)");
      } catch (e) {
        console.warn("[DataConnect] Failed to connect to emulator:", e);
      }
    }

    dataConnectInstance = dc;
    return dc;
  } catch (err) {
    console.error("[DataConnect] Failed to initialize:", err);
    return null;
  }
}

/**
 * Returns all IST events for a given userId + courseId from Data Connect
 */
export async function listIstEventsForUserAndCourse({
  userId,
  courseId,
}: ListParams) {
  const dc = getOrInitDataConnect();

  if (!dc) {
    console.warn("[DataConnect] client not initialized");
    return [];
  }

  const ref = istEventsByUserAndCourseRef(dc, { userId, courseId });
  const result = await executeQuery(ref);

  // Shape depends on schema – assuming result.data.istEvents
  return result.data?.istEvents ?? [];
}


