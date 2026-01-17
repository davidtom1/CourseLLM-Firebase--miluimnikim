# Analytics Feature - Specification

## Feature Overview

The Analytics feature provides **teacher dashboards and reports** that aggregate IST (Intent-Skill-Trajectory) data to reveal class-wide learning patterns. Teachers can identify skill gaps, track trends over time, and make data-driven instructional decisions.

---

## User Stories

### US-ANA-001: View Class Skill Distribution
**As a** teacher
**I want to** see which skills my class is practicing most
**So that** I can identify curriculum coverage gaps

**Acceptance Criteria**:
- Top 10 skills displayed with frequency counts
- Share percentages show relative coverage
- Skills sorted by frequency (descending)

### US-ANA-002: Identify Skill Gaps
**As a** teacher
**I want to** see skills that are rarely practiced
**So that** I can adjust my teaching to address gaps

**Acceptance Criteria**:
- Gap threshold configurable (default: 2%)
- Skills below threshold flagged as gaps
- Gaps list expandable for full view

### US-ANA-003: Track Weekly Trends
**As a** teacher
**I want to** compare this week's engagement to last week
**So that** I can see if interventions are working

**Acceptance Criteria**:
- Last 7 days vs Previous 7 days comparison
- Rising and declining skills highlighted
- Percentage change displayed

### US-ANA-004: Monitor Data Quality
**As a** teacher
**I want to** know if the data is reliable
**So that** I can trust the insights

**Acceptance Criteria**:
- Count of events missing skills
- Count of invalid skill entries
- Quality metrics clearly displayed

---

## Functional Requirements

### FR-ANA-001: Class Report Generation
- System SHALL aggregate IST events by courseId
- System SHALL normalize skills (lowercase, trim, deduplicate per event)
- System SHALL compute frequency counts across all events
- System SHALL calculate share percentages

### FR-ANA-002: Skill Gap Detection
- System SHALL identify skills below threshold
- System SHALL support configurable gap threshold (default: 2%)
- System SHALL sort gaps by frequency (ascending)

### FR-ANA-003: Trend Analysis
- System SHALL compare last 7 days vs previous 7 days
- System SHALL identify top 5 rising skills
- System SHALL identify top 5 declining skills
- System SHALL calculate percentage changes

### FR-ANA-004: Data Quality Reporting
- System SHALL count events missing skills field
- System SHALL count events with non-array skills
- System SHALL count events with empty skills arrays
- System SHALL count dropped invalid skill entries

---

## Non-Functional Requirements

### NFR-ANA-001: Performance
- Report generation: < 2 seconds for 10,000 events
- UI render: < 500ms after data load
- No blocking of other UI operations

### NFR-ANA-002: Privacy
- Reports show aggregated data only
- No individual student identifiers
- No message content displayed
- Course-level isolation

### NFR-ANA-003: Accuracy
- Skill normalization consistent
- Share percentages sum to 100% (±0.1% rounding)
- Trend calculations use UTC day boundaries

---

## API Contracts

### Report Generation Function

**Function**: `computeTeacherIstClassReportV2()`

**Input**:
```typescript
{
  events: IstEvent[];           // Raw IST events
  courseId: string;             // Filter by course
  options?: {
    maxSkills?: number;         // Default: 10
    gapThreshold?: number;      // Default: 0.02 (2%)
  }
}
```

**Output**:
```typescript
{
  courseId: string;
  totalEvents: number;
  eventsWithSkills: number;
  uniqueSkillsCount: number;
  totalSkillAssignments: number;
  avgSkillsPerEvent: number;
  avgSkillsPerSkilledEvent: number;
  firstEventAt: string | null;
  lastEventAt: string | null;

  topSkills: Array<{
    skill: string;
    count: number;
    share: number;
  }>;

  coverage: {
    top1Share: number;
    top5Share: number;
    top10Share: number;
    longTailShare: number;
  };

  gaps: Array<{
    skill: string;
    count: number;
    share: number;
  }>;
  gapThreshold: number;
  gapsCount: number;

  trends: {
    last7Days: { events: number; skillAssignments: number };
    prev7Days: { events: number; skillAssignments: number };
    delta: {
      eventsDiff: number;
      eventsPctChange: number | null;
      skillAssignmentsDiff: number;
      skillAssignmentsPctChange: number | null;
    };
    risingSkills: Array<{ skill: string; diff: number }>;
    decliningSkills: Array<{ skill: string; diff: number }>;
  };

  dataQuality: {
    eventsMissingSkillsField: number;
    eventsSkillsNotArray: number;
    eventsEmptySkillsArray: number;
    invalidSkillEntriesDropped: number;
  };
}
```

---

## Integration Specs

### 1. IST Events Integration

**Purpose**: Consume IST events as primary data source.

