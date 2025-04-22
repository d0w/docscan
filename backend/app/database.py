from sqlmodel import SQLModel, create_engine, Session
import os
from typing import Annotated
from fastapi import Depends

postgresql_url = os.getenv(
    "POSTGRESQL_URL", "postgresql://postgres:postgres@db:5432/postgres"
)

engine = create_engine(postgresql_url)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
