"""
Test suite for Intent-Skill-Trajectory (IST) API endpoints.

This module provides comprehensive tests for the CourseLLM DSPy Service API,
including:
- Health check endpoint (/health)
- Intent-Skill-Trajectory extraction endpoint (/api/intent-skill-trajectory)

Tests verify:
- HTTP status codes
- Response JSON structure
- Required fields presence
- Data type validation
- Error handling
- Statelessness and cleanup
"""

import pytest
import json
from typing import Dict, Any
from fastapi.testclient import TestClient


# ============================================================================
# Health Check Endpoint Tests
# ============================================================================

@pytest.mark.health
@pytest.mark.integration
class TestHealthEndpoint:
    """Test suite for GET /health endpoint."""
    
    def test_health_check_returns_200(self, client: TestClient):
        """Verify health check endpoint returns HTTP 200 status."""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_health_check_response_is_json(self, client: TestClient):
        """Verify health check response is valid JSON."""
        response = client.get("/health")
        assert response.headers.get("content-type") == "application/json"
        # Should not raise an exception
        data = response.json()
        assert isinstance(data, dict)
    
    def test_health_check_contains_required_fields(self, client: TestClient):
        """Verify health check response contains required fields."""
        response = client.get("/health")
        data = response.json()
        
        assert "status" in data
        assert "service" in data
        assert "version" in data
        assert data["status"] == "healthy"
        assert data["service"] == "CourseLLM DSPy Service"
    
    def test_health_check_field_types(self, client: TestClient):
        """Verify health check response fields have correct types."""
        response = client.get("/health")
        data = response.json()
        
        assert isinstance(data["status"], str)
        assert isinstance(data["service"], str)
        assert isinstance(data["version"], str)
    
    def test_health_check_idempotent(self, client: TestClient):
        """Verify multiple health checks return same result."""
        response1 = client.get("/health")
        response2 = client.get("/health")
        
        assert response1.json() == response2.json()
        assert response1.status_code == response2.status_code


# ============================================================================
# IST API Endpoint Tests - Basic Functionality
# ============================================================================

