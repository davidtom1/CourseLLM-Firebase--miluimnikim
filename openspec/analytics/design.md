# Analytics Feature - Design Document

## Architecture Overview

The Analytics feature follows a **pure computation architecture** where report generation is decoupled from data storage. The core algorithm is JSON-first and storage-agnostic, enabling flexible deployment across mock data, Firestore, or DataConnect.

```
┌─────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                         │
│  TeacherClassIstReport (detailed)  │  Dashboard (summary)       │
│  AnalyticsChart (visualization)                                  │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       COMPUTATION LAYER                          │
│  computeTeacherIstClassReportV2()                               │
│  normalizeSkill()                                                │
│  calculateTrends()                                               │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  Mock JSON: /public/mocks/ist/teacher-class-events.json         │
│  Repository: IstEventRepository.findByCourse()                  │
│  DataConnect: IstEventsByCourse query (future)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Report Computation Engine

**Location**: `src/features/ist/reports/teacherIstReport.ts`

**Purpose**: Pure function that transforms IST events into actionable insights.

**Design Decisions**:
- **Pure Function**: No side effects, easy to test
- **JSON-First**: Works with plain objects, no ORM dependencies
- **Defensive Parsing**: Handles malformed data gracefully
- **Configurable Thresholds**: Options object for customization

**Algorithm Overview**:
```typescript
function computeTeacherIstClassReportV2(
  events: IstEvent[],
  courseId: string,
  options?: TeacherIstClassReportOptions
): TeacherIstClassReport {
  // 1. Filter by courseId
  const courseEvents = events.filter(e => e.courseId === courseId);

  // 2. Initialize counters
  const skillCounts = new Map<string, number>();
  let totalSkillAssignments = 0;
  let eventsWithSkills = 0;

  // 3. Process each event
  for (const event of courseEvents) {
    const normalizedSkills = new Set<string>();

    if (Array.isArray(event.skills)) {
      for (const skill of event.skills) {
        const normalized = normalizeSkill(skill);
        if (normalized) normalizedSkills.add(normalized);
      }
    }

    if (normalizedSkills.size > 0) {
      eventsWithSkills++;
      for (const skill of normalizedSkills) {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
        totalSkillAssignments++;
      }
    }
  }

  // 4. Calculate metrics
  const topSkills = calculateTopSkills(skillCounts, totalSkillAssignments);
  const gaps = calculateGaps(skillCounts, totalSkillAssignments, options?.gapThreshold);
  const trends = calculateTrends(courseEvents, options?.anchorDate);
  const coverage = calculateCoverage(topSkills);
  const dataQuality = calculateDataQuality(courseEvents);

  // 5. Return structured report
  return { courseId, totalEvents, topSkills, gaps, trends, coverage, dataQuality, ... };
}
```

### 2. TeacherClassIstReport Component

**Location**: `src/app/teacher/courses/[courseId]/_components/TeacherClassIstReport.tsx`

**Purpose**: Interactive UI for exploring class IST report.

**Design Decisions**:
- **Lazy Loading**: Report generated on demand
- **Search Filtering**: Client-side skill search
- **Expandable Sections**: Progressive disclosure of details
- **Status States**: Clear feedback for loading/empty/error

**Component Structure**:
```typescript
function TeacherClassIstReport({ courseId }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [report, setReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  async function generateReport() {
    setStatus('loading');
    try {
      const events = await loadMockEvents();
      const computed = computeTeacherIstClassReportV2(events, courseId);
      setReport(computed);
      setStatus(computed.totalEvents > 0 ? 'success' : 'empty');
    } catch (error) {
      setStatus('error');
    }
  }

  const filteredSkills = useMemo(() => {
    if (!report) return [];
    return report.topSkills.filter(s =>
      s.skill.includes(searchTerm.toLowerCase())
    );
  }, [report, searchTerm]);

  return (
    <div>
      <ExecutiveSummary report={report} />
      <TrendsSection trends={report?.trends} />
      <SkillsSection skills={filteredSkills} onSearch={setSearchTerm} />
      <GapsSection gaps={report?.gaps} />
      <DataQualitySection quality={report?.dataQuality} />
    </div>
  );
}
```

### 3. AnalyticsChart Component

**Location**: `src/components/teacher/AnalyticsChart.tsx`

**Purpose**: Reusable bar chart for skill/topic visualization.

**Design Decisions**:
- **Recharts Library**: Industry-standard React charting
- **Responsive Container**: Adapts to parent width
- **Accessible Tooltips**: Hover reveals details
- **Consistent Styling**: Matches app color scheme

**Implementation**:
```typescript
function AnalyticsChart({ data }: { data: ChartData[] }) {
  return (
    <ChartContainer className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="topic"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tickFormatter={(v) => `${v}%`} />
          <ChartTooltip content={<CustomTooltip />} />
          <Bar dataKey="mastery" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
```

---

## Data Flow Diagrams

### Flow 1: Report Generation

```
Teacher clicks "Generate Report" button
          │
          ▼
TeacherClassIstReport.generateReport()
          │
          ├─→ setStatus('loading')
          │
          ├─→ fetch('/mocks/ist/teacher-class-events.json')
          │        │
          │        ▼
          │   Parse JSON → IstEvent[]
          │
          ├─→ computeTeacherIstClassReportV2(events, courseId)
          │        │
          │        ├─→ Filter events by courseId
          │        ├─→ Normalize and count skills
          │        ├─→ Calculate trends (7-day comparison)
          │        ├─→ Identify gaps (below threshold)
          │        ├─→ Assess data quality
          │        └─→ Return TeacherIstClassReport
          │
          ├─→ setReport(computed)
          │
          └─→ setStatus('success' | 'empty')
                    │
                    ▼
          UI renders report sections
```

### Flow 2: Skill Search

```
Teacher types in search input
          │
          ▼
setSearchTerm(value)
          │
          ▼
useMemo recalculates filteredSkills
          │
          ├─→ report.topSkills.filter(skill.includes(searchTerm))
          │
          └─→ Re-render skills table with filtered results
```

---

## Data Structures

### IST Event (Input)

```typescript
interface IstEvent {
  id: string;
  createdAt: string;        // ISO 8601 timestamp
  userId?: string;          // Optional, not used in aggregation
  courseId?: string;        // Filter key
  utterance: string;        // Original student message
  intent: string;           // Extracted intent
  skills: string[];         // Target for aggregation
  trajectory: string[];     // Learning path (unused currently)
}
```

### Report (Output)

```typescript
interface TeacherIstClassReport {
  // Identification
  courseId: string;

  // Event Metrics
  totalEvents: number;
  eventsWithSkills: number;
  firstEventAt: string | null;
  lastEventAt: string | null;

  // Skill Metrics
  uniqueSkillsCount: number;
  totalSkillAssignments: number;
  avgSkillsPerEvent: number;
  avgSkillsPerSkilledEvent: number;

  // Top Skills
  topSkills: SkillEntry[];
  coverage: {
    top1Share: number;
    top5Share: number;
    top10Share: number;
    longTailShare: number;
  };

  // Gaps
  gaps: SkillEntry[];
  gapThreshold: number;
  gapsCount: number;

  // Trends
  trends: {
    last7Days: WindowMetrics;
    prev7Days: WindowMetrics;
    delta: DeltaMetrics;
    risingSkills: SkillDelta[];
    decliningSkills: SkillDelta[];
  };

  // Data Quality
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

### 1. IST Events Data Source

**Current Implementation**: Mock JSON file

**File Path**: `/public/mocks/ist/teacher-class-events.json`

**Loading Pattern**:
```typescript
const response = await fetch('/mocks/ist/teacher-class-events.json');
const events: IstEvent[] = await response.json();
```

**Future Implementation**: Repository pattern

```typescript
const events = await getIstEventRepository().findByCourse(courseId);
```

### 2. Teacher Dashboard Integration

**Purpose**: Summary view with key metrics.

**Location**: `src/app/teacher/dashboard/page.tsx`

**Data Sources**:
- Mock ANALYTICS_DATA for mastery chart
- Mock student counts for summary cards

**Components Used**:
- Card components for KPIs
- AnalyticsChart for visualization

### 3. Course Management Integration

**Purpose**: Embedded report within course tabs.

**Location**: `src/app/teacher/courses/[courseId]/_components/course-management-client.tsx`

**Tab Structure**:
```typescript
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="materials">Materials</TabsTrigger>
    <TabsTrigger value="ist-report">IST Report</TabsTrigger>
  </TabsList>
  <TabsContent value="ist-report">
    <TeacherClassIstReport courseId={courseId} />
  </TabsContent>
</Tabs>
```

### 4. Recharts Integration

**Library**: recharts@2.15.1

**Components Used**:
- `ResponsiveContainer` - Auto-sizing wrapper
- `BarChart` - Main chart type
- `CartesianGrid` - Background grid
- `XAxis` / `YAxis` - Axis configuration
- `Tooltip` - Hover information
- `Bar` - Data bars

**Custom Wrapper**: `ChartContainer` from `@/components/ui/chart`

---

## Error Handling Strategy

### 1. Data Loading Errors

- **Network Failure**: Show error state with retry button
- **Invalid JSON**: Log error, show user-friendly message
- **Empty Response**: Show "No data available" state

### 2. Computation Errors

- **Missing Fields**: Skip event, increment quality counter
- **Invalid Skills**: Normalize returns null, skip entry
- **Date Parsing**: Use fallback date, log warning

### 3. UI Errors

- **Render Failure**: Error boundary catches, shows fallback
- **Search Edge Cases**: Empty search shows all results

---

## Performance Considerations

### Current Optimizations

1. **Lazy Loading**: Report generated only on button click
2. **useMemo**: Filtered skills recalculated only when dependencies change
3. **Client-Side Search**: No server round-trip for filtering
4. **Progressive Disclosure**: Gaps list initially shows first 20

### Future Optimizations

1. **Pagination**: For reports with 1000+ skills
2. **Server-Side Generation**: For large event sets
3. **Caching**: Store computed reports with TTL
4. **Virtual Scrolling**: For very long skill lists
