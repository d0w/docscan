import os
from typing import Annotated, Optional
from sqlmodel import select
import uuid
from pydantic import BaseModel

from app.models import UserCreate, UserPublic, User, RoleEnum
from ..database import SessionDep, get_session
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status, APIRouter, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

import jwt
from passlib.context import CryptContext


# token class def
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    id: uuid.UUID | None = None
    role: RoleEnum | None = None


SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    dependencies=[],
    responses={
        404: {"description": "Not found"},
        400: {"description": "Bad request"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)


def create_access_token(data, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: SessionDep
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id: uuid.UUID = uuid.UUID(payload.get("sub"))
        if user_id is None:
            raise HTTPException(
                status_code=401, detail="Invalid authentication credentials"
            )
        token_data = TokenData(id=user_id, role=payload.get("role"))
    except Exception as e:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )

    user = db.exec(select(User).where(User.id == token_data.id)).first()
    if user is None:
        raise HTTPException(
            status_code=401, detail="Invalid authentication credentials"
        )
    return user


@router.post("/signup", response_model=User)
async def signup(user: UserCreate, db: SessionDep) -> User:
    curr_user = db.exec(select(User).where(User.username == user.username)).first()
    if curr_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = pwd_context.hash(user.password)
    # db_user = User(
    #     id=uuid.uuid4(),
    #     username=user.username,
    #     name=user.name,
    #     password=hashed_password,
    #     role=user.role,
    # )

    db_user = User(
        id=uuid.uuid4(),
        password=hashed_password,
        **user.model_dump(exclude={"password"}),
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: SessionDep,
) -> Token:
    form_data = data
    user = db.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")
