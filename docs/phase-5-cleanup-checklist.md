# Phase 5 – Repo Cleanup Checklist (Plan + Execution Log)

This checklist operationalizes **Phase 5 – Clean up implementation** for the CourseWise / IST repo.  
It is both:

- A **plan** (what we intend to do, per-PR), and
- An **execution log** (what actually happened).

> **Process Rule:**  
> You may not start PR _N+1_ until the **Gate** for PR _N_ is explicitly marked as ✅ and all required **Execution Log** fields (including UI Checks) are filled in.

All paths, scenarios, and URLs are aligned with the current repository state and the `docs/ist-ui-test-plan.md` (Scenarios 1–6).

---

## 0) Baseline Snapshot (Gate 0)

### Purpose

- [ ] **Confirm current behavior** of the IST pipeline and related UIs before any cleanup work begins.
- [ ] **Establish a known-good baseline** for:
  - Next.js 15 App Router behavior on key routes.
  - Cloud Functions (`analyzeMessage`) + DSPy service integration.
  - Data Connect writes/reads for `IstEvent`.
  - Firestore `threads/{threadId}/analysis/{messageId}` for IntentInspector.
  - Teacher IST Class Report (JSON-backed v2 analytics) behavior.

### Pre-flight Commands

Run these from the repo root and record outputs or links in the Execution Log.

- [ ] `npm install`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`

If any of these fail, **stop** and fix before proceeding.

### Required Running Services Checklist (Terminals A/B/C)

- [ ] **Terminal A – DSPy service**
  - Command:
    ```bash
    cd dspy_service
    # On Windows PowerShell
    .\venv\Scripts\Activate.ps1
    python -m uvicorn app:app --reload --port 8000
    ```
  - Verify logs show: `Application startup complete.` and `[IST]` messages when Scenario 1 runs.

- [ ] **Terminal B – Firebase Emulators (Functions + Firestore + Data Connect)**
  - Command:
    ```bash
    firebase emulators:start
    ```
  - Verify:
    - Functions emulator running on port `5001`.
    - Firestore emulator on `8080`.
    - Data Connect emulator on `9399`.

- [ ] **Terminal C – Next.js dev server**
  - Command:
    ```bash
    npm run dev
    ```
  - Verify startup log shows:
    - `Local:        http://localhost:9002`
    - Requests logged when hitting `/student`, `/student/courses/cs202`, `/teacher/courses/cs-demo-101?view=...`, `/ist-dev/dataconnect`.

### UI Checks (Baseline – IST UI Test Plan Scenarios)

For each scenario below, follow the detailed steps and expected results in `docs/ist-ui-test-plan.md`.  
Record Pass/Fail + notes in the Execution Log.

**Scenario 1 – Basic Socratic Chat with IST Extraction**

- [ ] **Steps (summary)**:
  - Open `http://localhost:9002/student/courses/cs202`.
  - Scroll to **Socratic Tutor** section.
  - Ask a conceptual CS question (e.g., “What is the time complexity of inserting into a dynamic array?”).
- [ ] **Expected UI**:
  - Tutor responds with an explanation or a Socratic follow-up question.
  - No unhandled error screens; input remains usable.
- [ ] **Expected logs**:
  - **Functions (Terminal B)**: `Running IST analysis for threadId ... messageId ...`, `DSPy response received ...`, `About to save IST event to DataConnect ...`, `DataConnect save completed ...`.
  - **DSPy (Terminal A)**: `[IST] Processing request - utterance: ...`, `Received chat_history size: ...`, `Received ist_history size: ...`, `Returning response - intent length ...`.

**Scenario 2 – IST Event Stored in Data Connect**

- [ ] **Steps (summary)**:
  - From `/student/courses/cs202`, send at least one new Socratic question.
- [ ] **Expected logs**:
  - **Functions (Terminal B)**: `About to save IST event to DataConnect for messageId ...`, `DataConnect save completed for messageId ...`.
  - No Data Connect–related errors in `firebase emulators` logs or `dataconnect-debug.log`.

**Scenario 3 – Frontend Reads IST History from Data Connect**

- [ ] **Steps (summary)**:
  - Still on `/student/courses/cs202`, send multiple questions in the same thread.
  - Refresh the page or send another message to trigger history loading.
- [ ] **Expected logs**:
  - **Next.js (Terminal C)**: `[IST][Context] Loaded recent IST events: X`, `[IST][Context] Loaded recent chat messages: Y` with `X > 0` after several questions.
  - **DSPy (Terminal A)**: `[IST] Received chat_history size: Y`, `[IST] Received ist_history size: X`.

**Scenario 4 – `/ist-dev/dataconnect` Debug View**

- [ ] **Steps (summary)**:
  - Open `http://localhost:9002/ist-dev/dataconnect`.
  - Use `userId = demo-user` and `courseId = cs202` (or match your test values).
  - Click **“Load IST Events”**.
- [ ] **Expected UI**:
  - List of IST events with `createdAt`, `threadId`, `messageId`, `userId`, `courseId`, `utterance`, `intent`, `skills`, `trajectory`.
  - Values match those seen in Functions and DSPy logs for Scenario 1/2.

**Scenario 5 – Gemini Quota / Error Behavior (Optional but Recommended)**

- [ ] **Steps (summary)**:
  - From `/student/courses/cs202`, send many questions quickly or temporarily misconfigure Genkit to induce a 429/503.
- [ ] **Expected behavior**:
  - **Next.js (Terminal C)**: `[socratic-course-chat] socraticPrompt failed, returning fallback tutor message instead of throwing: GenkitError ...`.
  - **UI**: User sees a friendly fallback message (“The AI tutor is temporarily unavailable ... your question was still processed for IST analysis ...”); no crash page.
  - **Functions/DSPy**: `analyzeMessage` calls and `[IST]` logs continue, confirming IST + Data Connect still operate.

