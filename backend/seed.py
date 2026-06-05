import os
import json
from sqlalchemy.orm import Session
from database import ExecutionLog, Activity, KPIRecord, SessionLocal, init_db

def seed_database(db: Session):
    # Check if we already have records
    if db.query(KPIRecord).count() > 0:
        print("Database already seeded.")
        return

    print("Seeding database with default rich analytics datasets from local JSON files...")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")

    # 1. Seed Execution Logs
    logs_file = os.path.join(data_dir, "execution_logs.json")
    if os.path.exists(logs_file):
        with open(logs_file, "r") as f:
            logs_data = json.load(f)
            for item in logs_data:
                db.add(ExecutionLog(
                    timestamp=item["timestamp"],
                    model_id=item["model_id"],
                    status=item["status"],
                    latency=item["latency"],
                    cost=item["cost"]
                ))
    else:
        print("Warning: execution_logs.json not found.")

    # 2. Seed Activities
    activities_file = os.path.join(data_dir, "activities.json")
    if os.path.exists(activities_file):
        with open(activities_file, "r") as f:
            activities_data = json.load(f)
            for item in activities_data:
                db.add(Activity(
                    entity_name=item["entity_name"],
                    tier=item["tier"],
                    status=item["status"],
                    value=item["value"],
                    confidence=item["confidence"]
                ))
    else:
        print("Warning: activities.json not found.")

    # 3. Seed KPI Records
    kpis_file = os.path.join(data_dir, "kpi_records.json")
    if os.path.exists(kpis_file):
        with open(kpis_file, "r") as f:
            kpis_data = json.load(f)
            for item in kpis_data:
                db.add(KPIRecord(
                    region=item["region"],
                    days=int(item["days"]),
                    total_revenue=item["total_revenue"],
                    revenue_growth=item["revenue_growth"],
                    net_profit=item["net_profit"],
                    profit_growth=item["profit_growth"],
                    active_users=item["active_users"],
                    user_growth=item["user_growth"],
                    growth_rate=item["growth_rate"],
                    growth_change=item["growth_change"],
                    revenue_chart_data=item["revenue_chart_data"],
                    region_data=item["region_data"]
                ))
    else:
        print("Warning: kpi_records.json not found.")

    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    init_db()
    seed_database(db)
    db.close()
