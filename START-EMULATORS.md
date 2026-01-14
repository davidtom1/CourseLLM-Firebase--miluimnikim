# Emulator Startup Troubleshooting

## Issue: "No emulators to start"

If you get this error:
```
Error: No emulators to start, run firebase init emulators to get started.
```

## Try These Solutions (in order):

### Solution 1: Start All Emulators
```bash
firebase emulators:start
```
This starts all configured emulators. You can then access:
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- DataConnect: http://localhost:9400
- UI: http://localhost:4000

---

### Solution 2: Check Firebase CLI Version
```bash
firebase --version
```

You need at least version 13.0.0+ for DataConnect support.

**Update if needed:**
```bash
npm install -g firebase-tools
```

---

### Solution 3: Start Without DataConnect First
```bash
firebase emulators:start --only auth,firestore
```

If this works, DataConnect might not be properly configured. Then add DataConnect:
```bash
firebase emulators:start --only auth,firestore,dataconnect
```

---

### Solution 4: Export Ports Individually
```bash
# Start with explicit export (PowerShell)
$Env:FIRESTORE_EMULATOR_HOST="localhost:8080"
$Env:FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"
firebase emulators:start
```

---

### Solution 5: Check Project Configuration

Verify `firebase.json` has emulator config:
```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "dataconnect": { "port": 9400 }
  }
}
```

Verify `.firebaserc` has project ID:
```json
{
  "projects": {
    "default": "coursewise-f2421"
  }
}
```

---

### Solution 6: Reinitialize Emulators
```bash
firebase init emulators
```

Select:
- ✓ Authentication Emulator
- ✓ Firestore Emulator
- ✓ DataConnect Emulator (if available)

Use default ports or configure as needed.

---

## Working Command (Most Reliable)

**Just start all emulators:**
```bash
firebase emulators:start
```

This automatically starts all configured emulators from `firebase.json` without needing to specify them individually.

---

## Alternative: Use Emulator Export/Import

If you want to persist emulator data between restarts:

**Start with export:**
```bash
firebase emulators:start --export-on-exit=./emulator-data --import=./emulator-data
```

This saves auth users and Firestore data (eliminates need for seeding every time).

**Note:** DataConnect still uses in-memory data and won't persist.

---

## Current Recommended Command

Based on your setup, use:

```bash
firebase emulators:start
```

Or if you only want specific emulators:

```bash
firebase emulators:start --only=auth,firestore,dataconnect
```

Note: Use `--only=` (with equals sign) instead of just `--only`

---

## Verify It's Working

After starting, you should see:
```
┌────────────────┬────────────────┬─────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI             │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth      │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Data Connect   │ 127.0.0.1:9400 │ n/a                             │
└────────────────┴────────────────┴─────────────────────────────────┘
```

Then proceed with seeding test users:
```bash
node scripts/seed-test-users.js
```
