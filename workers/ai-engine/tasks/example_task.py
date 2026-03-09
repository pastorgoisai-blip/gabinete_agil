import logging

logger = logging.getLogger(__name__)

def handle_example_task(payload: dict) -> dict:
    """
    Template for a background task handler.
    
    Args:
        payload (dict): The task payload containing necessary execution data.
        
    Returns:
        dict: Result of the execution.
    """
    logger.info(f"Executing example task with payload: {payload}")
    # Implement business logic here
    return {"status": "success", "message": "Example task completed"}
