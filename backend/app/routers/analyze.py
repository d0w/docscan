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
from ..models import (
    Analytic,
    File,
    FileCreate,
    User,
    Assignment,
    AssignmentCreate,
    AssignmentUpdate,
    SubmissionPopulated,
)
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


@router.post("/", response_model=SubmissionPopulated, status_code=201)
async def create_analytic(
    submission_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SubmissionPopulated:
    # create analytic under current user
    analytic_dict = Analytic(id=uuid.uuid4(), data={})

    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if user.role != "teacher" or user.id != submission.assignment.teacher_id:
        raise HTTPException(
            status_code=403, detail="Only teachers can create analytics"
        )

    submission.analytic = analytic_dict

    session.add(analytic_dict)
    session.add(submission)
    session.commit()
    session.refresh(submission)
    session.refresh(analytic_dict)

    return submission
