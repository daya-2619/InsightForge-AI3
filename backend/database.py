import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import time
from sqlalchemy import text

# Global cache for dynamic database engine switching
_engine = None
_SessionLocal = None
_current_url = None
_use_sqlite_fallback = False
_last_fallback_check = 0

Base = declarative_base()

def reset_db_connection():
    global _engine, _SessionLocal, _current_url, _use_sqlite_fallback, _last_fallback_check
    if _engine is not None:
        try:
            _engine.dispose()
        except Exception:
            pass
    _engine = None
    _SessionLocal = None
    _current_url = None
    _use_sqlite_fallback = False
    _last_fallback_check = 0

def get_engine():
    global _engine, _current_url, _use_sqlite_fallback, _last_fallback_check
    
    # Reload environment to pick up any runtime changes to .env
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    load_dotenv(env_path, override=True)
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_url = "sqlite:///./insightforge.db"
        
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    current_time = time.time()
    url_changed = _engine is None or db_url != _current_url
    retry_postgres = _use_sqlite_fallback and (current_time - _last_fallback_check > 30)
    
    if url_changed or retry_postgres:
        _current_url = db_url
        _last_fallback_check = current_time
        
        if db_url.startswith("postgresql"):
            try:
                # Test connectivity with a short 2s timeout
                test_engine = create_engine(db_url, connect_args={"connect_timeout": 2})
                with test_engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                test_engine.dispose()
                
                # Connection successful!
                _engine = create_engine(db_url, connect_args={"connect_timeout": 5})
                _use_sqlite_fallback = False
            except Exception as e:
                print(f"Warning: PostgreSQL database is unreachable. Falling back to SQLite. Error: {str(e)}")
                fallback_url = "sqlite:///./insightforge.db"
                _engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
                _use_sqlite_fallback = True
        else:
            # SQLite URL
            _engine = create_engine(db_url, connect_args={"check_same_thread": False})
            _use_sqlite_fallback = False
        
    return _engine

def get_sessionmaker():
    global _SessionLocal
    engine = get_engine()
    
    if _SessionLocal is None or _SessionLocal.kw.get("bind") != engine:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
    return _SessionLocal

class DynamicSessionLocal:
    """Callable wrapper that delegates to the current active sessionmaker."""
    def __call__(self, *args, **kwargs):
        return get_sessionmaker()(*args, **kwargs)

SessionLocal = DynamicSessionLocal()

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

class DimCustomer(Base):
    __tablename__ = "dim_customers"

    customer_code = Column(String, primary_key=True, index=True)
    customer = Column(String, nullable=False)
    market = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    channel = Column(String, nullable=False)
    company = Column(String, nullable=False)  # "parent" or "child"

class DimProduct(Base):
    __tablename__ = "dim_products"

    product_code = Column(String, primary_key=True, index=True)
    division = Column(String, nullable=False)
    category = Column(String, nullable=False)
    product = Column(String, nullable=False)
    variant = Column(String, nullable=False)
    company = Column(String, nullable=False)  # "parent" or "child"

class DimGrossPrice(Base):
    __tablename__ = "dim_gross_prices"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=True, index=True)  # 1-12 for monthly (child), Null for yearly (parent)
    company = Column(String, nullable=False)  # "parent" or "child"

class FactOrder(Base):
    __tablename__ = "fact_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, nullable=True)  # child company orders have order_id
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    product_code = Column(String, nullable=False, index=True)
    customer_code = Column(String, nullable=False, index=True)
    sold_quantity = Column(Integer, nullable=False)
    company = Column(String, nullable=False)  # "parent" or "child"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=get_engine())

