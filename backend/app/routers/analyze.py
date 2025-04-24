import re
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File as FastAPIFile,
    HTTPException,
    Form,
    Body,
    Query,
)
from sqlmodel import Session, select, or_, text, JSON, cast, literal
from typing import Annotated, List
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
import logging
import httpx

logger = logging.getLogger(__name__)

LLM_API_URL = os.getenv("LLM_API_URL", "http://10.0.0.52:11434/api/generate")
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


async def llm_analyze(
    file_record: File, prompt: str = "Please summarize this file"
) -> dict:
    file_path = file_record.filepath
    with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
        file_content = file.read()

    file_type = (
        file_record.content_type if file_record.content_type is not None else "text"
    )

    try:
        logger.info(
            f"Sending request to LLM API: {LLM_API_URL} for file {file_record.filename}"
        )

        llm_prompt = (
            f"{prompt}\n\nFile Type: {file_type}\n\nFile Content:\n{file_content}"
        )

        print(LLM_API_URL)

        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            response = await client.post(
                LLM_API_URL,
                json={"model": "deepseek-r1:8b", "prompt": llm_prompt, "stream": False},
            )

        if response.status_code != 200:
            logger.error(f"LLM API returned status code {response.status_code}")
            return {
                "status": response.status_code,
                "file_name": file_record.filename,
                "prompt": prompt,
                "analysis": "Error: Failed to get response from LLM",
            }

        result = response.json()

        cleaned_analysis = re.sub(
            r"<think\b[^>]*>.*?</think>",
            "",
            result.get("response", ""),
            flags=re.DOTALL,
        )
        print(cleaned_analysis)
        return {
            "status": response.status_code,
            "file_name": file_record.filename,
            "prompt": prompt,
            "analysis": cleaned_analysis.strip(),
        }

    except Exception as e:
        print(f"Error during LLM analysis: {str(e)}")
        return {
            "status": 500,
            "file_name": file_record.filename,
            "prompt": prompt,
            "analysis": f"Error: {str(e)}",
        }


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


@router.post("/request", response_model=Analytic, status_code=201)
async def request_analytic(
    prompt: Annotated[str, Body(embed=True)],
    submission_id: uuid.UUID = Query(...),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Analytic:
    # get submission and the associated analytic
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if user.role != "teacher" or user.id != submission.assignment.teacher_id:
        raise HTTPException(
            status_code=403, detail="Only teachers can request analytics"
        )

    analytic = submission.analytic
    if not analytic:
        raise HTTPException(
            status_code=404,
            detail="Analytic not found. Try creating an analytic on the requested submission first",
        )

    files = submission.files
    if len(files) < 1:
        raise HTTPException(
            status_code=400,
            detail="No files found in the submission.",
        )

    analytic_data = {}

    # no need to thread multiple files, only analyzing a couple of files
    for file_record in files:
        # pass it the File object and the prompt
        res = await llm_analyze(file_record, prompt)
        if not res.get("status") == 200:
            raise HTTPException(
                status_code=res.get("status"),
                detail=f"Error analyzing file {file_record.filename}: {res.get('analysis')}",
            )

        analytic_data[file_record.filename] = res

    analytic.data = analytic_data

    session.add(analytic)
    session.commit()
    session.refresh(analytic)

    return analytic
