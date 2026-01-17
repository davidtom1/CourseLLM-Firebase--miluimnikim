# Contributing to CourseLLM

## Development Setup

### Prerequisites

1. **Node.js 18+** and npm
2. **Firebase CLI** (`npm install -g firebase-tools`)
3. **Python 3.8+** (for DSPy service)

### Quick Start

```bash
# Clone and install dependencies
git clone <repository-url>
cd CourseLLM-Firebase--miluimnikim
npm install

# Start Firebase emulators
firebase emulators:start

# Start Next.js dev server (separate terminal)
npm run dev

# Start DSPy service (separate terminal)
cd dspy_service
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

## Code Quality

Before committing, ensure your code passes both type-check and lint:

```bash
npm run typecheck  # TypeScript compilation check (0 errors required)
npm run lint       # ESLint check (0 errors required, warnings OK)
```

## Data Connect Policy

**IMPORTANT: Data Connect generated files must NOT be committed to Git.**

### Why?

- Generated SDK files are environment-specific and can vary between dev/staging/production
- They contain auto-generated code that should be reproducible from schema
- Committing them causes merge conflicts and bloat

### How It Works

1. **`.gitignore`** excludes all generated directories:
   ```
   src/dataconnect-generated/
   src/dataconnect-admin-generated/
   dataconnect/.dataconnect/
   ```

2. **`postinstall` script** automatically regenerates the SDK after `npm install`:
   ```bash
   npm run postinstall
   # Or manually:
   npm run dataconnect:generate
   ```

3. **`package.json` dependencies** reference local generated folders:
   ```json
   "@dataconnect/generated": "file:src/dataconnect-generated",
   "@dataconnect/admin-generated": "file:src/dataconnect-admin-generated"
   ```

### When Cloning or After a Fresh Install

After cloning the repository, run:

```bash
npm install
```

This will automatically run `postinstall` which generates the Data Connect SDK. If generation fails (e.g., Firebase CLI not installed), you'll see a warning but the install will complete.

### Modifying Data Connect Schema

If you modify files in `dataconnect/schema/` or `dataconnect/connector/`:

1. Run SDK generation:
   ```bash
   npm run dataconnect:generate
   ```

2. Test locally with emulators:
   ```bash
   firebase emulators:start
   ```

3. Commit only the schema/connector changes, **never the generated files**.

## File Organization

```
src/
├── app/                  # Next.js 15 app router pages
├── components/           # React components
├── features/             # Feature-specific code (IST, AI, auth)
├── shared/               # Shared utilities, types, hooks
├── lib/                  # Re-exports for backwards compatibility
├── dataconnect-generated/     # [GITIGNORED] Auto-generated SDK
└── dataconnect-admin-generated/ # [GITIGNORED] Auto-generated Admin SDK

dataconnect/
├── schema/               # GraphQL schema (committed)
├── connector/            # Connector queries (committed)
└── .dataconnect/         # [GITIGNORED] Build artifacts

_unused_quarantine/       # Legacy/unused code (excluded from compilation)
```

## Quarantined Code

The `_unused_quarantine/` folder contains legacy code that is:
- Excluded from TypeScript compilation
- Excluded from ESLint
- Kept for reference only

Do not add new code to this folder. If code becomes unused, delete it rather than moving it to quarantine.
