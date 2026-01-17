# Analytics Feature - Implementation Plan

## Current State Assessment

### Implemented Components
- [x] Report computation engine (`teacherIstReport.ts`)
- [x] TeacherClassIstReport UI component
- [x] AnalyticsChart visualization
- [x] Teacher dashboard with summary cards
- [x] Mock data structure for development
- [x] Skill normalization algorithm
- [x] Trend calculation (7-day comparison)
- [x] Data quality metrics

### Known Gaps
- [ ] Real database integration (using mock JSON)
- [ ] Export functionality (CSV/PDF)
- [ ] Student-level drill-down
- [ ] Historical trend comparison (beyond 14 days)
- [ ] Automated alerts for concerning patterns

---

## Implementation Roadmap

### Phase 1: Core Stability (Current)

**Goal**: Reliable report generation in development environment.

**Tasks**:
1. Verify mock data structure matches IstEvent type
2. Test skill normalization edge cases
3. Validate trend calculations with known data
4. Confirm UI renders all report sections

**Acceptance Criteria**:
- Report generates without errors
- All sections display correct data
- Search filtering works as expected
- Data quality metrics accurately reflect input

---

### Phase 2: Database Integration

**Goal**: Connect to real IST events from production storage.

**Tasks**:
1. Implement DataConnect query for IST events by course
2. Create repository method: `findByCourse(courseId)`
3. Update TeacherClassIstReport to use repository
4. Add loading state for database queries

**Technical Approach**:
```typescript
// DataConnect query
query IstEventsByCourse($courseId: String!) {
  istEvents(
    where: { courseId: { eq: $courseId } }
    orderBy: { createdAt: DESC }
    limit: 10000
  ) {
    id
    createdAt
    skills
    intent
    trajectory
  }
}

// Repository implementation
class DataConnectIstEventRepository implements IstEventRepository {
  async findByCourse(courseId: string): Promise<IstEvent[]> {
    const result = await executeQuery(istEventsByCourseRef({ courseId }));
    return result.data.istEvents;
  }
}
```

**Acceptance Criteria**:
- Reports use real database data
- Performance < 2 seconds for 10,000 events
- Fallback to mock data if database unavailable

---

### Phase 3: Export Functionality

**Goal**: Teachers can export reports for external use.

**Tasks**:
1. Implement CSV export for skill data
2. Implement PDF export for full report
3. Add export buttons to UI
4. Include metadata in exports (date, course, filters)

**Technical Approach**:
```typescript
// CSV export
function exportToCsv(report: TeacherIstClassReport) {
  const headers = ['Skill', 'Count', 'Share (%)'];
  const rows = report.topSkills.map(s => [s.skill, s.count, (s.share * 100).toFixed(1)]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

// PDF export (using jsPDF or similar)
function exportToPdf(report: TeacherIstClassReport) {
  const doc = new jsPDF();
  doc.text(`IST Class Report - ${report.courseId}`, 20, 20);
  // Add sections...
  doc.save(`ist-report-${report.courseId}.pdf`);
}
```

**Acceptance Criteria**:
- CSV downloads with correct data
- PDF includes all report sections
- Files named with course ID and date
- Export completes in < 5 seconds

---

### Phase 4: Enhanced Visualizations

**Goal**: Richer visual insights for teachers.

**Tasks**:
1. Add skill distribution pie chart
2. Implement time-series chart for trends
3. Add heatmap for skill × student matrix (aggregated)
4. Create skill clustering visualization

**Visualization Types**:
- **Pie Chart**: Top 10 skill distribution
- **Line Chart**: Skills over time (daily/weekly)
- **Heatmap**: Skill frequency by day of week
- **Bubble Chart**: Skill clusters by frequency and recency

**Acceptance Criteria**:
- Charts load within 1 second
- Responsive design for all screen sizes
- Accessible color schemes
- Tooltips provide detailed information

---

### Phase 5: Alerts and Notifications

**Goal**: Proactive insights for teachers.

**Tasks**:
1. Define alert thresholds (e.g., skill usage drop > 50%)
2. Implement alert detection algorithm
3. Create notification UI component
4. Add email digest option (weekly summary)

**Alert Types**:
- **Skill Decline**: Skill dropped by > 30% week-over-week
- **Gap Detected**: New skill below threshold for 2+ weeks
- **Engagement Drop**: Total events decreased significantly
- **Quality Issue**: > 10% of events have data problems

**Acceptance Criteria**:
- Alerts appear on dashboard
- Teachers can dismiss/snooze alerts
- Email digests delivered on schedule (if enabled)

---

## Integration Specs

### Dependencies on Other Systems

| System | Dependency Type | Integration Point |
|--------|----------------|-------------------|
| IST | Data Source | IstEvent records with skills array |
| Repository | Storage | `IstEventRepository.findByCourse()` |
| DataConnect | Future | GraphQL queries for production data |
| Auth | Identity | Teacher role verification |
| Course System | Context | Course ID for filtering |

### Integration Contracts

**IST → Analytics**:
```typescript
// IST events are the primary data source
interface IstEvent {
  id: string;
  createdAt: string;
  courseId?: string;
  skills: string[];
  // Other fields available but unused
}
```

**Analytics → Repository**:
```typescript
// Repository provides filtered events
interface IstEventRepository {
  findByCourse(courseId: string): Promise<IstEvent[]>;
  getRecentEvents(params: { courseId: string; limit: number }): Promise<IstEvent[]>;
}
```

**Analytics → UI**:
```typescript
// Report passed to presentation components
interface TeacherClassIstReport {
  topSkills: SkillEntry[];
  gaps: SkillEntry[];
  trends: TrendData;
  dataQuality: QualityMetrics;
  // ...
}
```

**Analytics → Export**:
```typescript
// Export functions receive report data
function exportToCsv(report: TeacherIstClassReport): string;
function exportToPdf(report: TeacherIstClassReport): Blob;
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large event sets slow performance | Medium | Pagination, server-side aggregation |
| Inaccurate skill normalization | Medium | Unit tests, teacher feedback loop |
| Missing skills in events | Low | Data quality metrics, validation |
| Privacy concerns | High | Aggregated data only, no PII |
| Database unavailable | Medium | Graceful fallback to mock data |

---

## Success Metrics

1. **Report Generation Time**: < 2 seconds for 10,000 events
2. **Data Quality**: > 95% of events have valid skills
3. **Teacher Usage**: Reports viewed weekly by active teachers
4. **Export Usage**: > 10% of report views include export
5. **Alert Accuracy**: > 80% of alerts lead to teacher action
