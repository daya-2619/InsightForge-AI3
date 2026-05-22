import json
from sqlalchemy.orm import Session
from database import ExecutionLog, Activity, KPIRecord, SessionLocal, init_db

def seed_database(db: Session):
    # Check if we already have records
    if db.query(KPIRecord).count() > 0:
        print("Database already seeded.")
        return

    print("Seeding database with default rich analytics datasets...")

    # 1. Seed Execution Logs
    logs = [
        ExecutionLog(timestamp="12:04:12.441", model_id="IF-GPT-4o-V2", status="Success", latency="122ms", cost=0.0021),
        ExecutionLog(timestamp="12:04:10.923", model_id="IF-LLAMA3-70B", status="Success", latency="842ms", cost=0.0054),
        ExecutionLog(timestamp="12:04:08.115", model_id="IF-GPT-4o-V2", status="Failed", latency="--", cost=0.0000),
        ExecutionLog(timestamp="12:03:54.102", model_id="IF-CLAUDE3.5-SONNET", status="Success", latency="412ms", cost=0.0084),
        ExecutionLog(timestamp="12:03:12.894", model_id="IF-GPT-4o-V2", status="Success", latency="145ms", cost=0.0023),
        ExecutionLog(timestamp="12:02:44.201", model_id="IF-MIXTRAL-8x7B", status="Success", latency="512ms", cost=0.0008),
        ExecutionLog(timestamp="12:01:10.556", model_id="IF-LLAMA3-70B", status="Success", latency="789ms", cost=0.0052),
        ExecutionLog(timestamp="12:00:04.112", model_id="IF-CLAUDE3.5-SONNET", status="Success", latency="388ms", cost=0.0081),
        ExecutionLog(timestamp="11:58:32.409", model_id="IF-GPT-4o-V2", status="Success", latency="130ms", cost=0.0021),
        ExecutionLog(timestamp="11:57:12.991", model_id="IF-LLAMA3-70B", status="Failed", latency="--", cost=0.0000),
    ]
    db.add_all(logs)

    # 2. Seed Activities
    activities = [
        Activity(entity_name="TechVanguard Corp", tier="Enterprise Tier", status="Verified", value="$82,400.00", confidence=98),
        Activity(entity_name="BioLink Systems", tier="Standard Tier", status="Processing", value="$12,150.00", confidence=84),
        Activity(entity_name="OmniRetail Inc", tier="Enterprise Tier", status="Verified", value="$142,000.00", confidence=95),
        Activity(entity_name="AeroDynamics Group", tier="Startup Tier", status="Verified", value="$4,900.00", confidence=99),
        Activity(entity_name="AlphaFinance Ltd", tier="Enterprise Tier", status="Processing", value="$64,200.00", confidence=91),
        Activity(entity_name="CloudScale Systems", tier="Standard Tier", status="Failed", value="$0.00", confidence=10),
    ]
    db.add_all(activities)

    # 3. Seed KPI Records for combination of regions & time periods
    # Configs: Regions: Global, North America, Europe, APAC
    # Days: 30, 90, 365
    kpi_data = [
        # GLOBAL
        {
            "region": "Global",
            "days": 30,
            "total_revenue": "$2.4M", "revenue_growth": "+12%",
            "net_profit": "$842k", "profit_growth": "+8.4%",
            "active_users": "18,294", "user_growth": "+21%",
            "growth_rate": "4.2%", "growth_change": "-0.5%",
            "revenue_chart_data": json.dumps({"actual": [40, 65, 50, 85, 70, 95, 80], "forecast": [20, 45, 30, 55, 40, 65, 50]}),
            "region_data": json.dumps({"N. America": 85, "Europe": 62, "APAC": 44, "LATAM": 28})
        },
        {
            "region": "Global",
            "days": 90,
            "total_revenue": "$7.1M", "revenue_growth": "+14%",
            "net_profit": "$2.5M", "profit_growth": "+9.1%",
            "active_users": "22,410", "user_growth": "+24%",
            "growth_rate": "4.5%", "growth_change": "+0.2%",
            "revenue_chart_data": json.dumps({"actual": [45, 50, 65, 70, 80, 90, 95], "forecast": [30, 35, 45, 50, 60, 70, 75]}),
            "region_data": json.dumps({"N. America": 83, "Europe": 65, "APAC": 48, "LATAM": 30})
        },
        {
            "region": "Global",
            "days": 365,
            "total_revenue": "$28.4M", "revenue_growth": "+18%",
            "net_profit": "$9.8M", "profit_growth": "+11.2%",
            "active_users": "34,910", "user_growth": "+32%",
            "growth_rate": "5.1%", "growth_change": "+0.8%",
            "revenue_chart_data": json.dumps({"actual": [35, 55, 45, 70, 65, 85, 98], "forecast": [25, 40, 35, 50, 45, 65, 75]}),
            "region_data": json.dumps({"N. America": 80, "Europe": 68, "APAC": 52, "LATAM": 32})
        },
        
        # NORTH AMERICA
        {
            "region": "North America",
            "days": 30,
            "total_revenue": "$1.2M", "revenue_growth": "+14%",
            "net_profit": "$430k", "profit_growth": "+9.2%",
            "active_users": "9,410", "user_growth": "+23%",
            "growth_rate": "4.4%", "growth_change": "+0.1%",
            "revenue_chart_data": json.dumps({"actual": [50, 70, 60, 90, 75, 98, 85], "forecast": [30, 50, 40, 65, 50, 70, 60]}),
            "region_data": json.dumps({"N. America": 100, "Europe": 0, "APAC": 0, "LATAM": 0})
        },
        {
            "region": "North America",
            "days": 90,
            "total_revenue": "$3.6M", "revenue_growth": "+15%",
            "net_profit": "$1.3M", "profit_growth": "+10.1%",
            "active_users": "11,200", "user_growth": "+26%",
            "growth_rate": "4.7%", "growth_change": "+0.4%",
            "revenue_chart_data": json.dumps({"actual": [55, 60, 75, 80, 85, 95, 99], "forecast": [35, 40, 50, 55, 60, 75, 80]}),
            "region_data": json.dumps({"N. America": 100, "Europe": 0, "APAC": 0, "LATAM": 0})
        },
        {
            "region": "North America",
            "days": 365,
            "total_revenue": "$14.2M", "revenue_growth": "+19%",
            "net_profit": "$5.1M", "profit_growth": "+12.3%",
            "active_users": "17,350", "user_growth": "+35%",
            "growth_rate": "5.3%", "growth_change": "+1.0%",
            "revenue_chart_data": json.dumps({"actual": [40, 60, 50, 80, 70, 90, 100], "forecast": [30, 45, 40, 55, 50, 70, 80]}),
            "region_data": json.dumps({"N. America": 100, "Europe": 0, "APAC": 0, "LATAM": 0})
        },

        # EUROPE
        {
            "region": "Europe",
            "days": 30,
            "total_revenue": "$0.7M", "revenue_growth": "+10%",
            "net_profit": "$250k", "profit_growth": "+7.1%",
            "active_users": "5,220", "user_growth": "+17%",
            "growth_rate": "3.9%", "growth_change": "-0.8%",
            "revenue_chart_data": json.dumps({"actual": [30, 55, 40, 75, 60, 85, 75], "forecast": [20, 35, 25, 45, 35, 55, 45]}),
            "region_data": json.dumps({"N. America": 0, "Europe": 100, "APAC": 0, "LATAM": 0})
        },
        {
            "region": "Europe",
            "days": 90,
            "total_revenue": "$2.1M", "revenue_growth": "+11%",
            "net_profit": "$750k", "profit_growth": "+8.0%",
            "active_users": "6,410", "user_growth": "+19%",
            "growth_rate": "4.1%", "growth_change": "-0.4%",
            "revenue_chart_data": json.dumps({"actual": [35, 40, 55, 60, 70, 80, 85], "forecast": [25, 30, 40, 45, 50, 60, 65]}),
            "region_data": json.dumps({"N. America": 0, "Europe": 100, "APAC": 0, "LATAM": 0})
        },
        {
            "region": "Europe",
            "days": 365,
            "total_revenue": "$8.4M", "revenue_growth": "+15%",
            "net_profit": "$2.9M", "profit_growth": "+9.9%",
            "active_users": "10,210", "user_growth": "+27%",
            "growth_rate": "4.8%", "growth_change": "+0.3%",
            "revenue_chart_data": json.dumps({"actual": [30, 45, 40, 65, 55, 75, 90], "forecast": [20, 30, 30, 45, 40, 55, 65]}),
            "region_data": json.dumps({"N. America": 0, "Europe": 100, "APAC": 0, "LATAM": 0})
        },

        # APAC
        {
            "region": "APAC",
            "days": 30,
            "total_revenue": "$0.5M", "revenue_growth": "+15%",
            "net_profit": "$162k", "profit_growth": "+11.2%",
            "active_users": "3,664", "user_growth": "+26%",
            "growth_rate": "4.6%", "growth_change": "+0.4%",
            "revenue_chart_data": json.dumps({"actual": [40, 70, 55, 90, 80, 100, 95], "forecast": [10, 30, 20, 45, 35, 60, 50]}),
            "region_data": json.dumps({"N. America": 0, "Europe": 0, "APAC": 100, "LATAM": 0})
        },
        {
            "region": "APAC",
            "days": 90,
            "total_revenue": "$1.4M", "revenue_growth": "+18%",
            "net_profit": "$450k", "profit_growth": "+12.1%",
            "active_users": "4,800", "user_growth": "+30%",
            "growth_rate": "4.9%", "growth_change": "+0.7%",
            "revenue_chart_data": json.dumps({"actual": [45, 50, 70, 75, 90, 98, 100], "forecast": [20, 25, 45, 50, 65, 75, 80]}),
            "region_data": json.dumps({"N. America": 0, "Europe": 0, "APAC": 100, "LATAM": 0})
        },
        {
            "region": "APAC",
            "days": 365,
            "total_revenue": "$5.8M", "revenue_growth": "+22%",
            "net_profit": "$1.8M", "profit_growth": "+14.3%",
            "active_users": "7,350", "user_growth": "+40%",
            "growth_rate": "5.5%", "growth_change": "+1.3%",
            "revenue_chart_data": json.dumps({"actual": [30, 50, 45, 75, 70, 95, 100], "forecast": [15, 30, 25, 50, 45, 65, 70]}),
            "region_data": json.dumps({"N. America": 0, "Europe": 0, "APAC": 100, "LATAM": 0})
        }
    ]

    for record in kpi_data:
        db.add(KPIRecord(**record))

    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    init_db()
    seed_database(db)
    db.close()
