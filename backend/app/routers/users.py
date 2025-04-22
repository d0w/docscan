import uuid
from fastapi import APIRouter, HTTPException, status
from typing import Any
from ..models.UserModel import UserCreate, UserPublic, User

from sqlmodel import select

from ..database import SessionDep

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"},
    },
)


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: uuid.UUID, session: SessionDep) -> Any:
    # get user from database

    user = session.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post(
    "/",
    response_model=UserPublic,
    tags=["post"],
    responses={403: {"description": "Forbidden"}},
    status_code=status.HTTP_201_CREATED,
)
async def create_user(data: UserCreate, session: SessionDep) -> Any:
    existing_user = session.exec(
        select(User).where(User.username == data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            detail="Username already exists", status_code=status.HTTP_400_BAD_REQUEST
        )

    hashed_password = data.get_hashed_password()

    # can also do model_dump()
    user = User(
        id=uuid.uuid4(),
        username=data.username,
        name=data.name,
        password=hashed_password,
        role=data.role,
    )

    session.add(user)
    session.commit()
    session.refresh(user)
    return user
