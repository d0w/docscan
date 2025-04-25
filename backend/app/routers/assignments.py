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
import sqlmodel
from typing import List
import os
import uuid
import tempfile
import shutil
from ..models import File, FileCreate
from ..models import User
from ..models import (
    Assignment,
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentPopulated,
    SubmissionPopulated,
)
from ..database import get_session
from app.models import Submission
from app.routers.auth import get_current_user


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(
    prefix="/assignments",
    tags=["assignments"],
    dependencies=[],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)


@router.post("/submit", response_model=SubmissionPopulated, status_code=201)
async def create_submission(
    assignment_id: uuid.UUID = Form(...),
    comment: str = Form(None),
    files: List[UploadFile] = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> SubmissionPopulated:
    if user.role != "student":
        raise HTTPException(
            status_code=403, detail="Only students can submit assignments"
        )

    assignment = session.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # verify if user is assigned
    if user.id not in assignment.student_ids:
        raise HTTPException(
            status_code=403, detail="You are not assigned to this assignment"
        )

    # create temp directory to store files
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_file_paths = []

        if files:
            for file in files:
                if not file.filename:
                    raise HTTPException(status_code=400, detail="File name is required")

                temp_path = os.path.join(temp_dir, file.filename)
                try:
                    with open(temp_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)
                    temp_file_paths.append(
                        (temp_path, file.filename, file.content_type)
                    )
                except Exception as e:
                    raise HTTPException(
                        status_code=500, detail=f"Error saving file: {str(e)}"
                    )
                finally:
                    await file.close()

        try:
            submission = Submission(
                comment=comment,
                assignment_id=assignment.id,
                student_id=user.id,  # Replace with actual student ID
            )

            session.add(submission)
            session.flush()  # get submission.id without committing
            if files and temp_file_paths:
                for temp_path, filename, content_type in temp_file_paths:
                    perm_path = os.path.join(
                        UPLOAD_DIR,
                        f"submission_{submission.id}_{filename}",
                    )

                    # move from tmp to perm storage
                    shutil.copy2(temp_path, perm_path)

                    print(filename, perm_path)

                    file_record = File(
                        filename=filename,
                        filepath=perm_path,
                        size=os.path.getsize(perm_path),
                        submission_id=submission.id,
                        content_type=content_type,
                    )

                    session.add(file_record)

            session.commit()
            session.refresh(submission)

            return submission

        except Exception as e:
            session.rollback()
            raise HTTPException(
                status_code=500, detail=f"Error creating submission: {str(e)}"
            )


@router.post("/", response_model=Assignment, status_code=201)
async def create_assignment(
    assignment: AssignmentCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Assignment:
    student_ids = assignment.student_ids
    if user.role != "teacher":
        raise HTTPException(
            status_code=403, detail="Only teachers can create assignments"
        )
    if len(student_ids) > 0:
        students = session.exec(
            select(User)
            .where(User.role == "student")
            .where(or_(*[User.id == student_id for student_id in student_ids]))
        ).all()

        if len(students) != len(student_ids):
            raise HTTPException(
                status_code=400,
                detail="Some student IDs are invalid or not students",
            )

    db_assignment = Assignment(
        **assignment.model_dump(),
        teacher_id=user.id,
    )

    session.add(db_assignment)
    session.commit()
    session.refresh(db_assignment)
    return db_assignment


@router.get("/", response_model=List[Assignment])
async def get_assignments(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if user.role == "teacher":
        assignments = session.exec(
            select(Assignment).where(Assignment.teacher_id == user.id)
        ).all()
    else:
        # assignments = session.exec(select(Assignment)).all()
        # user_assignments = [
        #     a for a in assignments if str(user.id) in a.student_ids
        # ]  # bad code but idk

        query = select(Assignment).where(
            # Assignment.student_ids.contains([str(user.id)])
            Assignment.student_ids.any(user.id)
        )
        assignments = session.exec(query).all()

    return assignments
    # return (
    #     user_assignments if user.role != "teacher" else assignments
    # )  # bad line of code


@router.get("/{assignment_id}", response_model=AssignmentPopulated)
async def get_assignment(
    assignment_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> AssignmentPopulated:
    assignment = session.get(Assignment, assignment_id)

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if user.role == "teacher" and assignment.teacher_id != user.id:
        raise HTTPException(
            status_code=403, detail="You are not authorized to view this assignment"
        )
    elif user.role == "student" and user.id not in assignment.student_ids:
        raise HTTPException(
            status_code=403, detail="You are not authorized to view this assignment"
        )

    return Assignment(
        **assignment.model_dump(),
        teacher=assignment.teacher,
        submissions=assignment.submissions,
    )


@router.get("/{assignment_id}/submissions", response_model=List[SubmissionPopulated])
async def get_assignment_submissions(
    assignment_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> List[Submission]:
    assignment = session.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if user.role == "teacher":
        if assignment.teacher_id != user.id:
            raise HTTPException(
                status_code=403, detail="You are not authorized to view this assignment"
            )

        submissions = session.exec(
            select(Submission).where(Submission.assignment_id == assignment_id)
        ).all()

        return submissions
    else:
        if user.id not in assignment.student_ids:
            raise HTTPException(
                status_code=403, detail="You are not authorized to view this assignment"
            )

        submissions = session.exec(
            select(Submission).where(
                Submission.assignment_id == assignment_id,
                Submission.student_id == user.id,
            )
        ).all()

        # remove analytics_id and analytics from the response

    return submissions


@router.put("/{assignment_id}", response_model=Assignment)
async def update_assignment(
    assignment_id: uuid.UUID,
    assignment_update: AssignmentUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    assignment = session.get(Assignment, assignment_id)

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if user.role != "teacher" or assignment.teacher_id != user.id:
        raise HTTPException(
            status_code=403, detail="You are not authorized to update this assignment"
        )

    if assignment_update.student_ids is not None:
        students = session.exec(
            select(User)
            .where(User.role == "student")
            .where(
                or_(
                    *[
                        User.id == student_id
                        for student_id in assignment_update.student_ids
                    ]
                )
            )
        ).all()

        if len(students) != len(assignment_update.student_ids):
            raise HTTPException(
                status_code=400,
                detail="Some student IDs are invalid or not students",
            )

    assignment_data = assignment_update.model_dump(exclude_unset=True)
    for key, value in assignment_data.items():
        setattr(assignment, key, value)

    if assignment_update.student_ids is not None:
        assignment.student_ids = assignment_update.student_ids
    session.add(assignment)
    session.commit()
    session.refresh(assignment)

    return assignment
