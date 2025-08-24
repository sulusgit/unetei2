from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import DB_DSN

engine = create_engine(DB_DSN, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()