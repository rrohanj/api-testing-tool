from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# For local development, this creates a file named 'sql_app.db'
SQLALCHEMY_DATABASE_URL = "sqlite:////tmp/sql_app.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)