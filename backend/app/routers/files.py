# import uuid
# from fastapi import APIRouter, HTTPException, status, Depends
# from typing import Any
# from ..models.UserModel import UserCreate, UserPublic, User
#
# from sqlmodel import select
#
# from ..database import SessionDep
# from .auth import get_current_user
#
# router = APIRouter
#     prefix="/files",
#     tags=["files"],
#     dependencies=[],
#     responses={
#         404: {"description": "Not found"},
#         500: {"description": "Internal server error"},
#     },
# )
#
# @router.get("/{file_id}", response_mode=File)
# async def get_file(file_id: uuid.UUID, session: SessionDep) -> File:
#     return None
