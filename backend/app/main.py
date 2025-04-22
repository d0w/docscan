from fastapi import Depends, FastAPI
import os
from sqlmodel import create_engine, Session, SQLModel, select
from dotenv import load_dotenv
from typing import Annotated

from . import models
from .database import create_db_and_tables, get_session

from .routers import users, auth

load_dotenv()


# app = FastAPI(dependencies=[Depends()])
app = FastAPI()

app.include_router(users.router)
app.include_router(auth.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
async def root():
    return {"message": "API Root"}
