# Socratic Chat Feature Proposal

## Summary

Implement an AI-powered Socratic tutoring system that guides students through understanding concepts via thoughtful questioning rather than direct answers.

## Why

Traditional Q&A systems provide direct answers, which limits deep learning. The Socratic method:

1. **Promotes Critical Thinking**: Students discover answers through guided questions
2. **Builds Understanding**: Deeper comprehension vs. memorization
3. **Scales Teaching**: Provides 1:1 tutoring experience at scale

## What Changes

- **NEW**: Genkit flow for Socratic response generation (`socratic-course-chat.ts`)
- **NEW**: ChatPanel component with optimistic UI updates
- **NEW**: Message threading with Firestore persistence
- **NEW**: Integration hook for IST extraction (fire-and-forget)
- **MODIFIED**: Student course page to include chat interface

## Impact

- **Affected specs**: ist (receives chat messages for analysis)
- **Affected code**: `src/features/ai/flows/`, `src/app/student/courses/[courseId]/_components/`
- **Dependencies**: Google Gemini API key, Firebase Auth for user context

## Decision

**APPROVED** - Core interaction point for student learning experience.

## AI Assistance Notes

- Gemini 2.5 Flash used for response generation (cost-effective, fast)
- AI helped craft Socratic prompt templates; manually tuned for educational tone
- Jest test mocking for AI responses required manual intervention due to async complexity

