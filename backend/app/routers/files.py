from app.database import get_session
from app.routers.auth import get_current_user
from fastapi.responses import FileResponse
from fastapi import APIRouter, HTTPException, Depends
import uuid

from sqlmodel import Session

from ..models import File, Submission, Assignment, User

router = APIRouter(
    prefix="/files",
    tags=["files"],
    dependencies=[],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)


@router.get("/{file_id}", response_class=FileResponse)
async def get_file(
    file_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    file_record = session.get(File, file_id)

    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    submission = session.get(Submission, file_record.submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assignment = session.get(Assignment, submission.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if user.role == "teacher" and assignment.teacher_id != user.id:
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this file"
        )

    elif user.role == "student" and submission.student_id != user.id:
        raise HTTPException(
            status_code=403, detail="You do not have permission to access this file"
        )

    # try to find file on file system
    try:
        f = open(file_record.filepath, "rb")
        f.close()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found on the server")

    return FileResponse(
        path=file_record.filepath,
        filename=file_record.filename,
        media_type=file_record.content_type
        if file_record.content_type is not None
        else "application/octet-stream",
    )
