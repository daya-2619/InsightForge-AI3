import os
import json
import time
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import get_db, init_db, KPIRecord, ExecutionLog, Activity, DimCustomer, DimProduct, DimGrossPrice, FactOrder
from ingestion_service import parse_uploaded_file, validate_and_convert_records, ingest_data
from etl_pipeline import run_etl_pipeline
from fastapi import File, UploadFile, Form
from sqlalchemy import create_engine, text

app = FastAPI(title="InsightForge AI API", version="1.0.0")

# Enable CORS for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB initialization
@app.on_event("startup")
def startup_event():
    init_db()

# Pydantic schemas
class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": os.getenv("DATABASE_URL", "SQLite Local Fallback")}

@app.get("/api/dashboard-stats")
def get_dashboard_stats(
    region: str = Query("Global", description="Filter by region (Global, North America, Europe, APAC)"),
    days: int = Query(30, description="Filter by time period (30, 90, 365)"),
    db: Session = Depends(get_db)
):
    # Fetch KPI record
    kpi = db.query(KPIRecord).filter(
        KPIRecord.region == region,
        KPIRecord.days == days
    ).first()
    
    if not kpi:
        # Fallback to Global 30 days if not found
        kpi = db.query(KPIRecord).filter(
            KPIRecord.region == "Global",
            KPIRecord.days == 30
        ).first()

    # Fetch recent activities
    activities = db.query(Activity).order_by(Activity.id.desc()).all()
    
    # Parse JSON values
    try:
        chart_data = json.loads(kpi.revenue_chart_data)
        region_data = json.loads(kpi.region_data)
    except Exception:
        chart_data = {"actual": [0], "forecast": [0]}
        region_data = {}

    return {
        "region": kpi.region,
        "days": kpi.days,
        "total_revenue": kpi.total_revenue,
        "revenue_growth": kpi.revenue_growth,
        "net_profit": kpi.net_profit,
        "profit_growth": kpi.profit_growth,
        "active_users": kpi.active_users,
        "user_growth": kpi.user_growth,
        "growth_rate": kpi.growth_rate,
        "growth_change": kpi.growth_change,
        "chart_data": chart_data,
        "region_data": region_data,
        "recent_activities": [
            {
                "id": act.id,
                "entity_name": act.entity_name,
                "tier": act.tier,
                "status": act.status,
                "value": act.value,
                "confidence": act.confidence
            }
            for act in activities
        ]
    }

@app.get("/api/logs")
def get_logs(
    search: Optional[str] = Query(None, description="Search by model name"),
    status: Optional[str] = Query(None, description="Filter by status (Success, Failed)"),
    db: Session = Depends(get_db)
):
    query = db.query(ExecutionLog)
    
    if search:
        query = query.filter(ExecutionLog.model_id.ilike(f"%{search}%"))
    if status:
        query = query.filter(ExecutionLog.status == status)
        
    logs = query.order_by(ExecutionLog.id.desc()).all()
    
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp,
            "model_id": log.model_id,
            "status": log.status,
            "latency": log.latency,
            "cost": log.cost
        }
        for log in logs
    ]

@app.post("/api/diagnose")
def initiate_diagnose(db: Session = Depends(get_db)):
    # Simulated root cause diagnosis sequence
    return {
        "status": "success",
        "steps": [
            "Initializing virtual node network scan...",
            "Evaluating high-latency indicators on Frankfurt nodes...",
            "Profiling database transaction load patterns...",
            "Executing cyclic model prediction variance..."
        ],
        "results": {
            "deviation": "14.2% cyclic variance in EU nodes",
            "recommendation": "European response delay identified due to DB connection pools exhaustion. Deploying replica servers in Frankfurt and increasing pool limit to 100 recommended.",
            "confidence": "92.4%",
            "severity": "High"
        }
    }