**Scenario 6 – Teacher IST Class Report (Aggregated, JSON-First)**

- [ ] **Steps (summary)**:
  - Open `http://localhost:9002/teacher/courses/cs-demo-101?view=ist-report`.
  - Ensure you are on the **“IST Class Report”** tab and click **“Generate IST Class Report”**.
- [ ] **Expected UI**:
  - Aggregated dashboard with Executive Summary, Trends, Top Skills, Gaps, and Data Quality cards.
  - No `userId`, `threadId`, `messageId`, or raw `utterance` text rendered; only course-level aggregates.
- [ ] **Expected metrics (approximate, given current mock)**:
  - `totalEvents ≈ 100`, `eventsWithSkills ≈ 90 (≈90.0%)`, `uniqueSkillsCount ≈ 74`, `totalSkillAssignments ≈ 183`.
  - Top skill “recursion” ≈ 6.6% of assignments; top 10 skills ≈ 40.4% of assignments.
  - `last7Days: 70 events / 122 skillAssignments`, `prev7Days: 30 events / 61 skillAssignments`.
  - Data quality: `eventsMissingSkillsField ≈ 4`, `eventsEmptySkillsArray ≈ 4`, `invalidSkillEntriesDropped ≈ 4`, `eventsSkillsNotArray ≈ 0`.
- [ ] **Expected logs**:
  - **Network tab**: `GET /mocks/ist/teacher-class-events.json` with 200 response.
  - **Next.js (Terminal C)**: navigation to `/teacher/courses/cs-demo-101?&view=ist-report` with no `params. courseId must be awaited` warnings.

### Execution Log – Gate 0

> Fill this section once all baseline commands and UI checks are complete.

- **Status** (select one):  
  - [ ] Not started  
  - [ ] In progress  
  - [ ] ✅ Completed
- **Date completed**: `YYYY-MM-DD`  
- **Runner (name / initials)**: `...`  
- **Baseline commit SHA**: `...`  
- **Pre-flight command results** (links to CI runs or paste summaries):  
  - `npm run lint`: `Pass / Fail (details)`  
  - `npm run typecheck`: `Pass / Fail (details)`  
  - `npm run build`: `Pass / Fail (details)`
- **UI Scenarios summary** (1–6):  
  - Scenario 1 – Basic Socratic Chat with IST Extraction: `Pass / Fail / Not run` – Notes: `...`  
  - Scenario 2 – IST Event Stored in Data Connect: `Pass / Fail / Not run` – Notes: `...`  
  - Scenario 3 – Frontend Reads IST History from Data Connect: `Pass / Fail / Not run` – Notes: `...`  
  - Scenario 4 – /ist-dev/dataconnect Debug View: `Pass / Fail / Not run` – Notes: `...`  
  - Scenario 5 – Gemini Quota / Error Behavior (Optional): `Pass / Fail / Skipped` – Notes: `...`  
  - Scenario 6 – Teacher IST Class Report (Aggregated, JSON-First): `Pass / Fail / Not run` – Notes: `...`
- **Known baseline issues / technical debt discovered**:  
  - [ ] `...`

**✅ Gate 0 – Baseline established**  
Only proceed to **PR 1** when all required baseline checks are complete and this gate is marked ✅.

---

## PR 1) Remove/Move High-Confidence Dead Code (Legacy cleanup)

### 1) Scope (exact target paths)

Use `rg`, `findstr`, and/or `ls` to confirm each target is not referenced by the active Next.js / Functions / DSPy flows.

Planned removals or moves (e.g., into a `legacy/` folder):

- [ ] `src/App.tsx`  
  - Old CRA-style entrypoint using `./pages/AnalysisDemo`; not used by Next.js App Router.
- [ ] `src/pages-backup-temp/AnalysisDemo.tsx`  
  - Legacy analysis demo, only referenced by `src/App.tsx`.
- [ ] `scripts/verify_feature.py`  
  - Hard-coded to call `http://localhost:8000/analyze-message`, which does not match current FastAPI endpoints (`/api/intent-skill-trajectory`, `/api/quiz`).
- [ ] `tests/integration/test_api_endpoint.py`  
  - References `app.main` and `/analyze-message` that do not exist in `dspy_service/app.py`.
- [ ] `tests/unit/test_analysis_logic.py`  
  - References `app.analysis_mapper` module that does not exist in the current repo.
- [ ] `src/ai/flows/summarize-uploaded-material.ts` (if confirmed unused by `rg`)  
  - High-confidence dead code; not referenced anywhere in TS/TSX.

> ⚠️ **Indirect UI impact:** Although these files are not wired into the running app, removing them can affect developers’ mental model and automated tooling (e.g., stale tests, stray scripts). Always re-run baseline UI checks to ensure no unexpected coupling existed.

### 2) Non-goals (explicitly out-of-scope for PR 1)

- [ ] Do **not** modify runtime behavior of:
  - `src/app/**` Next.js pages and layouts.
  - `functions/src/**` Cloud Functions (`analyzeMessage`, Data Connect clients).
  - `dspy_service/**` FastAPI or DSPy flow logic.
  - `docs/**` content other than possibly adding a short “Legacy” note referencing moved files.
- [ ] Do **not** change any IST analytics code (`src/lib/ist/**`, `src/features/ist/**`) in this PR.
- [ ] Do **not** touch `src/components/layout/UserNav.tsx` or `src/components/layout/user-nav.tsx` (reserved for PR 3).

### 3) Steps

- [ ] For each file in the **Scope**, run `rg` (or IDE “Find All References”) to confirm no active imports/usages.
- [ ] Decide per-file whether to:
  - [ ] **Delete** (no longer needed), or
  - [ ] **Move to `legacy/`** (if you want to keep it for historical reference).
