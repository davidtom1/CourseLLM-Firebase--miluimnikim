# Backend Tests (pytest)

Python tests for the DSPy FastAPI service using pytest. These tests validate the IST (Intent-Skill-Trajectory) extraction API and health endpoints.

---

## 1. Setup Instructions

### Required Services

Backend tests run with mocked DSPy extractors. **No external AI services or Firebase emulators required.**

### Prerequisites

Navigate to the DSPy service directory and install dependencies:

```bash
cd dspy_service

# Using pip
pip install -r requirements.txt

# Or using uv (recommended - faster)
uv sync
```

### Test Dependencies

The following packages are required (included in `requirements.txt`):
- `pytest >= 7.0.0`
- `httpx >= 0.24.0`
- `pytest-cov >= 4.0.0`
- `pytest-xdist >= 3.0.0`
- `pytest-asyncio >= 0.21.0`

---

## 2. Run the Automated Tests

### Linux / macOS

```bash
cd dspy_service

# Activate virtual environment (if using)
source venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_ist_api.py

# Run specific test class
pytest tests/test_ist_api.py::TestHealthEndpoint

# Run specific test
pytest tests/test_ist_api.py::TestHealthEndpoint::test_health_check_returns_200

# Run tests by marker
pytest -m health         # Health check tests only
pytest -m ist_api        # IST API tests only
pytest -m integration    # Integration tests only

# Run with coverage report
pytest --cov=. --cov-report=html

# Run tests in parallel (faster)
pytest -n auto
```

### Windows (PowerShell)

```powershell
cd dspy_service

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_ist_api.py

# Run tests by marker
pytest -m health

# Run with coverage
pytest --cov=. --cov-report=html
```

### Expected Success Output

```
============================= test session starts ==============================
platform win32 -- Python 3.12.x, pytest-7.x.x, pluggy-1.x.x
rootdir: C:\path\to\dspy_service
configfile: pytest.ini
collected 25 items

tests/test_ist_api.py::TestHealthEndpoint::test_health_check_returns_200 PASSED
tests/test_ist_api.py::TestHealthEndpoint::test_health_check_response_is_json PASSED
tests/test_ist_api.py::TestHealthEndpoint::test_health_check_contains_required_fields PASSED
tests/test_ist_api.py::TestHealthEndpoint::test_health_check_field_types PASSED
tests/test_ist_api.py::TestHealthEndpoint::test_health_check_idempotent PASSED
tests/test_ist_api.py::TestIstApiBasic::test_ist_api_valid_request_returns_200 PASSED
...
tests/test_ist_api.py::TestIstApiEdgeCases::test_ist_api_unicode_characters PASSED

============================= 25 passed in 2.34s ===============================
```

---

## 3. What These Tests Check (and What Passing Means)

### Health Endpoint Tests (`TestHealthEndpoint`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| `test_health_check_returns_200` | GET /health returns HTTP 200 | Service is running |
| `test_health_check_response_is_json` | Response Content-Type is JSON | API format is correct |
| `test_health_check_contains_required_fields` | Response has status, service, version | Health schema is valid |
| `test_health_check_field_types` | Fields are strings | Type safety maintained |
| `test_health_check_idempotent` | Multiple calls return same result | No side effects |

### IST API Basic Tests (`TestIstApiBasic`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| `test_ist_api_valid_request_returns_200` | Valid POST returns HTTP 200 | API accepts valid requests |
| `test_ist_api_response_is_json` | Response is valid JSON | Output format correct |
| `test_ist_api_response_contains_required_fields` | Has intent, skills, trajectory | Schema is complete |
| `test_ist_api_response_field_types` | Correct types (str, list, list) | Type contracts honored |
| `test_ist_api_skills_contains_strings` | skills array has strings | Data structure valid |
| `test_ist_api_trajectory_contains_strings` | trajectory array has strings | Data structure valid |
| `test_ist_api_intent_not_empty` | intent is non-empty string | Analysis produces output |