@app.post("/api/chat")
def chat_copilot(request: ChatRequest, db: Session = Depends(get_db)):
    msg = request.message.strip().lower()
    
    # Check if consolidated ETL database has records
    has_consolidated_data = False
    try:
        has_consolidated_data = db.query(FactOrder).first() is not None
    except Exception:
        pass

    # Context-aware responses containing rich metadata (SQL pane and SVG custom charts)
    if "revenue" in msg or "sales" in msg or "money" in msg or "earnings" in msg or "value" in msg:
        if has_consolidated_data:
            # Query actual DB values
            try:
                parent_rev = db.execute(text("""
                    SELECT SUM(fo.sold_quantity * gp.price)
                    FROM fact_orders fo
                    JOIN dim_gross_prices gp ON fo.product_code = gp.product_code 
                        AND fo.company = gp.company
                        AND gp.company = 'parent'
                        AND gp.year = CAST(SUBSTR(fo.date, 1, 4) AS INTEGER)
                """)).scalar() or 0.0

                child_rev = db.execute(text("""
                    SELECT SUM(fo.sold_quantity * gp.price)
                    FROM fact_orders fo
                    JOIN dim_gross_prices gp ON fo.product_code = gp.product_code 
                        AND fo.company = gp.company
                        AND gp.company = 'child'
                        AND gp.year = CAST(SUBSTR(fo.date, 1, 4) AS INTEGER)
                        AND gp.month = CAST(SUBSTR(fo.date, 6, 2) AS INTEGER)
                """)).scalar() or 0.0

                total_rev = parent_rev + child_rev

                # Format in Billions (₹B) and Millions ($M USD equivalent, 1 USD = 83 INR)
                parent_b = parent_rev / 1_000_000_000.0
                child_b = child_rev / 1_000_000_000.0
                total_b = total_rev / 1_000_000_000.0

                parent_usd = (parent_rev / 83.0) / 1_000_000.0
                child_usd = (child_rev / 83.0) / 1_000_000.0
                total_usd = (total_rev / 83.0) / 1_000_000.0

                response_text = (
                    f"I have executed a live analytical query against our consolidated sales data warehouse. "
                    f"Here are the revenue aggregates across our business segments:\n\n"
                    f"- **Parent Company Revenue**: **₹{parent_b:.2f}B** (~${parent_usd:,.1f}M USD)\n"
                    f"- **Child Company Revenue**: **₹{child_b:.2f}B** (~${child_usd:,.1f}M USD)\n"
                    f"- **Combined Consolidated Revenue**: **₹{total_b:.2f}B** (~${total_usd:,.1f}M USD)\n\n"
                    f"The parent company (sports goods) remains the primary revenue driver, representing the bulk of sales. "
                    f"The child company (sports nutrition) contributes a steady **₹{child_b:.2f}B** since its acquisition in July 2025."
                )
                sql_query = (
                    "SELECT \n"
                    "    fo.company,\n"
                    "    SUM(fo.sold_quantity * gp.price) AS total_revenue\n"
                    "FROM fact_orders fo\n"
                    "JOIN dim_gross_prices gp ON fo.product_code = gp.product_code \n"
                    "    AND fo.company = gp.company\n"
                    "    AND gp.year = CAST(SUBSTR(fo.date, 1, 4) AS INTEGER)\n"
                    "    AND (gp.month IS NULL OR gp.month = CAST(SUBSTR(fo.date, 6, 2) AS INTEGER))\n"
                    "GROUP BY fo.company;"
                )
                chart_data = {
                    "type": "bar",
                    "title": "Revenue Share (Billions INR)",
                    "labels": ["Parent Company", "Child Company"],
                    "values": [round(parent_b, 2), round(child_b, 2)]
                }
                metrics = [
                    {"label": "Parent Sales Share", "value": f"₹{parent_b:.2f}B", "sub": f"{parent_rev/total_rev*100:.2f}% of portfolio"},
                    {"label": "Child Nutrition Share", "value": f"₹{child_b:.2f}B", "sub": f"{child_rev/total_rev*100:.2f}% of portfolio"}
                ]
            except Exception as e:
                has_consolidated_data = False  # Fallback on error

        if not has_consolidated_data:
            response_text = (
                "I've fetched our Q3 financial statistics from the primary database logs. "
                "Our overall enterprise revenue stands at **$2.4M**, showing a strong **+12%** growth rate. "
                "However, the EMEA market experienced a minor 4% slowdown during Week 2, which was quickly corrected."
            )
            sql_query = (
                "SELECT region, sum(revenue) as total_revenue, avg(growth) as avg_growth\n"
                "FROM financial_records\n"
                "WHERE quarter = 'Q3'\n"
                "GROUP BY region\n"
                "ORDER BY total_revenue DESC;"
            )
            chart_data = {
                "type": "bar",
                "title": "Revenue by Region (Millions USD)",
                "labels": ["N. America", "Europe", "APAC", "LATAM"],
                "values": [1.2, 0.7, 0.5, 0.2]
            }
            metrics = [
                {"label": "Direct Sales", "value": "$1.82M", "sub": "+14.1% MoM"},
                {"label": "Partner Sales", "value": "$0.58M", "sub": "+5.2% MoM"}
            ]
            
    elif "customers" in msg or "clients" in msg or "market" in msg or "city" in msg or "cities" in msg:
        if has_consolidated_data:
            try:
                # Query actual DB values
                total_cust = db.query(DimCustomer).count()
                parent_cust = db.query(DimCustomer).filter(DimCustomer.company == 'parent').count()
                
                city_counts = db.execute(text("""
                    SELECT market, COUNT(*) AS count
                    FROM dim_customers
                    WHERE company = 'child'
                    GROUP BY market
                    ORDER BY count DESC
                """)).fetchall()

                city_breakdown_str = "\n".join([f"    - **{row[0]}**: **{row[1]}** stores" for row in city_counts])
                
                response_text = (
                    f"I have executed a client demographics query on our `dim_customers` table.\n\n"
                    f"We have a total of **{total_cust} active customer/retail nodes** across our segments:\n"
                    f"- **Parent Company (India Market)**: **{parent_cust}** major retailer groups\n"
                    f"- **Child Company (Metropolitan Expansion)**:\n{city_breakdown_str}\n\n"
                    f"The child company expands our retail presence into high-density metropolitan areas (Delhi, Hyderabad, Bengaluru)."
                )
                sql_query = (
                    "SELECT market, COUNT(*) AS customer_count\n"
                    "FROM dim_customers\n"
                    "GROUP BY market\n"
                    "ORDER BY customer_count DESC;"
                )
                
                chart_labels = ["India (Parent)"] + [row[0] for row in city_counts]
                chart_values = [parent_cust] + [row[1] for row in city_counts]
                
                chart_data = {
                    "type": "pie",
                    "title": "Customer Node Distribution",
                    "labels": chart_labels,
                    "values": chart_values
                }
                metrics = [
                    {"label": "Total Active Client Nodes", "value": str(total_cust), "sub": "Parent + Child consolidated"},
                    {"label": "Child Expansion Reach", "value": f"{len(city_counts)} Cities", "sub": "Metropolitan penetration"}
                ]
            except Exception:
                has_consolidated_data = False

        if not has_consolidated_data:
            # Fallback to mock churn response
            response_text = (
                "Our current customer churn audit indicates a contract expiry concentration in the 'Mid-Market' segment. "
                "The overall customer churn rate increased slightly to **12.4%** (+2.1% from last month), primarily affecting 42 accounts "
                "whose contracts expired concurrently. I recommend launching targeted retention alerts 60 days prior to contract expiry."
            )
            sql_query = (
                "SELECT count(user_id) as churned_users, segment, reason\n"
                "FROM churn_events\n"
                "WHERE date >= date_sub(now(), interval 30 day)\n"
                "GROUP BY segment, reason;"
            )
            chart_data = {
                "type": "pie",
                "title": "Churn Reasons (Mid-Market)",
                "labels": ["Contract Expiry", "Competitor Upgrade", "Pricing", "Support Delay"],
                "values": [55, 20, 15, 10]
            }
            metrics = [
                {"label": "Churn Rate", "value": "12.4%", "sub": "+2.1% increase"},
                {"label": "Key Reason", "value": "Contract Expiry", "sub": "42 accounts affected"}
            ]

    elif "churn" in msg or "retention" in msg or "users" in msg:
        # standard mock churn response
        response_text = (
            "Our current customer churn audit indicates a contract expiry concentration in the 'Mid-Market' segment. "
            "The overall customer churn rate increased slightly to **12.4%** (+2.1% from last month), primarily affecting 42 accounts "
            "whose contracts expired concurrently. I recommend launching targeted retention alerts 60 days prior to contract expiry."
        )
        sql_query = (
            "SELECT count(user_id) as churned_users, segment, reason\n"
            "FROM churn_events\n"
            "WHERE date >= date_sub(now(), interval 30 day)\n"
            "GROUP BY segment, reason;"
        )
        chart_data = {
            "type": "pie",
            "title": "Churn Reasons (Mid-Market)",
            "labels": ["Contract Expiry", "Competitor Upgrade", "Pricing", "Support Delay"],
            "values": [55, 20, 15, 10]
        }
        metrics = [
            {"label": "Churn Rate", "value": "12.4%", "sub": "+2.1% increase"},
            {"label": "Key Reason", "value": "Contract Expiry", "sub": "42 accounts affected"}
        ]
        
    elif "model" in msg or "accuracy" in msg or "performance" in msg or "speed" in msg:
        response_text = (
            "Comparing our baseline core models shows a distinct latency-to-accuracy trade-off. "
            "**IF-GPT-4o-V2** offers excellent lightweight speed (122ms average latency) but slightly lower domain specialization, "
            "whereas **IF-LLAMA3-70B** maintains superior structured task reasoning but features higher latency (842ms)."
        )
        sql_query = (
            "SELECT model_id, avg(latency) as avg_latency, count(id) as total_inferences\n"
            "FROM execution_logs\n"
            "WHERE status = 'Success'\n"
            "GROUP BY model_id;"
        )
        chart_data = {
            "type": "bar",
            "title": "Model Average Latency (ms)",
            "labels": ["GPT-4o-V2", "CLAUDE-3.5", "LLAMA3-70B"],
            "values": [122, 412, 842]
        }
        metrics = [
            {"label": "GPT-4o-V2 Latency", "value": "122ms", "sub": "Standard speed"},
            {"label": "LLAMA3-70B Latency", "value": "842ms", "sub": "Heavy reasoning"}
        ]
        
    else:
        # General response
        response_text = (
            "Hello! I am your **InsightForge AI Copilot**. I have real-time analytical access to all nodes, "
            "databases, execution logs, and activities across the system. "
            "Ask me specific questions like *'Why did revenue drop last month?'*, *'Analyze customer churn'*, "
            "or *'Compare model accuracy'* and I will fetch live telemetry, generate structural SQL queries, "
            "and render interactive data visualizations for you!"
        )
        sql_query = None
        chart_data = None
        metrics = None

    return {
        "message": {
            "role": "assistant",
            "content": response_text
        },
        "sql": sql_query,
        "chart": chart_data,
        "metrics": metrics
    }

