import sys
import os
import json

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_db, ExecutionLog, Activity, KPIRecord
from ingestion_service import parse_uploaded_file, validate_and_convert_records, ingest_data

def test_ingestion():
    print("Initializing test database...")
    init_db()
    
    db = SessionLocal()
    
    # 1. Test JSON Parsing & Ingestion
    json_data = b"""
    [
        {"timestamp": "12:00:00", "model_id": "JSON-MOCK", "status": "Success", "latency": "50ms", "cost": 0.0012}
    ]
    """
    print("Testing JSON Ingestion Parsing...")
    parsed_json = parse_uploaded_file(json_data, "test.json")
    assert len(parsed_json) == 1, "Should parse 1 record"
    assert parsed_json[0]["model_id"] == "JSON-MOCK"
    
    print("Testing JSON Ingestion Validation...")
    validated_json = validate_and_convert_records("execution_logs", parsed_json)
    assert validated_json[0]["cost"] == 0.0012
    
    print("Testing Database Commit...")
    count = ingest_data(db, "execution_logs", validated_json, mode="overwrite")
    assert count == 1
    
    log = db.query(ExecutionLog).first()
    assert log.model_id == "JSON-MOCK"
    print("SUCCESS: JSON Ingestion and SQLite mapping verified.")

    # 2. Test CSV Parsing & Ingestion
    csv_data = b"entity_name,tier,status,value,confidence\nCSV Corp,Enterprise,Verified,$500.00,99\n"
    print("Testing CSV Ingestion Parsing...")
    parsed_csv = parse_uploaded_file(csv_data, "test.csv")
    assert len(parsed_csv) == 1
    assert parsed_csv[0]["entity_name"] == "CSV Corp"
    
    print("Testing CSV Ingestion Validation...")
    validated_csv = validate_and_convert_records("activities", parsed_csv)
    assert validated_csv[0]["confidence"] == 99
    
    print("Testing Database Commit (CSV)...")
    count_csv = ingest_data(db, "activities", validated_csv, mode="overwrite")
    assert count_csv == 1
    
    activity = db.query(Activity).first()
    assert activity.entity_name == "CSV Corp"
    assert activity.confidence == 99
    print("SUCCESS: CSV Ingestion and SQLite mapping verified.")
    
    db.close()

if __name__ == "__main__":
    test_ingestion()
