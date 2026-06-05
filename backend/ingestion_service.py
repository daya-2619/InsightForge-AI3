import json
import csv
import io
from sqlalchemy.orm import Session
from database import ExecutionLog, Activity, KPIRecord, init_db

def parse_uploaded_file(file_content: bytes, filename: str):
    """
    Parse uploaded file content (JSON or CSV) and return a list of dictionaries.
    """
    content_str = file_content.decode("utf-8")
    
    if filename.lower().endswith(".json"):
        try:
            data = json.loads(content_str)
            if not isinstance(data, list):
                if isinstance(data, dict):
                    data = [data]
                else:
                    raise ValueError("JSON content must be a list of records.")
            return data
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON file format: {str(e)}")
            
    elif filename.lower().endswith(".csv"):
        try:
            csv_file = io.StringIO(content_str)
            reader = csv.DictReader(csv_file)
            data = []
            for row in reader:
                # Remove empty header columns
                clean_row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                data.append(clean_row)
            return data
        except Exception as e:
            raise ValueError(f"Invalid CSV file format: {str(e)}")
    else:
        raise ValueError("Unsupported file format. Please upload a .json or .csv file.")

def validate_and_convert_records(table_name: str, raw_records: list):
    """
    Validate required fields and convert data types according to database models.
    """
    converted_records = []
    
    if table_name == "execution_logs":
        required_fields = {"timestamp", "model_id", "status", "latency", "cost"}
        for idx, rec in enumerate(raw_records):
            missing = required_fields - rec.keys()
            if missing:
                raise ValueError(f"Record {idx} is missing required fields: {missing}")
                
            try:
                cost = float(rec["cost"])
            except (ValueError, TypeError):
                raise ValueError(f"Record {idx} has invalid 'cost': must be a float number.")
                
            converted_records.append({
                "timestamp": str(rec["timestamp"]),
                "model_id": str(rec["model_id"]),
                "status": str(rec["status"]),
                "latency": str(rec["latency"]),
                "cost": cost
            })
            
    elif table_name == "activities":
        required_fields = {"entity_name", "tier", "status", "value", "confidence"}
        for idx, rec in enumerate(raw_records):
            missing = required_fields - rec.keys()
            if missing:
                raise ValueError(f"Record {idx} is missing required fields: {missing}")
                
            try:
                confidence = int(rec["confidence"])
            except (ValueError, TypeError):
                raise ValueError(f"Record {idx} has invalid 'confidence': must be an integer.")
                
            converted_records.append({
                "entity_name": str(rec["entity_name"]),
                "tier": str(rec["tier"]),
                "status": str(rec["status"]),
                "value": str(rec["value"]),
                "confidence": confidence
            })
            
    elif table_name == "kpi_records":
        required_fields = {
            "region", "days", "total_revenue", "revenue_growth",
            "net_profit", "profit_growth", "active_users", "user_growth",
            "growth_rate", "growth_change", "revenue_chart_data", "region_data"
        }
        for idx, rec in enumerate(raw_records):
            missing = required_fields - rec.keys()
            if missing:
                raise ValueError(f"Record {idx} is missing required fields: {missing}")
                
            try:
                days = int(rec["days"])
            except (ValueError, TypeError):
                raise ValueError(f"Record {idx} has invalid 'days': must be an integer.")
                
            # Handle JSON fields that might be lists/dicts in JSON files or strings
            rev_chart = rec["revenue_chart_data"]
            if isinstance(rev_chart, (dict, list)):
                rev_chart = json.dumps(rev_chart)
            else:
                try:
                    json.loads(rev_chart)
                except Exception:
                    raise ValueError(f"Record {idx} has invalid 'revenue_chart_data': must be valid JSON.")
                    
            reg_data = rec["region_data"]
            if isinstance(reg_data, (dict, list)):
                reg_data = json.dumps(reg_data)
            else:
                try:
                    json.loads(reg_data)
                except Exception:
                    raise ValueError(f"Record {idx} has invalid 'region_data': must be valid JSON.")
                    
            converted_records.append({
                "region": str(rec["region"]),
                "days": days,
                "total_revenue": str(rec["total_revenue"]),
                "revenue_growth": str(rec["revenue_growth"]),
                "net_profit": str(rec["net_profit"]),
                "profit_growth": str(rec["profit_growth"]),
                "active_users": str(rec["active_users"]),
                "user_growth": str(rec["user_growth"]),
                "growth_rate": str(rec["growth_rate"]),
                "growth_change": str(rec["growth_change"]),
                "revenue_chart_data": rev_chart,
                "region_data": reg_data
            })
    else:
        raise ValueError(f"Unknown database table name: {table_name}")
        
    return converted_records

def ingest_data(db: Session, table_name: str, records: list, mode: str = "overwrite"):
    """
    Clear (if overwrite mode) and insert records into database table.
    """
    init_db()
    try:
        if table_name == "execution_logs":
            if mode == "overwrite":
                db.query(ExecutionLog).delete()
            for rec in records:
                db.add(ExecutionLog(**rec))
                
        elif table_name == "activities":
            if mode == "overwrite":
                db.query(Activity).delete()
            for rec in records:
                db.add(Activity(**rec))
                
        elif table_name == "kpi_records":
            if mode == "overwrite":
                db.query(KPIRecord).delete()
            for rec in records:
                db.add(KPIRecord(**rec))
                
        db.commit()
        return len(records)
    except Exception as e:
        db.rollback()
        raise Exception(f"Database write failed during ingestion: {str(e)}")
