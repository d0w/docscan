from typing import Optional
import uuid
from enum import Enum

from sqlmodel import Field, SQLModel
from pydantic import field_validator


class RoleEnum(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserBase(SQLModel):
    name: str = Field(..., min_length=1, max_length=50)
    username: str = Field(..., min_length=1, max_length=50, unique=True, index=True)

    @field_validator("name")
    def validate_name(cls, v: str) -> str:
        if not v.isalpha():
            raise ValueError("Name must contain only letters")
        return v

    @field_validator("username")
    def validate_username(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Username cannot be empty")
        return v


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role: RoleEnum = Field(...)
    password: str = Field(..., min_length=8)


# the model that actually gets returned to clients
class UserPublic(UserBase):
    id: uuid.UUID
    username: str
    name: str
    role: RoleEnum


# adds in fields over base that we allow for creation
class UserCreate(UserBase):
    role: RoleEnum
    password: str = Field(..., min_length=8)

    def get_hashed_password(self) -> str:
        # probably do this within the router file and not here
        return self.password  # TODO: Hash passwords


class UserUpdate(UserBase):
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    def validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value and len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return value

    def get_hashed_password(self) -> Optional[str]:
        if self.password:
            return self.password  # TODO: Hash passwords
        return None