- [ ] Apply changes with minimal diffs (remove file or move and fix imports).
- [ ] If moving to `legacy/`, add a brief README describing why the file was retired and which PR supersedes it.

### 4) Commands (lint/typecheck/build)

Run after applying changes:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`

Record results in the Execution Log before running UI checks.

### 5) UI Checks (from IST UI Test Plan)

**Required scenarios for PR 1:** 1, 2, 3, 4, 6  
Scenario 5 is recommended but not strictly required for this PR.

For each scenario, perform at least one full run and verify the expected behavior and logs remain unchanged relative to the baseline.

**Scenario 1 – Basic Socratic Chat with IST Extraction**

- [ ] **Do:**  
  - Open `http://localhost:9002/student/courses/cs202`.  
  - Ask a conceptual question; send and wait for tutor response.
- [ ] **Observe:**  
  - UI: Tutor responds; no errors or broken assets (no missing components/scripts).  
  - Next.js logs: No import errors referencing removed legacy files.  
  - Functions/DSPy logs: Same `analyzeMessage` and `[IST]` patterns as baseline.

**Scenario 2 – IST Event Stored in Data Connect**

- [ ] **Do:**  
  - From the same page, send another question.
- [ ] **Observe:**  
  - Functions logs still show `About to save IST event to DataConnect ...` and `DataConnect save completed ...`.  
  - No new stack traces related to removed scripts/tests.

**Scenario 3 – Frontend Reads IST History from Data Connect**

- [ ] **Do:**  
  - Send multiple questions in the same thread, then refresh and send another.
- [ ] **Observe:**  
  - Next.js logs: `[IST][Context] Loaded recent IST events: X (>0)` and `[IST][Context] Loaded recent chat messages: Y`.  
  - DSPy logs: `Received chat_history size: Y`, `Received ist_history size: X`.  
  - No regression in behavior vs baseline.

**Scenario 4 – /ist-dev/dataconnect Debug View**

- [ ] **Do:**  
  - Open `http://localhost:9002/ist-dev/dataconnect` and load events.
- [ ] **Observe:**  
  - Events still render with expected fields; no broken imports or 500 errors caused by removed legacy code.

**Scenario 6 – Teacher IST Class Report (Aggregated, JSON-First)**

- [ ] **Do:**  
  - Open `http://localhost:9002/teacher/courses/cs-demo-101?view=ist-report`, click **Generate IST Class Report**.
- [ ] **Observe:**  
  - Report renders with expected aggregates; no missing modules, no console errors indicating missing legacy files.  
  - Network call to `/mocks/ist/teacher-class-events.json` still succeeds.

### 6) Risk assessment

- **Overall Risk Level:** ☐ Low ☑ **Low-to-Medium** ☐ High
- Rationale:
  - Targets are **not wired** into current runtime flows (per `rg` and manual inspection).
  - However, removing tests/scripts can affect CI pipelines or developer workflows if they were implicitly used.
  - There is low risk of indirect impact via tooling or documentation references.

### 7) Gate criteria (must be true before merge)

- [ ] All files in **Scope** are either:
  - Removed or moved to `legacy/` with clear documentation, and
  - No remaining references in active code (`rg` returns no matches).
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` all **pass**.
- [ ] UI Checks for required scenarios **1, 2, 3, 4, 6** are all marked **Pass** with notes.
- [ ] Any newly discovered dependencies on the removed files are either:
  - Resolved in this PR, or
  - Captured under **Follow-up tasks**.

**✅ Gate 1 – PR 1 may be merged only when all above items are checked and Execution Log is complete.**

### 8) Execution Log – PR 1

- **Status** (select one):  
  - [ ] Not started  
  - [ ] In progress  
  - [ ] ✅ Done
- **PR link**: `https://github.com/<org>/<repo>/pull/…`  
- **Merged commit SHA**: `...`
- **Files actually removed/moved** (final list):  
  - `...`
- **Commands run & results**:  
  - `npm run lint`: `Pass / Fail (details)`  
  - `npm run typecheck`: `Pass / Fail (details)`  
  - `npm run build`: `Pass / Fail (details)`
- **UI Checks (post-PR)**:  
  - Scenario 1 – Basic Socratic Chat with IST Extraction: `Pass / Fail` – Notes: `...`  
  - Scenario 2 – IST Event Stored in Data Connect: `Pass / Fail` – Notes: `...`  
  - Scenario 3 – Frontend Reads IST History from Data Connect: `Pass / Fail` – Notes: `...`  
  - Scenario 4 – /ist-dev/dataconnect Debug View: `Pass / Fail` – Notes: `...`  
  - Scenario 5 – Gemini Quota / Error Behavior (if run): `Pass / Fail / Skipped` – Notes: `...`  
  - Scenario 6 – Teacher IST Class Report (Aggregated, JSON-First): `Pass / Fail` – Notes: `...`
- **Unexpected issues encountered**:  
  - [ ] `...`
- **Follow-up tasks created** (link to issues / future PRs):  
  - [ ] `...`

---

## PR 2) Remove AI-Residue / Syntax Noise (tests & placeholders clarity)

### 1) Scope (exact target paths)

Focus on code and docs that are clearly **AI-generated scaffolding or residue**, where behavior is confusing or misleading, but avoid changing actual business logic in this PR.

- [ ] `src/features/ist/reports/teacherIstReport.test.ts`  
  - Remove stray `*** Begin Patch` / `*** End Patch` markers and any non-code artifacts at the bottom of the file.  
  - Keep and, if needed, clarify the existing tests (`normalizeSkill`, `computeTeacherIstClassReportV2` core metrics and trends).
