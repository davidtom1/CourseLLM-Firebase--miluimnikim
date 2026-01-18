# Analytics Feature Proposal

## Summary

Provide teachers with aggregated learning analytics dashboards showing class-level patterns from IST (Intent-Skill-Trajectory) data.

## Why

Teachers need visibility into:

1. **Common Struggles**: Which concepts cause the most confusion across the class
2. **Intent Patterns**: Are students asking for explanations, examples, or clarification?
3. **Skill Coverage**: Which skills are being discussed most/least
4. **Learning Trajectories**: Is the class on track, struggling, or ready to advance?

## What Changes

- **NEW**: `TeacherClassIstReport` component for class-level insights
- **NEW**: `computeTeacherIstClassReportV2()` aggregation function
- **NEW**: Recharts-based visualizations (intent distribution, skill frequency)
- **NEW**: Privacy-preserving aggregation (no individual student data exposed)

## Impact

- **Affected specs**: ist (data source for analytics)
- **Affected code**: `src/features/ist/reports/`, `src/app/teacher/courses/[courseId]/_components/`
- **Dependencies**: Requires IST events to be populated (either mock or live)

## Decision

**APPROVED** - Essential for teacher value proposition.

## AI Assistance Notes

- AI generated initial Recharts configuration; manually adjusted color schemes
- Aggregation logic was AI-assisted but required manual validation for edge cases
- Report computation is pure function (easy to unit test)

