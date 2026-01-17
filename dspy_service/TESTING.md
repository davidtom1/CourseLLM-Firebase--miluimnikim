## Running the Tests

### Installation

Install test dependencies:
```bash
# Using pip
pip install -r requirements.txt

# Or using uv (if you have it installed)
uv add --dev pytest httpx
```

### Running Tests

```bash
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

# Run tests matching a marker
pytest -m ist_api        # Run IST API tests
pytest -m health         # Run health check tests
pytest -m integration    # Run integration tests

# Run tests with coverage
pytest --cov=. --cov-report=html

# Run tests in parallel (requires pytest-xdist)
pytest -n auto
```

### Test Organization

Tests are organized by markers:
- `@pytest.mark.health` - Health check endpoint tests
- `@pytest.mark.ist_api` - IST API endpoint tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.unit` - Unit tests

### Test Structure

- **Health Endpoint Tests**: Verify `/health` returns correct status and structure
- **IST API Basic Tests**: Verify response status, JSON validity, required fields
- **IST API Extended Context**: Test with chat history, IST history, student profiles
- **Error Handling Tests**: Test validation errors and edge cases
- **Statelessness Tests**: Verify requests don't create side effects
- **Integration Tests**: Test complete workflows
- **Edge Case Tests**: Test with long/special/Unicode characters

### Mocking

Tests use `mock_ist_extractor` fixture (autouse=True) that:
- Mocks the DSPy module initialization
- Returns consistent test data
- Avoids real LLM API calls
- Automatically cleans up after each test