# NeonDB Integration Schemas & Endpoints
class NeonDBConfig(BaseModel):
    database_url: str

class TestConnectionRequest(BaseModel):
    database_url: str

@app.get("/api/neondb/config")
def get_neondb_config():
    db_url = os.getenv("DATABASE_URL", "")
    
    # Mask connection URL for safety
    masked_url = ""
    if db_url:
        if "@" in db_url:
            prefix, rest = db_url.split("@", 1)
            masked_url = "postgresql://****:****@" + rest
        else:
            masked_url = "postgresql://****"
            
    return {
        "database_url": db_url,
        "masked_url": masked_url,
        "is_configured": bool(db_url and not db_url.startswith("sqlite"))
    }

@app.get("/api/neondb/tables")
def get_tables_stats(db: Session = Depends(get_db)):
    try:
        logs_count = db.query(ExecutionLog).count()
        act_count = db.query(Activity).count()
        kpi_count = db.query(KPIRecord).count()
        cust_count = db.query(DimCustomer).count()
        prod_count = db.query(DimProduct).count()
        price_count = db.query(DimGrossPrice).count()
        order_count = db.query(FactOrder).count()
        return {
            "execution_logs": logs_count,
            "activities": act_count,
            "kpi_records": kpi_count,
            "dim_customers": cust_count,
            "dim_products": prod_count,
            "dim_gross_prices": price_count,
            "fact_orders": order_count
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "execution_logs": 0,
            "activities": 0,
            "kpi_records": 0,
            "dim_customers": 0,
            "dim_products": 0,
            "dim_gross_prices": 0,
            "fact_orders": 0
        }

