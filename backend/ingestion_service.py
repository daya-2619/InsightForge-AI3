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

from sqlalchemy import MetaData, Table

def validate_and_convert_records(db: Session, table_name: str, raw_records: list):
    """
    Validate fields and convert data types according to dynamic database schemas.
    """
    metadata = MetaData()
    metadata.reflect(bind=db.get_bind())
    
    if table_name not in metadata.tables:
        raise ValueError(f"Unknown database table name: {table_name}")
        
    table = metadata.tables[table_name]
    columns = table.columns
    col_names = {c.name for c in columns}
    
    # Do not enforce all columns if auto-increment primary keys are missing
    converted_records = []
    
    for idx, rec in enumerate(raw_records):
        clean_rec = {}
        for k, v in rec.items():
            if k in col_names:
                # Basic conversion for known types if needed, else strings
                clean_rec[k] = v
                
        # Ensure we have at least some valid data
        if not clean_rec:
            raise ValueError(f"Record {idx} has no columns matching the table schema.")
            
        converted_records.append(clean_rec)
        
    return converted_records

def ingest_data(db: Session, table_name: str, records: list, mode: str = "overwrite"):
    """
    Clear (if overwrite mode) and insert records into database table dynamically.
    """
    metadata = MetaData()
    metadata.reflect(bind=db.get_bind())
    
    if table_name not in metadata.tables:
        raise Exception(f"Table {table_name} does not exist.")
        
    table = metadata.tables[table_name]
    
    try:
        if mode == "overwrite":
            db.execute(table.delete())
            
        if records:
            db.execute(table.insert(), records)
            
        db.commit()
        return len(records)
    except Exception as e:
        db.rollback()
        raise Exception(f"Database write failed during ingestion: {str(e)}")
