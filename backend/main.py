import os
import json
import time
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import get_db, init_db, KPIRecord, ExecutionLog, Activity

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
    
    # Context-aware mock AI responses containing rich metadata (SQL pane and SVG custom charts)
    if "revenue" in msg or "sales" in msg or "money" in msg or "earnings" in msg:
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
        
    elif "churn" in msg or "customers" in msg or "retention" in msg or "users" in msg:
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
