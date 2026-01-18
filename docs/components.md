# CourseLLM Component Map

This document maps UI elements visible to users to their source code locations. Use this to navigate the codebase when verifying or debugging frontend behavior.

---

## Student Interface Components

### Chat Interface

| UI Element | Description | Source File | CSS Selector / Identifier |
|------------|-------------|-------------|---------------------------|
| Chat Panel | Main chat container with input and messages | `src/app/student/courses/[courseId]/_components/chat-panel.tsx` | Card component with "Socratic Tutor" title |
| Chat Input | Text field for entering questions | Same as above | `input[placeholder="Ask a question..."]` |
| Send Button | Button to submit message | Same as above | `button[type="submit"]` |
| User Message (Blue Bubble) | Student's sent messages | Same as above | `.bg-primary.text-primary-foreground` |
| Bot Message (Gray Bubble) | AI tutor responses | Same as above | `.bg-muted` |
| Loading Spinner | Shown while waiting for AI response | Same as above | `Loader2` icon with `animate-spin` |
| Bot Avatar | Avatar icon for AI messages | Same as above | Avatar with `Bot` icon fallback |

### Intent Inspector

| UI Element | Description | Source File | CSS Selector / Identifier |
|------------|-------------|-------------|---------------------------|
| Intent Inspector Panel | Displays IST analysis for a message | `src/components/IntentInspector.tsx` | Contains "Intent Inspector" heading |
| Primary Intent | Main detected intent label | Same as above | Text after "Primary Intent:" |
| All Intents | List of all intent labels | Same as above | Text after "All Intents:" |
| Skills Section | List of detected skills | Same as above | `<h3>Skills</h3>` followed by `<ul>` |
| Skill Item | Individual skill with confidence | Same as above | `<li>` with skill name, confidence, role |
| Trajectory Status | Current learning trajectory | Same as above | Text after "Status:" |
| Current Nodes | Active learning graph nodes | Same as above | Text after "Current Nodes:" |
| Suggested Next Nodes | AI-recommended next topics | Same as above | List after "Suggested Next Nodes" |
| Loading State | Shown while fetching analysis | Same as above | "Loading analysis..." text |
| Error State | Shown on Firestore error | Same as above | Text with `color: crimson` |

### Course Materials

| UI Element | Description | Source File | CSS Selector / Identifier |
|------------|-------------|-------------|---------------------------|
| Course Detail Page | Main course view with materials + chat | `src/app/student/courses/[courseId]/page.tsx` | Two-column grid layout |
| Course Materials Card | Scrollable list of materials | Same as above | Card with "Course Materials" title |
| Material Item | Individual material (PDF/PPT/DOC) | Same as above | `.border.rounded-lg.bg-muted/50` |
| Material Type Badge | Shows file type (PDF, PPT, etc.) | Same as above | `.bg-background.px-2.py-1.rounded-full` |

---

## Teacher Interface Components

### Teacher Dashboard

| UI Element | Description | Source File | CSS Selector / Identifier |
|------------|-------------|-------------|---------------------------|
| Dashboard Page | Main teacher analytics overview | `src/app/teacher/dashboard/page.tsx` | "Analytics Overview" heading |
| Total Students Card | Shows student count | Same as above | Card with `Users` icon |
| At-Risk Students Card | Highlights struggling students | Same as above | Card with `AlertTriangle` icon, yellow border |
| Most Practiced Topic Card | Shows trending topic | Same as above | Card with `BarChart3` icon |
| Analytics Chart | Bar chart of mastery levels | `src/components/teacher/AnalyticsChart.tsx` | Recharts `BarChart` component |

### IST Class Report

