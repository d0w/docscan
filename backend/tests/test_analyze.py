import pytest
from fastapi.testclient import TestClient
import uuid
import httpx
from unittest.mock import patch, MagicMock

from app.models import Analytic


@pytest.fixture
def test_analytic(db_session, test_submission):
    """Create a test analytic record."""
    analytic = Analytic(id=uuid.uuid4(), data={})

    test_submission.analytic = analytic

    db_session.add(analytic)
    db_session.commit()
    db_session.refresh(analytic)
    db_session.refresh(test_submission)

    return analytic


class MockResponse:
    """Mock for httpx response."""

    def __init__(self, status_code=200, json_data=None):
        self.status_code = status_code
        self._json_data = json_data or {}

    def json(self):
        return self._json_data


class AsyncMock(MagicMock):
    """Mock for async methods."""

    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)


@pytest.fixture
def mock_httpx_client():
    """Create a mock for httpx AsyncClient."""
    mock_client = MagicMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.post.return_value = MockResponse(
        status_code=200,
        json_data={"response": "This is a mock LLM analysis of the file content."},
    )
    return mock_client


def test_create_analytic(client, test_submission, teacher_headers, student_headers):
    """Test creating an analytic for a submission."""
    # Teacher should be able to create an analytic
    response = client.post(
        "/analyze/",
        params={"submission_id": str(test_submission.id)},
        headers=teacher_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == str(test_submission.id)
    assert "analytic" in data
    assert data["analytic"] is not None

    # Student should not be able to create an analytic
    response = client.post(
        "/analyze/",
        params={"submission_id": str(test_submission.id)},
        headers=student_headers,
    )

    assert response.status_code == 403
    assert "Only teachers can create analytics" in response.json()["detail"]


def test_create_analytic_nonexistent_submission(client, teacher_headers):
    """Test creating an analytic for a non-existent submission."""
    non_existent_id = "11111111-1111-1111-1111-111111111111"

    response = client.post(
        "/analyze/", params={"submission_id": non_existent_id}, headers=teacher_headers
    )

    assert response.status_code == 404
    assert "Submission not found" in response.json()["detail"]


@patch("httpx.AsyncClient")
def test_request_analytic(
    mock_async_client,
    client,
    test_analytic,
    test_file,
    teacher_headers,
    student_headers,
    mock_httpx_client,
):
    """Test requesting an analytic with LLM processing."""
    # Set up the mock
    mock_async_client.return_value = mock_httpx_client

    # Teacher should be able to request an analytic
    response = client.post(
        "/analyze/request",
        json={"prompt": "Please analyze this submission"},
        params={"submission_id": str(test_analytic.id)},
        headers=teacher_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert "data" in data
    assert test_file.filename in data["data"]
    assert "analysis" in data["data"][test_file.filename]

    # Student should not be able to request an analytic
    response = client.post(
        "/analyze/request",
        json={"prompt": "Please analyze this submission"},
        params={"submission_id": str(test_analytic.id)},
        headers=student_headers,
    )

    assert response.status_code == 403
    assert "Only teachers can request analytics" in response.json()["detail"]


@patch("httpx.AsyncClient")
def test_request_analytic_api_error(
    mock_async_client, client, test_analytic, test_file, teacher_headers
):
    """Test error handling when LLM API returns an error."""
    # Configure mock to return an error
    mock_client = MagicMock()
    mock_client.__aenter__.return_value = mock_client
    mock_client.post.return_value = MockResponse(
        status_code=500, json_data={"error": "Internal server error"}
    )
    mock_async_client.return_value = mock_client

    response = client.post(
        "/analyze/request",
        json={"prompt": "Please analyze this submission"},
        params={"submission_id": str(test_analytic.id)},
        headers=teacher_headers,
    )

    assert response.status_code == 500
    assert "Error analyzing file" in response.json()["detail"]
