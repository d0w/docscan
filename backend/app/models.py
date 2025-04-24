from typing import Optional, List
import uuid
from enum import Enum
from datetime import datetime

from sqlmodel import Field, SQLModel, Relationship, Column, JSON, ARRAY, String, UUID

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
        if not all(x.isalpha or x.isspace() for x in v):
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

    created_assignments: List["Assignment"] = Relationship(
        back_populates="teacher",
        sa_relationship_kwargs={"foreign_keys": "Assignment.teacher_id"},
    )

    submissions: List["Submission"] = Relationship(
        back_populates="student",
    )


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
        return self.password


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
            return self.password
        return None


class AssignmentBase(SQLModel):
    title: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    student_ids: List[uuid.UUID] = Field(default=[], sa_column=Column(ARRAY(UUID)))


class Assignment(AssignmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    teacher_id: uuid.UUID = Field(..., foreign_key="user.id")

    teacher: "User" = Relationship(back_populates="created_assignments")
    submissions: List["Submission"] = Relationship(back_populates="assignment")


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(AssignmentBase):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    student_ids: Optional[List[uuid.UUID]] = None


class SubmissionBase(SQLModel):
    comment: Optional[str] = None
    assignment_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="assignment.id"
    )
    student_id: uuid.UUID = Field(foreign_key="user.id")


class Submission(SubmissionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student: User = Relationship(back_populates="submissions")

    analytics_id: uuid.UUID = Field(foreign_key="analytics.id")
    analytics: Optional["Analytics"] = Relationship(back_populates="submission")

    assignment: "Assignment" = Relationship(back_populates="submissions")
    files: List["File"] = Relationship(back_populates="submission")


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionPublic(SubmissionBase):
    id: uuid.UUID | None = None
    student_id: uuid.UUID
    student: User
    commeht: str | None = None
    files: List["File"] | None = None


class FileBase(SQLModel):
    filename: str = Field(...)
    submission_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="submission.id"
    )

    @field_validator("filename")
    def validate_name(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Name must contain only letters")
        return v


class File(FileBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    filepath: str = Field(...)

    submission: Optional["Submission"] = Relationship(back_populates="files")

    @field_validator("filepath")
    def validate_filepath(cls, v: str) -> str:
        if not v.startswith("/"):
            raise ValueError("Filepath must start with '/'")
        return v


# adds in fields over base that we allow for creation
class FileCreate(FileBase):
    pass


class AnalyticsBase(SQLModel):
    submission_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="submission.id"
    )


class Analytics(AnalyticsBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    submission: Optional["Submission"] = Relationship(back_populates="analytics")
    data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
