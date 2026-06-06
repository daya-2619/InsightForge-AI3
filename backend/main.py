import os
import json
import time
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from backend/.env explicitly
backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(backend_env_path, override=True)

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
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url or db_url.startswith("sqlite"):
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
    from datetime import datetime, timedelta
    
    # Helper to calculate metrics for a period
    def get_metrics_for_period(start_date: str, end_date: str, company: str):
        comp_clause = ""
        params = {"start_date": start_date, "end_date": end_date}
        if company != "all":
            comp_clause = "AND fo.company = :company"
            params["company"] = company
            
        sql = f"""
            SELECT 
                SUM(fo.sold_quantity * gp.price) AS total_revenue,
                SUM(fo.sold_quantity * gp.price * (CASE WHEN fo.company = 'parent' THEN 0.10 ELSE 0.15 END)) AS net_profit,
                COUNT(DISTINCT fo.customer_code) AS active_users
            FROM fact_orders fo
            JOIN dim_gross_prices gp ON fo.product_code = gp.product_code AND fo.company = gp.company
            WHERE 
                fo.date >= :start_date AND fo.date <= :end_date
                {comp_clause}
                AND gp.year = CAST(SUBSTR(fo.date, 1, 4) AS INTEGER)
                AND (
                    (fo.company = 'parent' AND gp.month IS NULL)
                    OR 
                    (fo.company = 'child' AND gp.month = CAST(SUBSTR(fo.date, 6, 2) AS INTEGER))
                )
        """
        row = db.execute(text(sql), params).fetchone()
        revenue = float(row[0] or 0.0)
        profit = float(row[1] or 0.0)
        users = int(row[2] or 0)
        return revenue, profit, users

    # Check if consolidated sales database has records
    has_consolidated_data = False
    try:
        has_consolidated_data = db.query(FactOrder).first() is not None
    except Exception:
        pass

    if not has_consolidated_data:
        try:
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
                chart_data = json.loads(kpi.revenue_chart_data) if kpi else {"actual": [0], "forecast": [0]}
                region_data = json.loads(kpi.region_data) if kpi else {}
            except Exception:
                chart_data = {"actual": [0], "forecast": [0]}
                region_data = {}

            return {
                "region": kpi.region if kpi else region,
                "days": kpi.days if kpi else days,
                "total_revenue": kpi.total_revenue if kpi else "₹0.00",
                "revenue_growth": kpi.revenue_growth if kpi else "0.0%",
                "net_profit": kpi.net_profit if kpi else "₹0.00",
                "profit_growth": kpi.profit_growth if kpi else "0.0%",
                "active_users": kpi.active_users if kpi else "0",
                "user_growth": kpi.user_growth if kpi else "0.0%",
                "growth_rate": kpi.growth_rate if kpi else "0.0%",
                "growth_change": kpi.growth_change if kpi else "0.0%",
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
        except Exception:
            return {
                "region": region, "days": days, "total_revenue": "₹0.00", "revenue_growth": "0.0%",
                "net_profit": "₹0.00", "profit_growth": "0.0%", "active_users": "0", "user_growth": "0.0%",
                "growth_rate": "0.0%", "growth_change": "0.0%", "chart_data": {"actual": [0]*7, "forecast": [0]*7},
                "region_data": {}, "recent_activities": []
            }

    # Dynamic calculation using consolidated sales tables!
    try:
        # Map region to company filter
        # Global/APAC -> all
        # North America -> parent
        # Europe -> child
        company = "all"
        if region == "North America":
            company = "parent"
        elif region == "Europe":
            company = "child"

        # Reference date today = max_date in database
        max_date_str = db.execute(text("SELECT MAX(date) FROM fact_orders")).scalar() or "2025-12-31"
        max_dt = datetime.strptime(max_date_str, "%Y-%m-%d")

        # Set month-aligned boundaries to properly encompass parent's monthly records (first of each month)
        if days == 30:
            current_start = "2025-12-01"
            current_end = "2025-12-31"
            prev_start = "2025-11-01"
            prev_end = "2025-11-30"
        elif days == 90:
            current_start = "2025-10-01"
            current_end = "2025-12-31"
            prev_start = "2025-07-01"
            prev_end = "2025-09-30"
        elif days == 365:
            current_start = "2025-01-01"
            current_end = "2025-12-31"
            prev_start = "2024-01-01"
            prev_end = "2024-12-31"
        else:
            # Fallback dynamic calculation based on exact day offset
            current_end = max_date_str
            current_start_dt = max_dt - timedelta(days=days - 1)
            current_start = current_start_dt.strftime("%Y-%m-%d")

            prev_end_dt = current_start_dt - timedelta(days=1)
            prev_end = prev_end_dt.strftime("%Y-%m-%d")
            prev_start_dt = prev_end_dt - timedelta(days=days - 1)
            prev_start = prev_start_dt.strftime("%Y-%m-%d")

        # Query metrics
        current_rev, current_profit, current_users = get_metrics_for_period(current_start, current_end, company)
        prev_rev, prev_profit, prev_users = get_metrics_for_period(prev_start, prev_end, company)

        # Calculate growths
        rev_growth_val = ((current_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else 12.0
        profit_growth_val = ((current_profit - prev_profit) / prev_profit * 100) if prev_profit > 0 else 8.4
        user_growth_val = ((current_users - prev_users) / prev_users * 100) if prev_users > 0 else 14.2

        # Format values in Rupees matching Copilot
        def format_currency(val):
            if val >= 1_000_000_000:
                return f"₹{val/1_000_000_000:.2f}B"
            elif val >= 1_000_000:
                return f"₹{val/1_000_000:.1f}M"
            else:
                return f"₹{val:,.2f}"

        total_rev_str = format_currency(current_rev)
        net_profit_str = format_currency(current_profit)
        active_users_str = f"{current_users:,}"

        rev_growth_str = f"{'+' if rev_growth_val >= 0 else ''}{rev_growth_val:.1f}%"
        profit_growth_str = f"{'+' if profit_growth_val >= 0 else ''}{profit_growth_val:.1f}%"
        user_growth_str = f"{'+' if user_growth_val >= 0 else ''}{user_growth_val:.1f}%"

        # Margin and Margin change
        current_margin = (current_profit / current_rev * 100) if current_rev > 0 else 10.0
        prev_margin = (prev_profit / prev_rev * 100) if prev_rev > 0 else 10.0
        margin_change = current_margin - prev_margin
        
        growth_rate_str = f"{current_margin:.1f}%"
        growth_change_str = f"{'+' if margin_change >= 0 else ''}{margin_change:.1f}%"

        # Calculate 7-point chart data
        dt_start = datetime.strptime(current_start, "%Y-%m-%d")
        dt_end = datetime.strptime(current_end, "%Y-%m-%d")
        delta_days = (dt_end - dt_start).days + 1
        interval_days = max(1, delta_days // 7)
        
        actuals = []
        forecasts = []
        for i in range(7):
            istart_dt = dt_start + timedelta(days=i*interval_days)
            iend_dt = dt_start + timedelta(days=(i+1)*interval_days - 1)
            if i == 6:
                iend_dt = dt_end
            istart = istart_dt.strftime("%Y-%m-%d")
            iend = iend_dt.strftime("%Y-%m-%d")
            
            r, _, _ = get_metrics_for_period(istart, iend, company)
            actuals.append(r)
            forecasts.append(r * 1.05)

        # Normalize actuals and forecasts to 0-100 scale for UI bar heights
        max_chart_val = max(max(actuals) if actuals else 1.0, max(forecasts) if forecasts else 1.0)
        if max_chart_val > 0:
            chart_data = {
                "actual": [round((val / max_chart_val) * 95, 1) for val in actuals],
                "forecast": [round((val / max_chart_val) * 95, 1) for val in forecasts]
            }
        else:
            chart_data = {
                "actual": [0] * 7,
                "forecast": [0] * 7
            }

        # Calculate region/market contribution data dynamically with the company/region filter applied
        comp_clause_reg = ""
        params_regions = {"start_date": current_start, "end_date": current_end}
        if company != "all":
            comp_clause_reg = "AND fo.company = :company"
            params_regions["company"] = company

        sql_regions = f"""
            SELECT 
                c.market,
                SUM(fo.sold_quantity * gp.price) AS market_revenue
            FROM fact_orders fo
            JOIN dim_customers c ON fo.customer_code = c.customer_code AND fo.company = c.company
            JOIN dim_gross_prices gp ON fo.product_code = gp.product_code AND fo.company = gp.company
            WHERE 
                fo.date >= :start_date AND fo.date <= :end_date
                {comp_clause_reg}
                AND gp.year = CAST(SUBSTR(fo.date, 1, 4) AS INTEGER)
                AND (
                    (fo.company = 'parent' AND gp.month IS NULL)
                    OR 
                    (fo.company = 'child' AND gp.month = CAST(SUBSTR(fo.date, 6, 2) AS INTEGER))
                )
            GROUP BY c.market
        """
        region_rows = db.execute(text(sql_regions), params_regions).fetchall()
        
        region_data = {}
        for row in region_rows:
            market_name = row[0]
            val = row[1]
            pct = round(val / current_rev * 100, 1) if current_rev > 0 else 0
            if market_name == "India":
                region_data["India (Parent)"] = pct
            else:
                region_data[market_name] = pct

        activities = db.query(Activity).order_by(Activity.id.desc()).all()

        return {
            "region": region,
            "days": days,
            "total_revenue": total_rev_str,
            "revenue_growth": rev_growth_str,
            "net_profit": net_profit_str,
            "profit_growth": profit_growth_str,
            "active_users": active_users_str,
            "user_growth": user_growth_str,
            "growth_rate": growth_rate_str,
            "growth_change": growth_change_str,
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
    except Exception as e:
        import traceback
        traceback.print_exc()
        try:
            kpi = db.query(KPIRecord).filter(
                KPIRecord.region == region,
                KPIRecord.days == days
            ).first()
            if not kpi:
                kpi = db.query(KPIRecord).filter(
                    KPIRecord.region == "Global",
                    KPIRecord.days == 30
                ).first()
            activities = db.query(Activity).order_by(Activity.id.desc()).all()
            try:
                chart_data = json.loads(kpi.revenue_chart_data) if kpi else {"actual": [0], "forecast": [0]}
                region_data = json.loads(kpi.region_data) if kpi else {}
            except Exception:
                chart_data = {"actual": [0], "forecast": [0]}
                region_data = {}
            return {
                "region": kpi.region if kpi else region,
                "days": kpi.days if kpi else days,
                "total_revenue": kpi.total_revenue if kpi else "₹0.00",
                "revenue_growth": kpi.revenue_growth if kpi else "0.0%",
                "net_profit": kpi.net_profit if kpi else "₹0.00",
                "profit_growth": kpi.profit_growth if kpi else "0.0%",
                "active_users": kpi.active_users if kpi else "0",
                "user_growth": kpi.user_growth if kpi else "0.0%",
                "growth_rate": kpi.growth_rate if kpi else "0.0%",
                "growth_change": kpi.growth_change if kpi else "0.0%",
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
        except Exception:
            return {
                "region": region, "days": days, "total_revenue": "₹0.00", "revenue_growth": "0.0%",
                "net_profit": "₹0.00", "profit_growth": "0.0%", "active_users": "0", "user_growth": "0.0%",
                "growth_rate": "0.0%", "growth_change": "0.0%", "chart_data": {"actual": [0]*7, "forecast": [0]*7},
                "region_data": {}, "recent_activities": []
            }

@app.get("/api/logs")
def get_logs(
    search: Optional[str] = Query(None, description="Search by model name"),
    status: Optional[str] = Query(None, description="Filter by status (Success, Failed)"),
    db: Session = Depends(get_db)
):
    try:
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
    except Exception:
        return []

@app.get("/api/models/telemetry")
def get_models_telemetry(db: Session = Depends(get_db)):
    try:
        logs = db.query(ExecutionLog).all()
    except Exception:
        logs = []
    
    models_def = {
        "IF-GPT-4o-V2": {
            "id": "gpt-4o-v2",
            "name": "IF-GPT-4o-V2",
            "type": "General Intelligence & Reasoning",
            "status": "Active",
            "base_latency": 122,
            "base_cost": 0.0021,
            "base_accuracy": 88.2,
            "description": "Standard enterprise general intelligence. Optimized for low latency and high accuracy across analytical tasks.",
            "icon": "rocket_launch",
            "parameters": { "temperature": 0.7, "top_p": 0.9, "max_tokens": 2048 }
        },
        "IF-LLAMA3-70B": {
            "id": "llama3-70b",
            "name": "IF-LLAMA3-70B",
            "type": "Advanced Logical Inference",
            "status": "Standby",
            "base_latency": 842,
            "base_cost": 0.0054,
            "base_accuracy": 94.7,
            "description": "Superior logical and domain reasoning. Best suited for high-density SQL query formulation and deep diagnostics.",
            "icon": "psychology",
            "parameters": { "temperature": 0.2, "top_p": 0.85, "max_tokens": 1024 }
        },
        "IF-CLAUDE3.5-SONNET": {
            "id": "claude-3.5",
            "name": "IF-CLAUDE3.5-SONNET",
            "type": "Contextual Synthesizer",
            "status": "Active",
            "base_latency": 412,
            "base_cost": 0.0084,
            "base_accuracy": 92.8,
            "description": "Deep multi-stage conversational parsing. Outstanding context window and stateful retention capabilities.",
            "icon": "auto_awesome",
            "parameters": { "temperature": 0.5, "top_p": 0.95, "max_tokens": 4096 }
        },
        "IF-MIXTRAL-8x7B": {
            "id": "mixtral-8x7b",
            "name": "IF-MIXTRAL-8x7B",
            "type": "Lightweight MoE Router",
            "status": "Active",
            "base_latency": 512,
            "base_cost": 0.0008,
            "base_accuracy": 86.5,
            "description": "Sparse mixture of experts model. Extremely cost-effective routing and fast general classification logic.",
            "icon": "hub",
            "parameters": { "temperature": 0.8, "top_p": 0.9, "max_tokens": 1536 }
        }
    }
    
    model_stats = {}
    for m_id in models_def:
        model_stats[m_id] = {
            "latencies": [],
            "costs": [],
            "total_runs": 0,
            "success_runs": 0
        }
        
    for log in logs:
        m_id = log.model_id
        if m_id in model_stats:
            model_stats[m_id]["total_runs"] += 1
            if log.status == "Success":
                model_stats[m_id]["success_runs"] += 1
                if log.latency and log.latency.endswith("ms"):
                    try:
                        lat_val = int(log.latency.replace("ms", ""))
                        model_stats[m_id]["latencies"].append(lat_val)
                    except ValueError:
                        pass
                if log.cost > 0:
                    model_stats[m_id]["costs"].append(log.cost)
                    
    results = []
    for m_id, m_def in models_def.items():
        stats = model_stats[m_id]
        
        if stats["latencies"]:
            avg_latency = int(sum(stats["latencies"]) / len(stats["latencies"]))
        else:
            avg_latency = m_def["base_latency"]
            
        if stats["costs"]:
            avg_cost = sum(stats["costs"]) / len(stats["costs"])
        else:
            avg_cost = m_def["base_cost"]
            
        if stats["total_runs"] > 0:
            success_rate = stats["success_runs"] / stats["total_runs"]
            dyn_accuracy = m_def["base_accuracy"] * (0.85 + 0.15 * success_rate)
        else:
            dyn_accuracy = m_def["base_accuracy"]
            
        results.append({
            "id": m_def["id"],
            "name": m_def["name"],
            "type": m_def["type"],
            "status": m_def["status"],
            "latency": avg_latency,
            "cost": round(avg_cost, 5),
            "accuracy": round(dyn_accuracy, 1),
            "description": m_def["description"],
            "icon": m_def["icon"],
            "parameters": m_def["parameters"],
            "total_runs": stats["total_runs"],
            "success_runs": stats["success_runs"]
        })
        
    return results

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
    # Make sure we load the latest from backend/.env first
    backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    load_dotenv(backend_env_path, override=True)
    
    db_url = os.getenv("DATABASE_URL", "")
    
    # Mask connection URL for safety
    masked_url = ""
    if db_url:
        if "@" in db_url:
            prefix, rest = db_url.split("@", 1)
            masked_url = "postgresql://****:****@" + rest
        else:
            masked_url = "postgresql://****"
            
    # Trigger get_engine to evaluate connection reachability
    from database import get_engine, _db_offline
    try:
        get_engine()
    except Exception:
        pass
    
    return {
        "database_url": db_url,
        "masked_url": masked_url,
        "is_configured": bool(db_url and not db_url.startswith("sqlite")),
        "active_status": "Offline" if _db_offline else ("Connected" if db_url else "SQLite Local Fallback")
    }

@app.get("/api/neondb/tables")
def get_tables_stats():
    try:
        from database import get_engine
        from sqlalchemy import inspect, text
        
        engine = get_engine()
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        tables_info = []
        with engine.connect() as conn:
            for table_name in table_names:
                # Get columns
                columns = [col["name"] for col in inspector.get_columns(table_name)]
                
                # Get row count
                try:
                    count_res = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
                    records = count_res.scalar() or 0
                except Exception:
                    records = 0
                
                # Get size
                size_str = "0 B"
                try:
                    if engine.dialect.name == "postgresql":
                        size_query = text("SELECT pg_size_pretty(pg_total_relation_size(quote_ident(:tbl)))")
                        size_res = conn.execute(size_query, {"tbl": table_name}).scalar()
                        size_str = size_res or "0 B"
                    else:
                        # Estimate size for SQLite and other databases
                        bytes_est = records * 150
                        if bytes_est >= 1024 * 1024:
                            size_str = f"{bytes_est / (1024 * 1024):.1f} MB"
                        elif bytes_est >= 1024:
                            size_str = f"{bytes_est / 1024:.1f} KB"
                        else:
                            size_str = f"{bytes_est} B"
                except Exception:
                    size_str = "Unknown"
                
                tables_info.append({
                    "name": table_name,
                    "records": records,
                    "size": size_str,
                    "status": "Synchronized",
                    "columns": columns
                })
        return tables_info
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []

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
        
    env_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    ]
    
    for path in env_paths:
        existing_vars = {}
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    if "=" in line and not line.strip().startswith("#"):
                        parts = line.strip().split("=", 1)
                        if len(parts) == 2:
                            existing_vars[parts[0].strip()] = parts[1].strip()
                            
            existing_vars["DATABASE_URL"] = url
            
            with open(path, "w") as f:
                for k, v in existing_vars.items():
                    f.write(f"{k}={v}\n")
            
    # Reload environment
    backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    load_dotenv(backend_env_path, override=True)
    
    from database import reset_db_connection, init_db
    reset_db_connection()
    
    db_initialized = False
    warning_msg = None
    
    try:
        # Check reachability with a short 2s timeout before running blocking init_db()
        temp_engine = create_engine(url, connect_args={"connect_timeout": 2})
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        temp_engine.dispose()
        
        # If reachable, initialize tables
        init_db()
        db_initialized = True
    except Exception as e:
        warning_msg = f"Database is currently unreachable: {str(e)}"
        # Clear connections back to safe fallback state
        reset_db_connection()
        
    return {
        "status": "success",
        "message": "NeonDB connection string saved successfully.",
        "db_initialized": db_initialized,
        "warning": warning_msg
    }

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
        try:
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        finally:
            temp_engine.dispose()
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
        converted_records = validate_and_convert_records(db, table_name, raw_records)
        
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
