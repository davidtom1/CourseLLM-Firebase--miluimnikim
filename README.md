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

## 🚀 Quick Setup

### One-Click GitHub Codespaces

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/LLMs-for-SE-2026-BGU/CourseLLM-Firebase)

Everything auto-installs in 2-3 minutes ✨

### Complete Setup Instructions

**→ [See SETUP.md for full setup guide](./SETUP.md)**

Includes:
- Prerequisites & installation (macOS, Linux, Windows)
- Environment variable configuration
- Local development (4 terminals)
- GitHub Codespaces setup
- Troubleshooting (15+ solutions)
- Verification checklist



## �📚 Documentation

Detailed documentation and status reports are available in the [docs/](./docs/) folder.
### Setup & Development Guides

| Document | Purpose |
|----------|---------|
| **[SETUP.md](./SETUP.md)** | 📖 **Main Guide** - Complete setup for Codespaces & local dev |
| [HOW-TO-RUN.md](./HOW-TO-RUN.md) | Step-by-step guide with detailed explanations |
| [QUICK-START.md](./QUICK-START.md) | 30-second TL;DR version |
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | Command cheat sheet |
| [.devcontainer/CODESPACES.md](./.devcontainer/CODESPACES.md) | GitHub Codespaces setup details |
| [START-EMULATORS.md](./START-EMULATORS.md) | Firebase emulator troubleshooting |

### Project Documentation

- **[Project Blueprint](./docs/00-PROJECT-BLUEPRINT.md)** - Architecture and system design
- **[Database Guide](./docs/04-DATABASE-AND-DATA-FLOW.md)** - Data flow and Firestore structure
- **[Authentication Setup](./docs/Auth/)** - Auth implementation details
- **[OpenSpec](./openspec/project.md)** - Technical specifications and project structure

## 📄 License

Private educational project - not for redistribution.
