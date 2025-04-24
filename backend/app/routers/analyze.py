from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File as FastAPIFile,
    HTTPException,
    Form,
    Body,
)
from sqlmodel import Session, select, or_, text, JSON, cast, literal
from typing import List
import os
import uuid
import tempfile
import shutil
from ..models import File, FileCreate
from ..models import User
from ..models import Assignment, AssignmentCreate, AssignmentUpdate
from ..database import get_session
from app.models import Submission
from app.routers.auth import get_current_user


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(
    prefix="/analyze",
    tags=["analyze"],
    dependencies=[],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)