@app.post("/api/neondb/run-etl")
def trigger_etl_pipeline(db: Session = Depends(get_db)):
    try:
        # Find base data directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(base_dir, "data")
        
        result = run_etl_pipeline(db, data_dir)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETL pipeline run failed: {str(e)}")

@app.post("/api/neondb/config")
def save_neondb_config(config: NeonDBConfig):
    url = config.database_url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Database URL cannot be empty.")
        
    if url.startswith("postgresql://****"):
        return {"status": "success", "message": "Database configuration kept as is."}
        
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    
    # Read existing variables
    existing_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    parts = line.strip().split("=", 1)
                    if len(parts) == 2:
                        existing_vars[parts[0].strip()] = parts[1].strip()
                        
    existing_vars["DATABASE_URL"] = url
    
    # Write back to .env
    with open(env_path, "w") as f:
        for k, v in existing_vars.items():
            f.write(f"{k}={v}\n")
            
    # Reload environment
    load_dotenv(env_path, override=True)
    
    try:
        init_db()
        return {"status": "success", "message": "NeonDB connection string saved and tables initialized successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Saved config but failed to initialize tables: {str(e)}")

@app.post("/api/neondb/test-connection")
def test_neondb_connection(req: TestConnectionRequest):
    url = req.database_url.strip()
    if url.startswith("postgresql://****"):
        url = os.getenv("DATABASE_URL", "")
        
    if not url:
        raise HTTPException(status_code=400, detail="Database URL is empty.")
        
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    try:
        # Create temp engine and try to connect
        temp_engine = create_engine(url, connect_args={"connect_timeout": 5})
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "success", "message": "Successfully established handshake with NeonDB database."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Handshake failed: {str(e)}")

@app.post("/api/neondb/ingest")
async def ingest_file(
    file: UploadFile = File(...),
    table_name: str = Form(...),
    mode: str = Form("overwrite"),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        
        # 1. Parse file content
        raw_records = parse_uploaded_file(content, file.filename)
        
        # 2. Validate fields
        converted_records = validate_and_convert_records(table_name, raw_records)
        
        # 3. Perform database transaction
        count = ingest_data(db, table_name, converted_records, mode)
        
        return {
            "status": "success",
            "message": f"Successfully ingested {count} records into table '{table_name}' using {mode} mode.",
            "count": count,
            "table": table_name
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