### IST API Extended Context Tests (`TestIstApiExtendedContext`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| `test_ist_api_with_chat_history_returns_200` | Accepts chat_history array | Context-aware analysis works |
| `test_ist_api_with_ist_history_returns_200` | Accepts ist_history array | Learning trajectory supported |
| `test_ist_api_with_student_profile_returns_200` | Accepts student_profile object | Personalization supported |
| `test_ist_api_optional_fields_have_defaults` | Works with minimal request | API is flexible |

### Error Handling Tests (`TestIstApiErrorHandling`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| `test_ist_api_empty_utterance_returns_400` | Empty utterance rejected | Input validation works |
| `test_ist_api_missing_utterance_returns_422` | Missing field returns 422 | Required field enforced |
| `test_ist_api_malformed_json_returns_422` | Invalid JSON returns 422 | Parser handles errors |
| `test_ist_api_response_on_validation_error_is_json` | Errors are JSON | Consistent error format |

### Statelessness Tests (`TestIstApiStatelessness`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| `test_ist_api_multiple_requests_independent` | Different inputs = different outputs | No state pollution |
| `test_ist_api_repeated_request_same_result` | Same input = same structure | Deterministic behavior |
| `test_ist_api_no_side_effects_on_health` | IST request doesn't affect /health | Isolation maintained |

### Edge Case Tests (`TestIstApiEdgeCases`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| `test_ist_api_very_long_utterance` | Handles long text | No buffer overflows |
| `test_ist_api_special_characters_in_utterance` | Handles symbols | Input sanitization works |
| `test_ist_api_unicode_characters` | Handles international text | Unicode support works |
| `test_ist_api_empty_optional_context` | Handles empty context | Graceful fallback |

---

## 4. Manual Verification

### Verify Health Endpoint

```bash
# Start the DSPy service
cd dspy_service
python -m uvicorn app:app --reload --port 8000

# In another terminal, test health endpoint
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "CourseLLM DSPy Service",
  "version": "1.0.0"
}
```

### Verify IST API Endpoint

```bash
curl -X POST http://localhost:8000/api/intent-skill-trajectory \
  -H "Content-Type: application/json" \
  -d '{"utterance": "What is recursion?"}'
```

**Expected Response:**
```json
{
  "intent": "Student wants to understand the concept of recursion",
  "skills": ["recursion", "functions", "base case"],
  "trajectory": ["understand base case", "trace simple examples", "implement factorial"]
}
```

### Interactive API Documentation

Visit `http://localhost:8000/docs` for Swagger UI where you can:
- Try endpoints interactively
- See request/response schemas
- Test with different payloads

---

## Test Files Reference

| File | Purpose |
|------|---------|
| `dspy_service/tests/test_ist_api.py` | Main test suite for IST API |
| `dspy_service/tests/__init__.py` | Package initialization |
| `dspy_service/conftest.py` | Pytest fixtures and configuration |
| `dspy_service/pytest.ini` | Pytest markers and settings |

---

## Test Markers

Tests are organized with pytest markers:

| Marker | Description | Command |
|--------|-------------|---------|
| `@pytest.mark.health` | Health check tests | `pytest -m health` |
| `@pytest.mark.ist_api` | IST API tests | `pytest -m ist_api` |
| `@pytest.mark.integration` | Integration tests | `pytest -m integration` |
| `@pytest.mark.unit` | Unit tests | `pytest -m unit` |
| `@pytest.mark.slow` | Long-running tests | `pytest -m slow` |

---

## Mocking Strategy

Tests use `mock_ist_extractor` fixture (autouse=True) that:
- Mocks the DSPy module initialization
- Returns consistent test data without real LLM calls
- Automatically cleans up after each test

This allows fast, deterministic tests without API quotas or costs.

---

## Troubleshooting

### "ModuleNotFoundError"

```bash
cd dspy_service
pip install -r requirements.txt --upgrade
```

### Tests Run Slowly

Use parallel execution:

```bash
pytest -n auto
```

### Coverage Report Not Generating

Install coverage plugin:

```bash
pip install pytest-cov
pytest --cov=. --cov-report=html
```

Open `htmlcov/index.html` to view the report.

---

**Last Updated**: January 2026
