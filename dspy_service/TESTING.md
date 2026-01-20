# DSPy Service Testing

> **Canonical Documentation**: For complete testing documentation including setup instructions, manual verification, and troubleshooting, see **[docs/testing/backend-tests.md](../docs/testing/backend-tests.md)**.

## Quick Reference

### Run All Tests

```bash
cd dspy_service
pytest
```

### Run by Marker

```bash
pytest -m health         # Health check tests
pytest -m ist_api        # IST API tests
pytest -m integration    # Integration tests
```

### Run with Coverage

```bash
pytest --cov=. --cov-report=html
```

### Test Organization

| Marker | Description |
|--------|-------------|
| `@pytest.mark.health` | Health check endpoint tests |
| `@pytest.mark.ist_api` | IST API endpoint tests |
| `@pytest.mark.integration` | Integration tests |
| `@pytest.mark.unit` | Unit tests |

### Test Files

| File | Purpose |
|------|---------|
| `tests/test_ist_api.py` | Main test suite |
| `conftest.py` | Pytest fixtures |
| `pytest.ini` | Pytest configuration |

---

For detailed documentation, see [docs/testing/backend-tests.md](../docs/testing/backend-tests.md).