| UI Element | Description | Source File | CSS Selector / Identifier |
|------------|-------------|-------------|---------------------------|
| IST Report Card | Container for class-wide IST analytics | `src/app/teacher/courses/[courseId]/_components/TeacherClassIstReport.tsx` | Card with "IST Class Report" title |
| Generate Report Button | Triggers report computation | Same as above | `<Button>` with "Generate IST Class Report" text |
| Executive Summary | Key metrics grid | Same as above | Section with "Executive Summary" heading |
| Total Events Stat | Count of IST events | Same as above | Box with "Total events" label |
| Unique Skills Stat | Count of distinct skills | Same as above | Box with "Unique skills" label |
| Top Skills Table | Most frequent skills | Same as above | Table under "Top skills (by frequency)" |
| Skill Gaps Table | Under-represented skills | Same as above | Table under "Potential skill gaps" |
| Trends Section | 7-day comparison | Same as above | Section with "Trends" heading |
| Rising Skills List | Skills increasing in frequency | Same as above | List under "Rising skills (top 5)" |
| Declining Skills List | Skills decreasing in frequency | Same as above | List under "Declining skills (top 5)" |
| Data Quality Section | Data integrity metrics | Same as above | Section with "Data quality" heading |
| Empty State Alert | Shown when no data | Same as above | Alert with "No IST events found" |
| Error State Alert | Shown on fetch error | Same as above | Alert with "Could not generate report" |

---

## Shared UI Components

### Layout Components

| UI Element | Description | Source File |
|------------|-------------|-------------|
| App Shell | Main layout wrapper with sidebar | `src/components/layout/app-shell.tsx` |
| User Navigation | User menu in header | `src/components/layout/user-nav.tsx` |
| Sidebar | Navigation sidebar | `src/components/ui/sidebar.tsx` |

### Auth Components

| UI Element | Description | Source File |
|------------|-------------|-------------|
| Auth Provider | Firebase auth context | `src/components/AuthProviderClient.tsx` |
| Mock Auth Provider | Emulator auth context | `src/components/AuthProviderMock.tsx` |
| Role Guard | RBAC route protection | `src/components/RoleGuardClient.tsx` |
| Auth Redirector | Post-login routing | `src/components/AuthRedirector.tsx` |

### Base UI Components (Radix-based)

| Component | Source File |
|-----------|-------------|
| Button | `src/components/ui/button.tsx` |
| Card | `src/components/ui/card.tsx` |
| Input | `src/components/ui/input.tsx` |
| Alert | `src/components/ui/alert.tsx` |
| Avatar | `src/components/ui/avatar.tsx` |
| Badge | `src/components/ui/badge.tsx` |
| ScrollArea | `src/components/ui/scroll-area.tsx` |
| Tabs | `src/components/ui/tabs.tsx` |
| Table | `src/components/ui/table.tsx` |
| Toast | `src/components/ui/toast.tsx` |
| Tooltip | `src/components/ui/tooltip.tsx` |

---

## Debug Pages

| Page | URL | Source File | Purpose |
|------|-----|-------------|---------|
| Debug Analysis | `/debug-analysis` | `src/app/debug-analysis/page.tsx` | Test IST engine with sample message |
| IST Visualizer | `/debug/ist-visualizer` | `src/app/debug/ist-visualizer/page.tsx` | View raw JSON from IST analysis |

---

## Data Flow Reference

```
User Input (chat-panel.tsx)
    │
    ├──► socraticCourseChat() ──► Genkit AI ──► Bot Response
    │
    └──► analyzeAndStoreIstForMessage() ──► /api/analyze-message
                                                │
                                                ▼
                                         Python DSPy Service (port 8000)
                                                │
                                                ▼
                                         Firestore (threads/{id}/analysis/{msgId})
                                                │
                                                ▼
                                         IntentInspector.tsx (real-time listener)
```

---

## Test Selectors Reference

For E2E testing with Playwright, use these selectors:

```typescript
// Student Chat
const chatInput = page.locator('input[placeholder="Ask a question..."]');
const sendButton = page.locator('button[type="submit"]');
const userMessages = page.locator('.bg-primary');
const botMessages = page.locator('.bg-muted');

// Intent Inspector
const skillsSection = page.locator('text=Skills');
const loadingState = page.locator('text=Loading analysis...');

// Teacher Report
const generateReportBtn = page.locator('text=Generate IST Class Report');
const executiveSummary = page.locator('text=Executive Summary');
const noDataAlert = page.locator('text=No IST events found');
```

