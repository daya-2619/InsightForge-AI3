import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get DATABASE_URL from environment or default to a local SQLite database
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./insightforge.db"

# Fix PostgreSQL protocol prefix if necessary (for compatibility with render/neon)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure SQLite specific argument if needed
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, nullable=False)
    model_id = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "Success", "Failed"
    latency = Column(String, nullable=False)  # "122ms", "--"
    cost = Column(Float, nullable=False)

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String, nullable=False)
    tier = Column(String, nullable=False)  # "Enterprise Tier", "Standard Tier"
    status = Column(String, nullable=False)  # "Verified", "Processing", "Failed"
    value = Column(String, nullable=False)  # "$82,400.00"
    confidence = Column(Integer, nullable=False)  # Percentage score e.g. 98

class KPIRecord(Base):
    __tablename__ = "kpi_records"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False, index=True)  # "Global", "North America", "Europe", "APAC"
    days = Column(Integer, nullable=False, index=True)   # 30, 90, 365
    total_revenue = Column(String, nullable=False)
    revenue_growth = Column(String, nullable=False)
    net_profit = Column(String, nullable=False)
    profit_growth = Column(String, nullable=False)
    active_users = Column(String, nullable=False)
    user_growth = Column(String, nullable=False)
    growth_rate = Column(String, nullable=False)
    growth_change = Column(String, nullable=False)
    
    # Stored as JSON strings to maintain flexibility
    revenue_chart_data = Column(Text, nullable=False)
    region_data = Column(Text, nullable=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
