import pytest
from fastapi.testclient import TestClient
import uuid
import os
import io
from unittest.mock import patch

from app.models import Assignment, Submission, File


@pytest.fixture
def test_assignment(db_session, test_teacher, test_student):
    """Create a test assignment."""
    assignment = Assignment(
        id=uuid.uuid4(),
        title="Test Assignment",
        description="This is a test assignment",
        student_ids=[test_student.id],
        teacher_id=test_teacher.id,
        due_date=None,
    )

    db_session.add(assignment)
    db_session.commit()
    db_session.refresh(assignment)

    return assignment


@pytest.fixture
def test_submission(db_session, test_assignment, test_student):
    """Create a test submission."""
    submission = Submission(
        id=uuid.uuid4(),
        comment="Test submission comment",
        assignment_id=test_assignment.id,
        student_id=test_student.id,
    )

    db_session.add(submission)
    db_session.commit()
    db_session.refresh(submission)

    return submission


@pytest.fixture
def test_file(db_session, test_submission):
    """Create a test file for a submission."""
    # Create test file directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)

    # Create a temporary file
    file_path = f"uploads/submission_{test_submission.id}_test_file.txt"
    with open(file_path, "w") as f:
        f.write("Test file content")

    file_record = File(
        id=uuid.uuid4(),
        filename="test_file.txt",
        filepath=file_path,
        size=os.path.getsize(file_path),
        content_type="text/plain",
        submission_id=test_submission.id,
    )

    db_session.add(file_record)
    db_session.commit()
    db_session.refresh(file_record)

    yield file_record

    # Clean up test file
    try:
        os.remove(file_path)
    except (OSError, FileNotFoundError):
        pass


def test_create_assignment(client, teacher_headers, test_teacher, test_student):
    """Test creating a new assignment."""
    assignment_data = {
        "title": "New Test Assignment",
        "description": "Description for new test assignment",
        "student_ids": [str(test_student.id)],
        "due_date": None,
    }

    response = client.post(
        "/assignments/", json=assignment_data, headers=teacher_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == assignment_data["title"]
    assert data["description"] == assignment_data["description"]
    assert data["student_ids"] == assignment_data["student_ids"]
    assert data["teacher_id"] == str(test_teacher.id)


def test_create_assignment_unauthorized(client, student_headers):
    """Test that students cannot create assignments."""
    assignment_data = {
        "title": "Unauthorized Assignment",
        "description": "This should fail",
        "student_ids": [],
        "due_date": None,
    }

    response = client.post(
        "/assignments/", json=assignment_data, headers=student_headers
    )

    assert response.status_code == 403
    assert "Only teachers can create assignments" in response.json()["detail"]


def test_get_assignments(client, test_assignment, teacher_headers, student_headers):
    """Test retrieving assignments."""
    # Teacher should see their assignments
    response = client.get("/assignments/", headers=teacher_headers)
    assert response.status_code == 200
    assignments = response.json()
    assert len(assignments) >= 1
    assert any(a["id"] == str(test_assignment.id) for a in assignments)

    # Student should see assignments they are assigned to
    response = client.get("/assignments/", headers=student_headers)
    assert response.status_code == 200
    assignments = response.json()
    assert len(assignments) >= 1
    assert any(a["id"] == str(test_assignment.id) for a in assignments)


def test_get_assignment_by_id(
    client, test_assignment, teacher_headers, student_headers
):
    """Test retrieving a specific assignment."""
    # Teacher should see the assignment
    response = client.get(f"/assignments/{test_assignment.id}", headers=teacher_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_assignment.id)
    assert data["title"] == test_assignment.title

    # Student should see the assignment they're assigned to
    response = client.get(f"/assignments/{test_assignment.id}", headers=student_headers)
    assert response.status_code == 200
    assert response.json()["id"] == str(test_assignment.id)


def test_update_assignment(client, test_assignment, teacher_headers, student_headers):
    """Test updating an assignment."""
    update_data = {
        "title": "Updated Assignment Title",
        "description": "Updated description for testing",
    }

    # Teacher should be able to update
    response = client.put(
        f"/assignments/{test_assignment.id}", json=update_data, headers=teacher_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]

    # Student should not be able to update
    response = client.put(
        f"/assignments/{test_assignment.id}", json=update_data, headers=student_headers
    )
    assert response.status_code == 403


@patch("shutil.copyfileobj")
@patch("shutil.copy2")
def test_create_submission(
    mock_copy2, mock_copyfileobj, client, test_assignment, student_headers
):
    """Test creating a submission for an assignment."""
    # Mock file content
    file_content = b"This is test file content"
    test_file = io.BytesIO(file_content)

    # Create form data with file
    form_data = {
        "assignment_id": str(test_assignment.id),
        "comment": "Test submission via API",
    }

    files = {"files": ("test_submission.txt", test_file, "text/plain")}

    response = client.post(
        "/assignments/submit", data=form_data, files=files, headers=student_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["comment"] == form_data["comment"]
    assert data["assignment_id"] == form_data["assignment_id"]
    assert len(data["files"]) == 1
    assert data["files"][0]["filename"] == "test_submission.txt"

    # Verify mocks were called correctly
    mock_copyfileobj.assert_called()
    mock_copy2.assert_called()


def test_get_assignment_submissions(
    client, test_assignment, test_submission, teacher_headers, student_headers
):
    """Test retrieving submissions for an assignment."""
    # Teacher should see all submissions
    response = client.get(
        f"/assignments/{test_assignment.id}/submissions", headers=teacher_headers
    )
    assert response.status_code == 200
    submissions = response.json()
    assert len(submissions) >= 1
    assert any(s["id"] == str(test_submission.id) for s in submissions)

    # Student should only see their own submissions
    response = client.get(
        f"/assignments/{test_assignment.id}/submissions", headers=student_headers
    )
    assert response.status_code == 200
    submissions = response.json()
    assert len(submissions) >= 1
    assert all(s["student_id"] == str(test_submission.student_id) for s in submissions)
