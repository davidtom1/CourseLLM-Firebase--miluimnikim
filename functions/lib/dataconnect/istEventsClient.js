"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveIstEventToDataConnect = saveIstEventToDataConnect;
const app_1 = require("firebase/app");
const data_connect_1 = require("firebase/data-connect");
const functions_generated_1 = require("@dataconnect/functions-generated");
// Keep a singleton Data Connect instance
let dataConnectInstance = null;
let emulatorConnected = false;
// Use a dedicated named app for Data Connect to avoid conflicts
const DC_APP_NAME = 'functions-dataconnect';
function getOrInitDataConnect() {
    if (dataConnectInstance) {
        return dataConnectInstance;
    }
    try {
        // 1. Ensure App Exists - Use a NAMED app to avoid conflicts
        let app;
        const existingApp = (0, app_1.getApps)().find(a => a.name === DC_APP_NAME);
        if (existingApp) {
            app = existingApp;
        }
        else {
            const configEnv = process.env.FIREBASE_CONFIG;
            if (configEnv) {
                const firebaseConfig = JSON.parse(configEnv);
                app = (0, app_1.initializeApp)(firebaseConfig, DC_APP_NAME);
            }
            else {
                // Fallback for emulator: provide fuller config to prevent SDK internal errors
                app = (0, app_1.initializeApp)({
                    projectId: process.env.GCLOUD_PROJECT || 'coursewise-f2421',
                    apiKey: 'demo-api-key',
                    authDomain: 'coursewise-f2421.firebaseapp.com',
                }, DC_APP_NAME);
            }
        }
        // 2. Initialize DC with EXPLICIT App + RAW Config
        const dc = (0, data_connect_1.getDataConnect)(app, functions_generated_1.connectorConfig);
        // 3. Connect to Emulator (Robust)
        const isEmulatorEnv = process.env.FUNCTIONS_EMULATOR === 'true' || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
        if (isEmulatorEnv && !emulatorConnected) {
            try {
                (0, data_connect_1.connectDataConnectEmulator)(dc, '127.0.0.1', 9400, false);
                emulatorConnected = true;
                console.log('[DataConnect] Connected to emulator at 127.0.0.1:9400');
            }
            catch (connErr) {
                console.warn('[DataConnect] Could not connect to emulator:', connErr.message);
                emulatorConnected = true; // Avoid retry loops
            }
        }
        dataConnectInstance = dc;
        return dataConnectInstance;
    }
    catch (err) {
        console.error('[DataConnect] Fatal initialization error:', err);
        return null;
    }
}
async function saveIstEventToDataConnect(input) {
    const dc = getOrInitDataConnect();
    if (!dc) {
        console.warn('[DataConnect] Skipping save - client not initialized');
        return;
    }
    try {
        const ref = (0, functions_generated_1.createIstEventRef)(dc, {
            userId: input.userId,
            courseId: input.courseId,
            threadId: input.threadId,
            messageId: input.messageId,
            utterance: input.utterance,
            intent: input.intent,
            skills: input.skills,
            trajectory: input.trajectory,
        });
        await (0, data_connect_1.executeMutation)(ref);
        console.log('[DataConnect] Saved IstEvent for messageId:', input.messageId);
    }
    catch (err) {
        console.error('[DataConnect] Failed to save IstEvent:', (err === null || err === void 0 ? void 0 : err.message) || err);
    }
}
//# sourceMappingURL=istEventsClient.js.map