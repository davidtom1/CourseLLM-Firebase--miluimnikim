import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

// Guard this route so it's only available during test runs.
const ENABLED = process.env.ENABLE_TEST_AUTH === "true";

// Detect if running in emulator mode
const USE_EMULATOR = 
  process.env.FIREBASE_AUTH_EMULATOR_HOST || 
  process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";

function initAdmin() {
  if (admin.apps.length) return admin;

  // In emulator mode, we can initialize without real credentials
  if (USE_EMULATOR) {
    console.log("[test-token] Running in EMULATOR mode - initializing without service account");
    
    // CRITICAL: Explicitly configure Admin SDK to use emulators
    // Using 127.0.0.1 instead of localhost to avoid Node 17+ IPv6 issues
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    
    admin.initializeApp({ 
      projectId: process.env.FIREBASE_PROJECT_ID || "coursewise-f2421" 
    });
    return admin;
  }

  // Production mode: require real service account credentials
  let serviceAccount: any = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", e);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const p = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const raw = fs.readFileSync(p, "utf8");
      serviceAccount = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to read service account file", e);
    }
  }

  if (!serviceAccount) {
    throw new Error("Service account not provided in FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH");
  }

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin;
}

export async function GET(req: Request) {
  if (!ENABLED) return NextResponse.json({ error: "test auth disabled" }, { status: 403 });

  const url = new URL(req.url);
  const uid = url.searchParams.get("uid") || `test-${Math.random().toString(36).slice(2, 8)}`;
  const role = url.searchParams.get("role"); // 'student' | 'teacher'
  const createProfile = url.searchParams.get("createProfile") !== "false"; // default true

  try {
    const adm = initAdmin();

    // Optionally write a user profile to Firestore so tests can simulate existing users.
    if (createProfile && role) {
      const db = adm.firestore();
      await db.doc(`users/${uid}`).set(
        {
          uid,
          email: `${uid}@example.test`,
          displayName: uid,
          role,
          department: "Test Dept",
          courses: ["TST101"],
          profileComplete: true,
          createdAt: adm.firestore.FieldValue.serverTimestamp(),
          updatedAt: adm.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const token = await adm.auth().createCustomToken(uid);
    return NextResponse.json({ token });
  } catch (err: any) {
    console.error("test-token error", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
