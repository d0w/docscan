import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
import uuid
import os
from typing import Generator, Dict

from app.main import app
from app.database import get_session
from app.models import User, Assignment, Submission, File, Analytic
from passlib.context import CryptContext

# Test database configuration
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/test_app_db"
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(scope="session")
def test_db_engine():
    """Create a test database engine."""
    engine = create_engine(TEST_DATABASE_URL)

    # Create all tables
    SQLModel.metadata.drop_all(engine)  # Drop existing tables to start fresh
    SQLModel.metadata.create_all(engine)

    yield engine

    # Clean up after tests
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def db_session(test_db_engine):
    """Create a test database session."""
    connection = test_db_engine.connect()
    transaction = connection.begin()

    with Session(test_db_engine) as session:
        yield session

    # Roll back the transaction to keep tests isolated
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create a test client with the test database session."""

    def override_get_session():
        return db_session

    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def test_teacher(db_session):
    """Create a test teacher user."""
    hashed_password = pwd_context.hash("password123")
    teacher = User(
        id=uuid.uuid4(),
        username="test_teacher",
        name="Test Teacher",
        password=hashed_password,
        role="teacher",
    )

    db_session.add(teacher)
    db_session.commit()
    db_session.refresh(teacher)

    return teacher


@pytest.fixture
def test_student(db_session):
    """Create a test student user."""
    hashed_password = pwd_context.hash("password123")
    student = User(
        id=uuid.uuid4(),
        username="test_student",
        name="Test Student",
        password=hashed_password,
        role="student",
    )

    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    return student


@pytest.fixture
def teacher_headers(client, test_teacher) -> Dict[str, str]:
    """Create auth headers for teacher."""
    response = client.post(
        "/auth/token",
        data={"username": test_teacher.username, "password": "password123"},
    )

    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_headers(client, test_student) -> Dict[str, str]:
    """Create auth headers for student."""
    response = client.post(
        "/auth/token",
        data={"username": test_student.username, "password": "password123"},
    )

    token = response.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}
