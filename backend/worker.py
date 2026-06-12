import os
from celery import Celery
from database import get_db
from etl_pipeline import run_etl_pipeline
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"), override=True)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "insightforge_worker",
    broker=redis_url,
    backend=redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(bind=True, name="run_etl_background")
def run_etl_background_task(self):
    try:
        # We need a new DB session for the background worker
        db = next(get_db())
        
        # Find base data directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(base_dir, "data")
        
        result = run_etl_pipeline(db, data_dir)
        db.close()
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e