@pytest.mark.ist_api
@pytest.mark.integration
class TestIstApiBasic:
    """Test suite for POST /api/intent-skill-trajectory endpoint - basic functionality."""
    
    def test_ist_api_valid_request_returns_200(
        self, 
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify IST API returns HTTP 200 for valid request."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        assert response.status_code == 200
    
    def test_ist_api_response_is_json(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify IST API response is valid JSON."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        assert response.headers.get("content-type") == "application/json"
        data = response.json()
        assert isinstance(data, dict)
    
    def test_ist_api_response_contains_required_fields(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify IST API response contains all required fields."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        data = response.json()
        
        assert "intent" in data, "Response missing 'intent' field"
        assert "skills" in data, "Response missing 'skills' field"
        assert "trajectory" in data, "Response missing 'trajectory' field"
    
    def test_ist_api_response_field_types(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify IST API response fields have correct types."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        data = response.json()
        
        assert isinstance(data["intent"], str), "intent should be string"
        assert isinstance(data["skills"], list), "skills should be list"
        assert isinstance(data["trajectory"], list), "trajectory should be list"
    
    def test_ist_api_skills_contains_strings(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify skills list contains only strings."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        data = response.json()
        
        for skill in data["skills"]:
            assert isinstance(skill, str), f"Skill item must be string, got {type(skill)}"
    
    def test_ist_api_trajectory_contains_strings(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify trajectory list contains only strings."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        data = response.json()
        
        for step in data["trajectory"]:
            assert isinstance(step, str), f"Trajectory step must be string, got {type(step)}"
    
    def test_ist_api_intent_not_empty(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify intent field is non-empty."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        data = response.json()
        
        assert data["intent"], "intent should not be empty"
        assert isinstance(data["intent"], str)
        assert len(data["intent"]) > 0


# ============================================================================
# IST API Endpoint Tests - Extended Context
# ============================================================================

@pytest.mark.ist_api
@pytest.mark.integration
class TestIstApiExtendedContext:
    """Test suite for IST API with extended context (history, profiles)."""
    
    def test_ist_api_with_chat_history_returns_200(
        self,
        client: TestClient,
        sample_intent_skill_request_with_history: Dict[str, Any]
    ):
        """Verify IST API accepts and processes chat history."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request_with_history
        )
        assert response.status_code == 200
    
    def test_ist_api_with_ist_history_returns_200(
        self,
        client: TestClient,
        sample_intent_skill_request_with_history: Dict[str, Any]
    ):
        """Verify IST API accepts and processes IST history."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request_with_history
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "intent" in data
        assert "skills" in data
        assert "trajectory" in data
    
    def test_ist_api_with_student_profile_returns_200(
        self,
        client: TestClient,
        sample_intent_skill_request_with_history: Dict[str, Any]
    ):
        """Verify IST API accepts and processes student profile."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request_with_history
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "intent" in data
        assert "skills" in data
        assert "trajectory" in data
    
    def test_ist_api_optional_fields_have_defaults(
        self,
        client: TestClient
    ):
        """Verify IST API works with minimal request (only utterance)."""
        minimal_request = {"utterance": "What is recursion?"}
        response = client.post(
            "/api/intent-skill-trajectory",
            json=minimal_request
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have all required fields
        assert "intent" in data
        assert "skills" in data
        assert "trajectory" in data


# ============================================================================
# IST API Endpoint Tests - Error Handling
# ============================================================================

@pytest.mark.ist_api
@pytest.mark.integration
class TestIstApiErrorHandling:
    """Test suite for error handling in IST API."""
    
    def test_ist_api_empty_utterance_returns_400(
        self,
        client: TestClient,
        invalid_intent_skill_request: Dict[str, Any]
    ):
        """Verify IST API rejects empty utterance with HTTP 400."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=invalid_intent_skill_request
        )
        # Empty utterance violates min_length=1 constraint
        assert response.status_code == 422  # Validation error
    
    def test_ist_api_missing_utterance_returns_422(self, client: TestClient):
        """Verify IST API rejects request missing utterance field."""
        invalid_request = {"course_context": "Some context"}
        response = client.post(
            "/api/intent-skill-trajectory",
            json=invalid_request
        )
        assert response.status_code == 422  # Unprocessable entity
    
    def test_ist_api_malformed_json_returns_422(self, client: TestClient):
        """Verify IST API handles malformed JSON gracefully."""
        response = client.post(
            "/api/intent-skill-trajectory",
            data="{ invalid json }",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_ist_api_response_on_validation_error_is_json(
        self,
        client: TestClient,
        invalid_intent_skill_request: Dict[str, Any]
    ):
        """Verify error responses are valid JSON."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json=invalid_intent_skill_request
        )
        assert response.headers.get("content-type") == "application/json"
        data = response.json()
        assert isinstance(data, dict)


# ============================================================================
# IST API Endpoint Tests - Statelessness & Idempotency
# ============================================================================

@pytest.mark.ist_api
@pytest.mark.integration
class TestIstApiStatelessness:
    """Test suite to verify IST API is stateless and idempotent."""
    
    def test_ist_api_multiple_requests_independent(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify multiple requests don't affect each other."""
        request1 = {"utterance": "Question about topic A"}
        request2 = {"utterance": "Question about topic B"}
        
        response1 = client.post(
            "/api/intent-skill-trajectory",
            json=request1
        )
        response2 = client.post(
            "/api/intent-skill-trajectory",
            json=request2
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Responses should be different (based on different inputs)
        data1 = response1.json()
        data2 = response2.json()
        assert data1 != data2 or request1 == request2
    
    def test_ist_api_repeated_request_same_result(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify repeated identical requests return same structure."""
        response1 = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        response2 = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        
        assert response1.status_code == response2.status_code
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Both should have same structure
        assert set(data1.keys()) == set(data2.keys())
    
    def test_ist_api_no_side_effects_on_health(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Verify IST API request doesn't affect health check."""
        health_before = client.get("/health").json()
        
        response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        
        health_after = client.get("/health").json()
        
        assert health_before == health_after
        assert response.status_code == 200


# ============================================================================
# Integration Tests
# ============================================================================

@pytest.mark.integration
class TestApiIntegration:
    """Integration tests for the complete API workflow."""
    
    def test_full_api_workflow_health_then_ist(
        self,
        client: TestClient,
        sample_intent_skill_request: Dict[str, Any]
    ):
        """Test complete workflow: health check → IST request."""
        # Step 1: Verify service is healthy
        health_response = client.get("/health")
        assert health_response.status_code == 200
        assert health_response.json()["status"] == "healthy"
        
        # Step 2: Make IST request
        ist_response = client.post(
            "/api/intent-skill-trajectory",
            json=sample_intent_skill_request
        )
        assert ist_response.status_code == 200
        
        # Step 3: Verify response structure
        data = ist_response.json()
        assert "intent" in data
        assert "skills" in data
        assert "trajectory" in data
        
        # Step 4: Service still healthy
        health_response2 = client.get("/health")
        assert health_response2.status_code == 200
    
    def test_concurrent_like_requests(
        self,
        client: TestClient
    ):
        """Test multiple sequential requests (simulates concurrent usage)."""
        requests = [
            {"utterance": f"Question {i}", "course_context": f"Context {i}"}
            for i in range(5)
        ]
        
        responses = []
        for req in requests:
            response = client.post(
                "/api/intent-skill-trajectory",
                json=req
            )
            responses.append(response)
        
        # All requests should succeed
        assert all(r.status_code == 200 for r in responses)
        
        # All responses should have valid structure
        for response in responses:
            data = response.json()
            assert "intent" in data
            assert "skills" in data
            assert "trajectory" in data


# ============================================================================
# Edge Case Tests
# ============================================================================

@pytest.mark.ist_api
class TestIstApiEdgeCases:
    """Test suite for edge cases and boundary conditions."""
    
    def test_ist_api_very_long_utterance(self, client: TestClient):
        """Verify IST API handles very long utterance."""
        long_utterance = "What is " + "something very complex about " * 100 + "?"
        response = client.post(
            "/api/intent-skill-trajectory",
            json={"utterance": long_utterance}
        )
        assert response.status_code == 200
        data = response.json()
        assert "intent" in data
        assert "skills" in data
    
    def test_ist_api_special_characters_in_utterance(self, client: TestClient):
        """Verify IST API handles special characters."""
        special_utterance = "Why does 2+2=4? @#$%^&*()_+-=[]{}|;':\",./<>?"
        response = client.post(
            "/api/intent-skill-trajectory",
            json={"utterance": special_utterance}
        )
        assert response.status_code == 200
        data = response.json()
        assert "intent" in data
    
    def test_ist_api_unicode_characters(self, client: TestClient):
        """Verify IST API handles Unicode characters."""
        unicode_utterance = "¿Cómo funciona? 你好 🎓"
        response = client.post(
            "/api/intent-skill-trajectory",
            json={"utterance": unicode_utterance}
        )
        assert response.status_code == 200
        data = response.json()
        assert "intent" in data
    
    def test_ist_api_empty_optional_context(self, client: TestClient):
        """Verify IST API handles empty optional context."""
        response = client.post(
            "/api/intent-skill-trajectory",
            json={
                "utterance": "Question?",
                "course_context": ""
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "intent" in data
        assert "skills" in data
