# CourseLLM (CourseWise)

## Purpose
CourseLLM (Coursewise) is an educational platform that leverages AI to provide personalized learning experiences.
It is intended for Undergraduate University Courses and is being tested on Computer Science courses.

The project provides role-based dashboards for students and teachers, integrated authentication via Firebase, and AI-powered course assessment and tutoring.

The core goals are to:
- Enable personalized learning assessment and recommendations for students
- Provide Socratic-style course tutoring through AI chat
- Implement an **IST extraction pipeline** that analyzes student questions to understand their learning **Intent**, identifies relevant **Skills**, and recommends personalized learning **Trajectories**
- Keep track of the history of students interactions with the system to enable teachers to monitor quality, intervene when needed, and obtain fine-grained analytics on learning trajectories
- Support both student and teacher workflows
- Ensure secure, role-based access control

## Tech Stack
- **Frontend Framework**: Next.js 15 with React 18 (TypeScript)
- **Styling**: Tailwind CSS with Radix UI components
- **Backend/Functions**: Firebase Cloud Functions, Firebase Admin SDK
- **Backend**: FastAPI Python micro-services hosted on Google Cloud Run
- **Database**: Firestore (NoSQL document database), Firebase DataConnect (PostgreSQL)
- **Authentication**: Firebase Authentication (Google OAuth)
- **AI/ML**: Google Genkit 1.24.0 with Google GenAI models (default: gemini-2.5-flash) and DSPy.ai for complex reasoning
- **Data**: Firebase DataConnect (GraphQL layer over PostgreSQL)
- **Testing**: Playwright for E2E tests
- **Dev Tools**: TypeScript 5, pnpm workspace, Node.js
- **Deployment**: Firebase Hosting, App Hosting

More technical details are available in openspec/project.md

## 📚 Documentation

Detailed documentation and status reports are available in the [docs/](./docs/) folder.

## 📄 License

Private educational project - not for redistribution.
