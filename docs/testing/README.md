# Testing Documentation

This directory contains standardized documentation for all CourseLLM tests.

## Test Documentation Index

| Document | Test Type | Purpose |
|----------|-----------|---------|
| [e2e-tests.md](./e2e-tests.md) | Playwright E2E | Authentication, student journey, teacher analytics |
| [frontend-unit-tests.md](./frontend-unit-tests.md) | Jest Unit | React components, TypeScript utilities |
| [backend-tests.md](./backend-tests.md) | pytest | DSPy FastAPI service, health endpoints |
| [dataconnect-validation.md](./dataconnect-validation.md) | Script | Firebase Data Connect IST storage |
| [health-checks.md](./health-checks.md) | Manual | Health endpoints, debug pages |

## Additional Test Resources

| Document | Location | Purpose |
|----------|----------|---------|
| [IST UI Test Plan](../testing-ist.md) | `docs/testing-ist.md` | Comprehensive manual IST pipeline testing |
| [DSPy Quick Reference](../../dspy_service/TESTING.md) | `dspy_service/TESTING.md` | Quick pytest commands |

## Quick Commands

| Test Type | Command |
|-----------|---------|
| E2E Tests | `npm run test:e2e` |
| Frontend Unit | `npm run test` |
| Backend | `cd dspy_service && pytest` |
| Data Connect | `npx tsx scripts/test-dataconnect.ts` |

## Standard Documentation Format

Each test documentation file follows this structure:

1. **Setup Instructions** - Services, environment variables, prerequisites
2. **Run the Automated Test** - Commands for Linux/macOS and Windows
3. **What This Test Checks** - Behavior validated and what passing means
4. **Manual Verification** - Step-by-step manual testing instructions

---

For project-wide documentation, see the main [README.md](../../README.md).
