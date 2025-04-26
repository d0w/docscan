import pytest
from fastapi.testclient import TestClient
import uuid
import re
from sqlmodel import select

from app.models import User


def test_signup_success(client, db_session):
    """Test successful user signup."""
    user_data = {
        "username": "newuser",
        "name": "New User",
        "password": "securepassword",
        "role": "student",
    }

    response = client.post("/auth/signup", json=user_data)

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == user_data["username"]
    assert data["name"] == user_data["name"]
    assert data["role"] == user_data["role"]
    assert "password" not in data  # Password should not be returned

    # Verify user was created in the database
    user = db_session.exec(
        select(User).where(User.username == user_data["username"])
    ).first()
    assert user is not None
    assert user.username == user_data["username"]


def test_signup_duplicate_username(client, test_student):
    """Test signup with an existing username."""
    user_data = {
        "username": test_student.username,  # Using existing username
        "name": "Duplicate User",
        "password": "securepassword",
        "role": "student",
    }

    response = client.post("/auth/signup", json=user_data)

    assert response.status_code == 400
    assert "Username already exists" in response.json()["detail"]


def test_login_success(client, test_student):
    """Test successful login."""
    login_data = {"username": test_student.username, "password": "password123"}

    response = client.post("/auth/token", data=login_data)

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Verify token format (should be a JWT)
    token = data["access_token"]
    assert len(token.split(".")) == 3  # JWT has 3 parts separated by dots


def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    login_data = {"username": "nonexistent_user", "password": "wrongpassword"}

    response = client.post("/auth/token", data=login_data)

    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]
