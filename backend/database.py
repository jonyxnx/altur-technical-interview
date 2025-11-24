from sqlalchemy import create_engine, Column, String, DateTime, Text, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CallRecord(Base):
    __tablename__ = "calls"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    transcript = Column(Text, default="")
    summary = Column(Text, default="")
    tags = Column(Text, default="[]")  # Stored as JSON string for SQLite compatibility
    file_hash = Column(String, nullable=True, index=True) 


def init_db():
    """Initialize the database"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

