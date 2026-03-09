import time
import logging
from datetime import datetime
from supabase import create_client, Client
from typing import Optional
import asyncio
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from tasks.whatsapp_handler import ProcessWhatsAppMessageTask

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaskQueueWorker:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        self.running = False
        self.poll_interval = 5  # seconds

    def process_task(self, task: dict):
        """
        Routes the task to specific handlers based on task['task_type'].
        """
        task_type = task.get("task_type")
        payload = task.get("payload", {})
        logger.info(f"Processing task {task['id']} of type {task_type}")
        
        # Dispatch to specific task handlers here
        if task_type == "example_task":
            # from tasks.example_task import handle_example_task
            # handle_example_task(payload)
            time.sleep(1) # simulate work
        elif task_type == "process_whatsapp_message":
            handler = ProcessWhatsAppMessageTask()
            # Because the execute method is async (using httpx), we need to run it in the event loop
            # Or use asyncio.run if this worker loop remains sync. Since worker loop is sync:
            asyncio.run(handler.execute(payload))
        else:
            logger.warning(f"Unknown task type: {task_type}")

    def fetch_and_lock_task(self) -> Optional[dict]:
        """
        Fetches a pending task and marks it as processing using an atomic Postgres RPC.
        """
        try:
            response = self.supabase.rpc('claim_next_task').execute()
            tasks = response.data
            if tasks and len(tasks) > 0:
                return tasks[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching task: {e}")
            return None

    def start(self):
        self.running = True
        logger.info("Starting Task Queue Worker...")
        
        while self.running:
            try:
                task = self.fetch_and_lock_task()
                
                if not task:
                    time.sleep(self.poll_interval)
                    continue

                try:
                    self.process_task(task)
                    
                    # Mark as completed
                    self.supabase.table("background_tasks")\
                        .update({
                            "status": "completed", 
                            "updated_at": datetime.utcnow().isoformat()
                        })\
                        .eq("id", task["id"])\
                        .execute()
                        
                    logger.info(f"Task {task['id']} completed successfully.")
                    
                except Exception as e:
                    logger.error(f"Task {task['id']} failed: {e}")
                    # Mark as failed
                    attempts = task.get("attempts", 0) + 1
                    self.supabase.table("background_tasks")\
                        .update({
                            "status": "failed", 
                            "error_details": str(e),
                            "attempts": attempts,
                            "updated_at": datetime.utcnow().isoformat()
                        })\
                        .eq("id", task["id"])\
                        .execute()

            except Exception as e:
                logger.error(f"Worker iteration error: {e}")
                time.sleep(self.poll_interval)

    def stop(self):
        self.running = False
        logger.info("Stopping Worker...")

if __name__ == "__main__":
    worker = TaskQueueWorker()
    try:
        worker.start()
    except KeyboardInterrupt:
        worker.stop()
