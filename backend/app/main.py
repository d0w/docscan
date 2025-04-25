from fastapi import Depends, FastAPI
import os
from sqlmodel import create_engine, Session, SQLModel, select
from dotenv import load_dotenv
from typing import Annotated

from fastapi.middleware.cors import CORSMiddleware


from . import models
from .database import create_db_and_tables, get_session

from .routers import users, auth, assignments, files, analyze

load_dotenv()


# app = FastAPI(dependencies=[Depends()])
app = FastAPI()


# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Allow all origins for development
#     # allow_origins=[
#     #     "http://localhost:5173",
#     #     "http://frontend:5173",
#     # ],  # Replace "*" with specific origins in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


app.include_router(users.router)
app.include_router(auth.router)
app.include_router(assignments.router)
app.include_router(files.router)
app.include_router(analyze.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
async def root():
    return {"message": "API Root"}
