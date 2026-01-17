"""
Pytest configuration and shared fixtures for CourseLLM DSPy Service tests.

This module provides:
- TestClient setup for FastAPI endpoints
- Mock fixtures for DSPy module initialization
- Stateless test fixtures with proper cleanup
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient

# Add parent directory to path to import app module
sys.path.insert(0, str(Path(__file__).parent))

from app import app


@pytest.fixture(scope="session")
def anyio_backend():
    """Configure async test backend."""
    return "asyncio"


@pytest.fixture(scope="function")
def client():
    """
    Provide a TestClient for FastAPI application.
    
    Stateless fixture - creates fresh client for each test.
    Automatically cleans up after test execution.
    """
    test_client = TestClient(app)
    yield test_client
    # Cleanup after test - TestClient handles internal cleanup


@pytest.fixture(autouse=True)
def mock_ist_extractor():
    """
    Mock the IST extractor module to avoid requiring real LLM API calls during tests.
    
    This fixture automatically mocks the ist_extractor initialization and returns
    consistent test data. Applied to all tests via autouse=True.
    
    Cleanup: Automatic - mocks are reset after each test.
    """
    def mock_ist_function(
        utterance: str,
        course_context: str = "",
        chat_history=None,
        ist_history=None,
        student_profile=None,
    ):
        """Mock IST extractor that returns test data."""
        # Return consistent test data based on utterance
        if "error" in utterance.lower():
            raise ValueError("Simulated error in IST extraction")
        
        return {
            "intent": f"Student is asking about: {utterance[:40]}...",
            "skills": ["Skill A", "Skill B"],
            "trajectory": [
                "Step 1: Review basics",
                "Step 2: Practice problems",
                "Step 3: Advanced exercises"
            ]
        }
    
    with patch("dspy_flows.ist_extractor", mock_ist_function):
        with patch("dspy_flows.initialize_ist_extractor"):
            # Mock the startup event to prevent actual DSPy initialization
            yield


@pytest.fixture(autouse=True)
def suppress_startup_logs(caplog):
    """
    Suppress verbose startup logs during tests.
    
    Cleanup: Automatic - logging is reset after each test.
    """
    with caplog.at_level("ERROR"):
        yield caplog


@pytest.fixture
def sample_intent_skill_request():
    """
    Provide sample request data for intent-skill-trajectory endpoint.
    
    Stateless: Returns fresh copy for each test.
    """
    return {
        "utterance": "How do I understand dynamic programming?",
        "course_context": "Introduction to Algorithms"
    }


@pytest.fixture
def sample_intent_skill_request_with_history():
    """
    Provide sample request with chat history and IST history.
    
    Stateless: Returns fresh copy for each test.
    """
    return {
        "utterance": "Can you explain recursion?",
        "course_context": "Computer Science 101",
        "chat_history": [
            {
                "role": "student",
                "content": "What is an algorithm?"
            },
            {
                "role": "tutor",
                "content": "An algorithm is a step-by-step procedure to solve a problem."
            }
        ],
        "ist_history": [
            {
                "intent": "Understand algorithms",
                "skills": ["Algorithm Design"],
                "trajectory": ["Learn basics", "Practice"],
            }
        ],
        "student_profile": {
            "strong_skills": ["Math", "Logic"],
            "weak_skills": ["Recursion"],
            "course_progress": "50%"
        }
    }


@pytest.fixture
def invalid_intent_skill_request():
    """
    Provide invalid request data to test error handling.
    
    Stateless: Returns fresh copy for each test.
    """
    return {
        "utterance": "",  # Invalid: empty utterance
        "course_context": "Some context"
    }