- [ ] `docs/IST-DB-Migration-Plan.md`  
  - Optionally annotate clearly which sections are **future work** vs **implemented** to avoid confusion (text-only; no behavior change).
- [ ] `src/ai/flows/analyze-message.ts`  
  - Add explicit comments/docstrings marking the current implementation as a **placeholder / non-production** flow that returns canned `MessageAnalysis`.  
  - Do **not** change its runtime behavior in this PR.
- [ ] `src/ai/flows/socratic-course-chat.ts` – `enforceCompliance` tool  
  - Add a brief comment that this tool is currently a no-op and may be implemented in a future PR.
- [ ] Any other obvious AI-residue comments or dead configuration snippets discovered during review (e.g., commented-out code blocks that no longer apply) – document changes here.

> ⚠️ **Indirect UI impact:** While we are not changing behavior, clarifying comments and cleaning tests can affect how future changes are made. The goal is to prevent misinterpretation of placeholder code as production-ready logic.

### 2) Non-goals

- [ ] Do **not** modify:
  - The logic of `functions/src/analyzeMessage.ts` or its mapping to `MessageAnalysis`.
  - The behavior of Next.js routes (`src/app/**`) or `src/lib/ist/**`.
  - Any Data Connect or Firestore wiring.
- [ ] Do **not** remove tests that are valid and not purely syntactic residue (only clean or clarify).
- [ ] Do **not** change the signature or return types of public APIs in this PR.

### 3) Steps

- [ ] Open each file in the **Scope** and identify AI residues:
  - Placeholder comments (“TODO: implement ...” with no plan), stale patch markers, or misleading descriptions.
- [ ] For `teacherIstReport.test.ts`:
  - [ ] Remove trailing malformed patch text.  
  - [ ] Re-run tests (when `npm test` is wired) or at least ensure the file parses (via `tsc`).
- [ ] For TS/TSX flows:
  - [ ] Add or refine comments to make it explicit which code is experimental/placeholder.
  - [ ] Ensure comments reference the relevant design docs (e.g., `docs/IST-DB-Migration-Plan.md`).

### 4) Commands (lint/typecheck/build)

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] (When available) `npm test` or `npx jest src/features/ist/reports/teacherIstReport.test.ts`

### 5) UI Checks (from IST UI Test Plan)

**Required scenarios for PR 2:** 1, 2, 3, 4, 6  
Scenario 5 is recommended if any comments/logging around Genkit were touched.

Because behavior should be unchanged, these checks validate that comment/test cleanups did not accidentally alter runtime.

- [ ] Re-run **Scenario 1**, **2**, **3**, **4**, **6** exactly as in Baseline / PR 1.
- [ ] Confirm:
  - No change in visible UI flows.
  - No new or removed log lines that would mislead operators (except for clearly additive, documented logs if any were introduced).

### 6) Risk assessment

- **Overall Risk Level:** ☑ Low ☐ Medium ☐ High
- Rationale:
  - Changes are limited to comments/tests and non-functional logging.
  - Primary risk is introducing a syntax error in tests or comments that breaks `tsc`/`eslint`.

### 7) Gate criteria