**Data Source**: IST events stored via repository pattern.

**Event Structure**:
```typescript
IstEvent {
  id: string;
  createdAt: string;      // ISO timestamp
  userId?: string;
  courseId?: string;
  utterance: string;
  intent: string;
  skills: string[];       // Primary aggregation target
  trajectory: string[];
}
```

**Loading Pattern**:
```typescript
// From mock data
const events = await fetch('/mocks/ist/teacher-class-events.json').then(r => r.json());

// From repository
const events = await getIstEventRepository().findByCourse(courseId);
```

### 2. Teacher Dashboard Integration

**Purpose**: Display summary KPIs on teacher overview page.

**Components Used**:
- Summary cards (Total Students, At-Risk, Most Practiced)
- AnalyticsChart (bar chart for topic mastery)

**File**: `src/app/teacher/dashboard/page.tsx`

### 3. Course Report Integration

**Purpose**: Detailed IST class report within course management.

**Integration Point**: TeacherClassIstReport embedded in course tabs.

**Flow**:
```
Course Management Page → Tabs → "IST Report" Tab
                                      │
                                      ▼
                         TeacherClassIstReport component
                                      │
                                      ▼
                         computeTeacherIstClassReportV2()
                                      │
                                      ▼
                         Display: Summary, Trends, Skills, Gaps
```

### 4. DataConnect Integration (Future)

**Purpose**: Query IST events from production database.

**Query Pattern**:
```graphql
query IstEventsByCourse($courseId: String!) {
  istEvents(where: { courseId: { eq: $courseId } }) {
    id
    createdAt
    skills
    intent
    trajectory
  }
}
```

### 5. Visualization Integration

**Library**: Recharts

**Components**:
- `BarChart` for topic mastery
- `ChartContainer` wrapper
- `ChartTooltip` for hover details

**Configuration**:
```typescript
<BarChart data={skillData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="skill" />
  <YAxis tickFormatter={(v) => `${v}%`} />
  <Tooltip />
  <Bar dataKey="share" fill="#4f46e5" />
</BarChart>
```

---

## UI Components

### TeacherClassIstReport

**Location**: `src/app/teacher/courses/[courseId]/_components/TeacherClassIstReport.tsx`

**Props**:
```typescript
{
  courseId: string;
}
```

**Sections**:
1. **Executive Summary**: 8 KPI cards
2. **Trends**: Last 7 vs Prev 7 comparison, rising/declining skills
3. **Top Skills**: Searchable table with share percentages
4. **Skill Gaps**: Skills below threshold
5. **Data Quality**: Validation metrics

**State**:
- `status`: 'idle' | 'loading' | 'success' | 'empty' | 'error'
- `report`: TeacherIstClassReport | null
- `searchTerm`: string (for skill filtering)

### AnalyticsChart

**Location**: `src/components/teacher/AnalyticsChart.tsx`

**Props**:
```typescript
{
  data: Array<{ topic: string; mastery: number }>;
}
```

**Features**:
- Responsive container
- Formatted Y-axis (percentages)
- Tooltips on hover

---

## Data Processing

### Skill Normalization Algorithm

```typescript
function normalizeSkill(raw: string): string | null {
  // 1. Trim whitespace
  let normalized = raw.trim();

  // 2. Collapse internal whitespace
  normalized = normalized.replace(/\s+/g, ' ');

  // 3. Lowercase
  normalized = normalized.toLowerCase();

  // 4. Validate alphanumeric content
  if (!/[a-z0-9]/.test(normalized)) {
    return null;  // Reject punctuation-only
  }

  return normalized;
}
```

### Trend Calculation Algorithm

```typescript
function calculateTrends(events: IstEvent[], anchorDate: Date) {
  // 1. Calculate UTC day index for anchor
  const anchorDay = Math.floor(anchorDate.getTime() / 86400000);

  // 2. Define windows
  const last7Start = anchorDay - 6;
  const prev7Start = anchorDay - 13;

  // 3. Partition events into windows
  const last7Events = events.filter(e => getDayIndex(e) >= last7Start);
  const prev7Events = events.filter(e => getDayIndex(e) >= prev7Start && getDayIndex(e) < last7Start);

  // 4. Count skills in each window
  const last7Skills = countSkills(last7Events);
  const prev7Skills = countSkills(prev7Events);

  // 5. Calculate rising/declining
  const rising = findRising(last7Skills, prev7Skills);
  const declining = findDeclining(last7Skills, prev7Skills);

  return { last7Days, prev7Days, delta, risingSkills, decliningSkills };
}
```

---

## Environment Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| Mock data path | `/public/mocks/ist/teacher-class-events.json` | Development |
| Gap threshold | Configurable per report | 0.02 (2%) |
| Max skills | Top N skills to display | 10 |
