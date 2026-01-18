# IST (Intent-Skill-Trajectory) Feature Proposal

## Summary

Add real-time learning analytics extraction from student chat messages to provide teachers with actionable insights into student understanding and learning patterns.

## Why

Students frequently ask questions that reveal gaps in understanding, confusion about prerequisites, or readiness for advanced topics. Currently, teachers have no visibility into these patterns at scale. This feature enables:

1. **Personalized Learning**: Identify individual student struggles in real-time
2. **Class-Level Insights**: Aggregate intent patterns to adjust teaching strategy
3. **Learning Path Optimization**: Track trajectory to suggest optimal next topics

## What Changes

- **NEW**: DSPy-powered extraction service (Python FastAPI backend)
- **NEW**: Real-time Firestore subscription for UI updates
- **NEW**: IntentInspector component for live analysis display
- **NEW**: Teacher analytics dashboard with aggregated reports
- **NEW**: Repository pattern for flexible storage backends

## Impact

- **Affected specs**: chat (triggers IST), analytics (consumes IST data)
- **Affected code**: `src/features/ist/`, `dspy_service/`, `src/components/IntentInspector.tsx`
- **Dependencies**: Requires DSPy service running, Firebase emulators for development

## Decision

**APPROVED** - Core feature for demonstrating AI-assisted learning analytics.

## AI Assistance Notes

- Used Claude Opus 4.5 for DSPy prompt engineering
- AI generated initial repository pattern; manually refined for Firestore compatibility
- E2E test generation required multiple iterations to handle async IST updates