- [ ] All targeted AI-residue/textual cruft is removed or clarified, and remaining comments accurately describe the current behavior.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` all **pass**.
- [ ] If `npm test` is configured by this point, relevant tests (e.g., `teacherIstReport.test.ts`) pass.
- [ ] UI Checks (Scenarios 1, 2, 3, 4, 6) all **Pass**.

**✅ Gate 2 – PR 2 may be merged only when this gate is marked ✅ and Execution Log is complete.**

### 8) Execution Log – PR 2

- **Status**:  
  - [ ] Not started  
  - [ ] In progress  
  - [ ] ✅ Done
- **PR link**: `...`  
- **Merged commit SHA**: `...`
- **AI-residue items addressed**:  
  - `teacherIstReport.test.ts`: `...`  
  - `src/ai/flows/analyze-message.ts`: `...`  
  - `src/ai/flows/socratic-course-chat.ts`: `...`  
  - Other: `...`
- **Commands run & results**:  
  - `npm run lint`: `Pass / Fail`  
  - `npm run typecheck`: `Pass / Fail`  
  - `npm run build`: `Pass / Fail`  
  - `npm test` / `npx jest ...`: `Pass / Fail` (if applicable)
- **UI Checks summary**:  
  - Scenario 1: `Pass / Fail` – Notes: `...`  
  - Scenario 2: `Pass / Fail` – Notes: `...`  
  - Scenario 3: `Pass / Fail` – Notes: `...`  
  - Scenario 4: `Pass / Fail` – Notes: `...`  
  - Scenario 5 (if run): `Pass / Fail / Skipped` – Notes: `...`  
  - Scenario 6: `Pass / Fail` – Notes: `...`
- **Unexpected issues / clarifications needed**:  
  - [ ] `...`
- **Follow-up tasks**:  
  - [ ] `...`

---

## PR 3) Unify UserNav (safe consolidation)

### 1) Scope (exact target paths)

Consolidate the duplicated `UserNav` implementations into a single, clearly-defined component without changing the overall header look-and-feel.

- [ ] `src/components/layout/UserNav.tsx`  
  - Exposes `UserNav` with props `{ role: 'Student' | 'Teacher' }`, used by `AppHeader.tsx`.
- [ ] `src/components/layout/user-nav.tsx`  
  - Exposes `UserNav` with props `user: { name; email; avatar; }`, used by `app-shell.tsx`.
- [ ] `src/components/layout/AppHeader.tsx`  
  - Imports `UserNav` from `'./UserNav'`.
- [ ] `src/components/layout/app-shell.tsx`  
  - Imports `UserNav` from `'./user-nav'` and passes a `user` object.

> ⚠️ **Indirect UI impact:** Changes here affect the primary navigation/header for both Student and Teacher dashboards. Any regressions will be visible on most pages.

### 2) Non-goals

- [ ] Do **not** change the routing structure of `src/app/student/**` or `src/app/teacher/**`.
- [ ] Do **not** introduce new authentication or session state in this PR (User objects can stay hard-coded/demo).
- [ ] Do **not** modify IST logic, Data Connect, or DSPy behavior.

### 3) Steps

- [ ] Decide on a **single canonical `UserNav` API**, for example:
  - `UserNav({ user: { name, email, avatar, role } })`.
- [ ] Update one of the existing implementations to this canonical API, or create a new `UserNav` and have both `AppHeader` and `app-shell` import it.
- [ ] Adjust `AppHeader.tsx` and `app-shell.tsx` to pass the correct props (e.g., map `userRole` to a `user` object with `role`).
- [ ] Remove or move the superseded `UserNav` implementation (e.g., into `legacy/` if you want to keep it).
- [ ] Ensure class names and layout remain visually compatible with current design.

### 4) Commands (lint/typecheck/build)

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`

### 5) UI Checks (must include Student + Teacher headers)

**Required scenarios for PR 3:** 1, 4, 6  
Scenario 2/3 are recommended as quick sanity checks; Scenario 5 optional.

**Student header sanity (tied to Scenario 1 & 3)**

- [ ] **Do:**  
  - Open `http://localhost:9000` → navigate to `/student` and `/student/courses/cs202`.  
  - Interact with the header user menu (avatar / dropdown).
- [ ] **Observe:**  
  - Header renders correctly (logo, user avatar/menu, no layout regressions).  
  - Dropdown opens and closes as before; no missing icons or styling regressions.  
  - No console errors about missing `UserNav` exports or casing mismatches.

**Scenario 1 – Basic Socratic Chat with IST Extraction**

- [ ] **Do:**  
  - Run Scenario 1 as described in Baseline.
- [ ] **Observe:**  
  - Header remains stable while interacting with the chat.  
  - No flickering or re-mounting issues when navigating between course pages.

**Scenario 4 – /ist-dev/dataconnect Debug View**

- [ ] **Do:**  
  - Open `http://localhost:9002/ist-dev/dataconnect`.
- [ ] **Observe:**  
  - Header appears correctly on the debug page (if rendered inside `app-shell`).  
  - No navigation regressions when switching back to student/teacher pages.

**Scenario 6 – Teacher IST Class Report (Aggregated, JSON-First)**

- [ ] **Do:**  
  - Open `http://localhost:9002/teacher/courses/cs-demo-101?view=ist-report`.
- [ ] **Observe:**  
  - Teacher header shows the correct user/menu state (e.g., role “Teacher”, avatar).  
  - IST Class Report renders as before; no header-related errors in console.

### 6) Risk assessment

- **Overall Risk Level:** ☐ Low ☑ Medium ☐ High
- Rationale:
  - Header code is shared across many screens; small mistakes can affect all pages.
  - However, the change is localized to layout components and props, not deep application logic.

### 7) Gate criteria

- [ ] Exactly one `UserNav` implementation remains the canonical component; all imports updated.
- [ ] Visual inspection on Student and Teacher dashboards shows no regressions.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- [ ] UI Checks (Scenarios 1, 4, 6) all **Pass**.

**✅ Gate 3 – PR 3 may be merged only when this gate is marked ✅ and Execution Log is complete.**

### 8) Execution Log – PR 3

- **Status**:  
  - [ ] Not started  
  - [ ] In progress  
  - [ ] ✅ Done
- **PR link**: `...`  
- **Merged commit SHA**: `...`
- **Changes to `UserNav`**:  
  - Canonical component path: `...`  
  - Old implementation moved/removed: `...`
- **Commands run & results**:  
  - `npm run lint`: `Pass / Fail`  
  - `npm run typecheck`: `Pass / Fail`  
  - `npm run build`: `Pass / Fail`
- **UI Checks summary**:  
  - Scenario 1: `Pass / Fail` – Header notes: `...`  
  - Scenario 4: `Pass / Fail` – Header notes: `...`  
  - Scenario 6: `Pass / Fail` – Header notes: `...`
- **Unexpected issues**:  
  - [ ] `...`
- **Follow-up tasks**:  
  - [ ] `...`

---

## PR 4) IST Mode Clarity (docs + non-breaking logs; no behavior changes unless explicitly flagged)

### 1) Scope (exact target paths)

Clarify how IST “modes” work (API vs callable vs direct DSPy vs DataConnect-backed history), through documentation and logging only.

- [ ] `docs/REPOSITORY_OVERVIEW.md`  
  - Ensure current behavior is accurately described (Cloud Functions as canonical IST backend, Data Connect as primary history store, Genkit `analyze-message` as placeholder).
- [ ] `docs/IST-DB-Migration-Plan.md`  
  - Mark implemented vs planned items (e.g., which parts of `DataConnectIstEventRepository` are still TODO).
- [ ] `src/lib/ist/engine.ts`  
  - Add explicit comments for `NEXT_PUBLIC_IST_ENGINE_MODE` values (`api`, `callous`, etc.), and log a one-line summary at startup indicating which engine is active.
- [ ] `src/app/api/anizyze-message/route.ts` (typo in name if present – verify actual path is `src/app/api/analyze-message/route.ts`)  
  - Clarify in comments that this route currently uses the Genkit placeholder `analyzeMessage` flow and **does not** write to Firestore/Data Connect.
- [ ] `src/ai/flows/analyze-message.ts`  
  - Cross-link to the Cloud Function implementation, and call out clearly that production IST comes from `functions/src/analyzeMessage.ts` + DSPy + Data Connect.

> ⚠️ **Indirect UI impact:** Additional logging or clearer docs could change how operators interpret behavior. Ensure logs are concise and not noisy; do not log PII.

### 2) Non-goals

- [ ] Do **not** change which backend is actually used (no behavior change):
  - If `NEXT_PUBLIC_IST_ENGINE_MODE` is currently `api`, leave it as-is unless a separate, clearly-scoped PR is created.
  - Do not start reading IST history from new sources in this PR.
- [ ] Do **not** modify contract of `AnalyzeMessageRequest` / `MessageAnalysis`.
- [ ] Do **not** enable or disable Data Connect writes/reads here.

### 3) Steps

- [ ] Review current behavior and confirm:
  - Cloud Function `analyzeMessage` is the only path that writes to Firestore + Data Connect.
  - `/api/analyze-message` only calls Genkit `analyzeMessage` (placeholder) and returns a `MessageAnalysis` but does not persist it.
- [ ] Update docs to reflect:
  - The intended “canonical” IST mode (e.g., **callable `analyzeMessage` via Firebase Functions**).
  - How to switch `NEXT_PUBLIC_IST_ENGINE_MODE` between `api` and `callable`.
- [ ] Add minimal logging in `src/lib/ist/engine.ts`:
  - On first `getIstAnalysisEngine()` call, log something like:
    - `[IST] Engine mode: api – using /api/analyze-message (Genkit placeholder, no Firestore/DataConnect writes)` or  
    - `[IST] Engine mode: callable – using Cloud Function us-central1-analyzeMessage (writes Firestore + DataConnect)`.
- [ ] Re-run baseline UI tests to ensure no behavior changed.

### 4) Commands (lint/typecheck/build)

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`

### 5) UI Checks (from IST UI Test Plan)

**Required scenarios for PR 4:** 1, 2, 4  
Scenario 3 is required **if** you alter any Data Connect–related logging or docs; Scenario 6 recommended to confirm Teacher report is unaffected.

- [ ] **Scenario 1 – Basic Socratic Chat with IST Extraction**  
  - Verify tutor behavior and logs are unchanged except for the new, explicit engine-mode log line.
- [ ] **Scenario 2 – IST Event Stored in Data Connect**  
  - Confirm `analyzeMessage` still writes IST events and the new documentation matches observed behavior.
- [ ] **Scenario 4 – /ist-dev/dataconnect Debug View**  
  - Confirm Data Connect behavior and logs are consistent with the clarified docs and no new warnings or errors appear as a result of logging changes.
- [ ] **Scenario 3 – Frontend Reads IST History from Data Connect** (if logging changed)  
  - Confirm `[IST][Context] Loaded recent IST events ...` logs still appear and are not degraded.
- [ ] **Scenario 6 – Teacher IST Class Report (optional but recommended)**  
  - Sanity-check that teacher-facing UI is unaffected by IST mode logging changes.

### 6) Risk assessment

- **Overall Risk Level:** ☑ Low ☐ Medium ☐ High
- Rationale:
  - Purely documentation and logging; no intended behavior change.
  - Minimal risk from accidentally changing import paths or introducing typos that break builds.

### 7) Gate criteria

- [ ] All targeted docs clearly distinguish between:
  - Genkit `analyzeMessage` (placeholder, no persistence) and
  - Cloud Function `analyzeMessage` + Data Connect as primary IST pipeline.
- [ ] New logging in `src/lib/ist/engine.ts` is present, accurate, and not excessively noisy.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- [ ] Required UI Checks (Scenarios 1, 2, 4, plus 3 if relevant) all **Pass**.

**✅ Gate 4 – PR 4 may be merged only when this gate is marked ✅ and Execution Log is complete.**

### 8) Execution Log – PR 4

- **Status**:  
  - [ ] Not started  
  - [ ] In progress  
  - [ ] ✅ Done
- **PR link**: `...`  
- **Merged commit SHA**: `...`
- **Docs updated**:  
  - `docs/REPOSITORY_OVERVIEW.md`: `...`  
  - `docs/IST-DB-Migration-Plan.md`: `...`
- **Logging changes**:  
  - `src/lib/ist/engine.ts`: `...`  
- **Commands run & results**:  
  - `npm run lint`: `Pass / Fail`  
  - `npm run typecheck`: `Pass / Fail`  
  - `npm run build`: `Pass / Fail`
- **UI Checks summary**:  
  - Scenario 1: `Pass / Fail` – Notes: `...`  
  - Scenario 2: `Pass / Fail` – Notes: `...`  
  - Scenario 3 (if applicable): `Pass / Fail / N/A` – Notes: `...`  
  - Scenario 4: `Pass / Fail` – Notes: `...`  
  - Scenario 6 (optional): `Pass / Fail / Skipped` – Notes: `...`
- **Unexpected issues / open questions**:  
  - [ ] `...`
- **Follow-up tasks**:  
  - [ ] `...`

---

## PR 5) OPTIONAL – Decommission unused DSPy proxy route (only after evidence)

### 1) Scope (exact target paths)

- [ ] `src/app/api/dspy/intent-skill-trajectory/route.ts`
  - Proxy route from Next.js to `DSPY_SERVICE_URL || NEXT_PUBLIC_DSPY- SERVICE_URL || 'http://localhost:8000'` at `/api/intent-skill-trajectory`.

### 2) Preconditions / Evidence (must be explicit)

> **You may not proceed with removal until all of the following are satisfied.**

- [ ] **Usage analysis completed**:
  - `rg "api/dspy/intent-skill-trajectory" -n` shows **no** references in `src/**`, `tests/**`, `docs/**` (other than this checklist and original design docs).  
  - No other routes or clients (e.g., React components, external scripts) call this endpoint.
- [ ] **Runtime access logs reviewed**:
  - For a representative period (e.g., recent days/weeks), server logs show **zero** hits to `/api/dspy/intent-skill-trajectory`.  
  - If logs are not available, document this as a risk and prefer moving to `legacy/` instead of deleting.
- [ ] **Stakeholder confirmation (optional but recommended)**:
  - Product/tech lead has confirmed this route is not part of any active or near-term integration.

If **any** of the above are not satisfied, record that in the Execution Log and follow the “Do NOT proceed” path below.

### 3) Steps

**If evidence confirms “unused”:**

- [ ] Delete `src/app/api/dspy/intent-skill-trajectory/route.ts` **or** move it to `src/legacy/api/dspy/intent-skill-trajectory.route.ts` with a comment:
  - “Retired in PR #X – superseded by direct `/api/intent-skill-trajectory` in DSPy service / other mechanism.”
- [ ] Search for and remove any now-dead imports or references.

**If evidence is inconclusive:**

- [ ] Do **not** delete the file.  
- [ ] Optionally:
  - [ ] Move it to a `legacy` namespace but keep the route wired, **or**
  - [ ] Add a clear deprecation notice in the file header (comment-only), e.g.:
    - `// DEPRECATED: No known consumers as of 2026-01-12. Do not build new features on this route.`

### 4) Commands (lint/typecheck/build)

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`

### 5) UI Checks (from IST UI Test Plan)

**Required scenarios for PR 5 (if you actually remove or move the route):** 1, 2, 4, 6  
Scenario 3 is optional but recommended.

- [ ] **Scenario 1 / 2 / 3 / 4 / 6:**  
  - Re-run core student + DataConnect + teacher scenarios to ensure that removal of the proxy route does **not** break any existing UI or IST flows.
  - Confirm that `/api/dspy/quiz` and direct DSPy calls still function as expected.

### 6) Risk assessment

- **Overall Risk Level:** ☐ Low ☑ Medium ☐ High
- Rationale:
  - If misjudged, removing this route could break external integrations or hidden test tools.
  - However, internal code search suggests no current usage.

### 7) Gate criteria

- **If removed:**
  - [ ] All preconditions/evidence boxes checked and documented.
  - [ ] `npm run lint`, `npm run typecheck`, `npm run build` pass.
  - [ ] Required UI scenarios (1, 2, 4, 6) pass.
- **If not removed (insufficient evidence):**
  - [ ] File is clearly annotated as **deprecated** or moved to a `legacy` namespace.
  - [ ] A follow-up issue is filed to re-evaluate removal when more telemetry is available.

**✅ Gate 5 – PR 5 may be merged only when the chosen path (remove vs keep/deprecate) is documented and this gate is marked ✅.**

### 8) Execution Log – PR 5

- **Status**:  
  - [ ] Not started  
  - [ ] In progress  
  - [ ] ✅ Done
- **PR link**: `...`  
- **Merged commit SHA**: `...`
- **Decision** (select one):  
  - [ ] Route deleted (path: `...`)  
  - [ ] Route moved to legacy (new path: `...`)  
  - [ ] Route retained with deprecation notice
- **Evidence summary**:  
  - `rg` findings: `...`  
  - Access log review: `...`  
  - Stakeholder confirmation: `...`
- **Commands run & results**:  
  - `npm run lint`: `Pass / Fail`  
  - `npm run typecheck`: `Pass / Fail`  
  - `npm run build`: `Pass / Fail`
- **UI Checks summary**:  
  - Scenario 1: `Pass / Fail` – Notes: `...`  
  - Scenario 2: `Pass / Fail` – Notes: `...`  
  - Scenario 3 (optional): `Pass / Fail / N/A` – Notes: `...`  
  - Scenario 4: `Pass / Fail` – Notes: `...`  
  - Scenario 6: `Pass / Fail` – Notes: `...`
- **Unexpected issues / follow-ups**:  
  - [ ] `...`

---

## PR 6) Structure Polish (naming, legacy docs, gitignore policy)

### 1) Scope (exact target paths)

Final structural polish that does **not** change core behavior:

- [ ] **Naming consistency**
  - Normalize case and naming where safe (e.g., ensure layout component filenames and imports match casing on case-sensitive file systems).
  - Example candidates:
    - `src/components/layout/AppHeader.tsx` vs `src/components/layout/app-shell.tsx` – confirm conventions.
- [ ] **Legacy / documentation organization**
  - `docs/UI-EMULATOR.md`, `docs/IST_Pipeline_Status_Snapshot_*`, `project_v1_tree.txt` – consider moving historical documents into `docs/legacy/` with an index.
- [ ] **.gitignore / .npmignore / .eslintignore**
  - Ensure generated artifacts (`src/dataconnect-generated/**`, `functions/src/dataconnect-generated/**`, `tsconfig.tsbuildinfo`, `dataconnect-debug.log`, `pglite-debug.log`) are ignored appropriately.

> ⚠️ **Indirect UI impact:** Misconfigured ignore rules or renamed layout files can cause build failures or route resolution issues. Always re-run lint/typecheck/build and core UI scenarios.

### 2) Non-goals

- [ ] Do **not** change any import paths for runtime modules unless necessary for case-sensitivity or obvious correctness.
- [ ] Do **not** relocate `src/app/**`, `functions/src/**`, or `dspy_service/**` into new top-level directories.
- [ ] Do **not** change environment variable names or semantics.

### 3) Steps

- [ ] Audit naming and paths using `tree`, `ls`, and your editor’s symbol search.
- [ ] Propose minimal renames/moves that reduce confusion (e.g., move `project_v1_tree.txt` to `docs/legacy/project_v1_tree.md` with a short header).
- [ ] Update any references accordingly (docs, READMEs).
- [ ] Adjust `.gitignore` / `.npmignore` / `.eslintignore` as needed to:
  - Ignore generated code and local artifacts.
  - Keep real source and docs tracked.

### 4) Commands (lint/typecheck/build)

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`

### 5) UI Checks (quick smoke)

**Required scenarios for PR 6:** 1, 4, 6 (quick smoke).

- [ ] **Scenario 1 – Basic Socratic Chat with IST Extraction**  
  - Confirm student chat still works, no routing issues due to renamed files.
- [ ] **Scenario 4 – /ist-dev/dataconnect Debug View**  
  - Confirm dev/debug route still resolves; no 404 or import errors.
- [ ] **Scenario 6 – Teacher IST Class Report (Aggregated, JSON-First)**  
  - Confirm teacher report still renders; no broken static asset paths due to doc/asset moves.

### 6) Risk assessment

- **Overall Risk Level:** ☑ Low-to-Medium ☐ High
- Rationale:
  - Structural cleanups can trip build tooling or hosting config if not carefully tested.
  - However, they are largely non-functional changes when done carefully.

### 7) Gate criteria

- [ ] All agreed renames/moves are documented (before/after) in this PR or a dedicated doc.
- [ ] `.gitignore` / related configs accurately reflect desired source vs generated vs local artifacts.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- [ ] UI smoke tests (Scenarios 1, 4, 6) all **Pass**.

**✅ Gate 6 – PR 6 may be merged only when this gate is marked ✅ and Execution Log is complete.**

### 8) Execution Log – PR 6

- **Status**:  
  - [ ] Not started  
  - [ ] In progress  
  - [ ] ✅ Done
- **PR link**: `...`  
- **Merged commit SHA**: `...`
- **Structural changes applied**:  
  - Naming cleanups: `...`  
  - Legacy docs moved: `...`  
  - Ignore rules updated: `...`
- **Commands run & results**:  
  - `npm run lint`: `Pass / Fail`  
  - `npm run typecheck`: `Pass / Fail`  
  - `npm run build`: `Pass / Fail`
- **UI smoke tests summary**:  
  - Scenario 1: `Pass / Fail` – Notes: `...`  
  - Scenario 4: `Pass / Fail` – Notes: `...`  
  - Scenario 6: `Pass / Fail` – Notes: `...`
- **Unexpected issues / future cleanup ideas**:  
  - [ ] `...`

---

## Appendix A) IST UI Test Plan Summary

Reference: `docs/ist-ui-test-plan.md`

| Scenario # | Name                                                  | Primary URL / Tool                                           | Key Observations / Pass Criteria                                                                                         |
|-----------|--------------------------------------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| 1         | Basic Socratic Chat with IST Extraction               | `http://localhost:9002/student/courses/cs202`               | Tutor responds; no errors; Functions show `analyzeMessage` logs; DSPy logs show `Processing request` and `Returning ...`. |
| 2         | IST Event Stored in Data Connect                       | `http://localhost:9002/student/courses/cs202` + Functions   | `analyzeMessage` logs `About to save IST event ...` and `DataConnect save completed ...`; no Data Connect errors.       |
| 3         | Frontend Reads IST History from Data Connect          | `http://localhost:9002/student/courses/cs202` + logs        | Next.js logs `Loaded recent IST events` and `Loaded recent chat messages`; DSPy logs `Received chat_history/ist_history`.|
| 4         | `/ist-dev/dataconnect` Debug View                     | `http://localhost:9002/ist-dev/dataconnect`                 | List of IST events with `utterance`, `intent`, `skills`, `trajectory`, `createdAt`, `threadId`, `messageId`, `userId`.   |
| 5         | Gemini Quota / Error Behavior (Optional)              | `http://localhost/` + Next.js logs                          | `socraticCourseChat` logs fallback message; UI shows friendly error text; IST pipeline (Functions/DSPy/DC) still works. |
| 6         | Teacher IST Class Report (Aggregated, JSON-First)     | `http://localhost:9002/teacher/courses/cs-demo-101?view=...`| Aggregated IST dashboard loads; metrics approx as documented; no PII; JSON fetch from `/mocks/ist/teacher-class-events`.|

> For each PR, reference this table to select which scenarios to run, then consult the full `ist-ui-test-plan.md` for detailed steps and expected logs.

---

## Appendix B) Standard Command Set

Use these commands as a reference when filling in the “Commands” sections of each PR’s checklist.

### Baseline / Build & Typecheck

```bash
# From repo root
npm install
npm run lint
npm run typecheck
npm run build
```

### Start Required Services

**Terminal A – DSPy service**

```bash
cd dspy_service
.\venv\Scripts\Activate.ps1   # Windows PowerShell
python -m uvicorn app:app --reload --port 8000
```

**Terminal B – Firebase emulators (Functions + Firestore + Data Connect)**

```bash
firebase emulators:start
```

**Terminal C – Next.js dev server**

```bash
cd path\to\CourseLLM-Project\CourseLLM-Firebase--miluimnikim-osher-extract-works
npm run dev
```

### Optional – Jest / Unit Tests (when configured)

```bash
# Run all tests (once a "test" script exists)
npm test

# Or run a specific suite, e.g. teacher IST report analytics
npx jest src/features/ist/reports/teacherIstReport.test.ts
```

### Common Diagnostics

```bash
# Search for route usages
rg "api/dspy/intent-skill-trajectory" -n

# Search for IST engine mode usage
rg "NEXT_PUBLIC_IST_ENGINE_MODE" -n

# List generated Data Connect artifacts
ls src/dataconnect-generated
ls functions/src/dataconnect-generated

# Inspect emulator logs
Get-Content .\dataconnect-debug.log -Tail 50
Get-Content .\pglite-debug.log -Tail 50
```

Use this appendix as a quick reference while executing each PR in the Phase 5 cleanup plan.


