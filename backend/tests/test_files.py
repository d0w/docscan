import pytest
import os
from fastapi.testclient import TestClient
from unittest.mock import patch, mock_open


def test_get_file(client, test_file, teacher_headers, student_headers):
    """Test getting a file."""
    # Mock the file open operation to avoid actual file operations
    with patch("builtins.open", mock_open(read_data=b"Test file content")):
        # Teacher should be able to get the file
        response = client.get(f"/files/{test_file.id}", headers=teacher_headers)
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain"
        assert "attachment; filename" in response.headers["content-disposition"]
        assert test_file.filename in response.headers["content-disposition"]

        # Student who owns the submission should be able to get the file
        response = client.get(f"/files/{test_file.id}", headers=student_headers)
        assert response.status_code == 200


def test_get_nonexistent_file(client, teacher_headers):
    """Test getting a file that doesn't exist."""
    non_existent_id = "11111111-1111-1111-1111-111111111111"
    response = client.get(f"/files/{non_existent_id}", headers=teacher_headers)
    assert response.status_code == 404
    assert "File not found" in response.json()["detail"]


@patch("builtins.open")
def test_file_not_found_on_disk(mock_open, client, test_file, teacher_headers):
    """Test behavior when file exists in DB but not on disk."""
    # Mock file open to raise FileNotFoundError
    mock_open.side_effect = FileNotFoundError("File not found")

    response = client.get(f"/files/{test_file.id}", headers=teacher_headers)
    assert response.status_code == 404
    assert "File not found on the server" in response.json()["detail"]


def test_file_access_unauthorized(client, test_file, db_session):
    """Test unauthorized access to a file."""
    # Create a headers dict with an invalid token
    unauthorized_headers = {"Authorization": "Bearer invalid_token"}

    response = client.get(f"/files/{test_file.id}", headers=unauthorized_headers)
    assert response.status_code == 401
    assert "Invalid authentication credentials" in response.json()["detail"]
