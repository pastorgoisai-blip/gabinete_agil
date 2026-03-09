import os
import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Reusing the existing Supabase configuration method where possible,
# or define constants for the Edge Function URL if needed.
# Since we need to call the Edge Function, we need its base URL.
SUPABASE_URL = os.getenv("SUPABASE_URL", "")

class ProcessWhatsAppMessageTask:
    """
    Task to process incoming WhatsApp messages, replacing the N8N workflow.
    It takes the message payload and forwards it to the Supabase Edge Function (agent-gateway).
    """
    
    def __init__(self):
        # The Edge Function URL is typically derived from the Supabase URL
        self.gateway_url = f"{SUPABASE_URL}/functions/v1/agent-gateway"

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the WhatsApp message processing task.
        
        Expected payload format:
        {
            "cabinet_id": "uuid",
            "phone_number": "string",
            "message_text": "string",
            "sender_name": "string",
            "agent_token": "string", # Need the agent token for auth to the gateway
            "action": "simulate_response" | "extract_event_from_message" # Depending on the intent
        }
        """
        logger.info(f"Starting ProcessWhatsAppMessageTask for phone {payload.get('phone_number')}")

        message_text = payload.get("message_text")
        sender_name = payload.get("sender_name")
        phone_number = payload.get("phone_number")
        agent_token = payload.get("agent_token")
        action = payload.get("action", "simulate_response") # Default to simulate_response

        if not message_text or not agent_token:
            raise ValueError("Missing required fields: 'message_text' or 'agent_token' in payload.")

        # Prepare formatting matching the N8N HTTP Request node to the agent-gateway
        headers = {
            "Content-Type": "application/json",
            "x-agent-token": agent_token
        }
        
        # Format the arguments as expected by the Edge Function
        args = {
            "message": message_text,
            "sender_phone": phone_number,
            "sender_name": sender_name
        }

        request_body = {
            "tool": action,
            "agent_name": "whatsapp-python-worker",  # Identifying the source
            "args": args
        }

        try:
            # Use httpx for async HTTP requests as per Python async patterns
            async with httpx.AsyncClient() as client:
                logger.info(f"Sending request to agent-gateway: action={action}")
                response = await client.post(
                    self.gateway_url,
                    headers=headers,
                    json=request_body,
                    timeout=30.0 # Agent gateway might take some time (Gemini API)
                )

                # Raise an exception for HTTP error statuses (4xx, 5xx)
                response.raise_for_status()
                
                result = response.json()
                
                # The agent gateway returns { "success": true, "data": ... } or { "error": ... }
                if not result.get("success"):
                     # If the gateway returned a 200 but success is false, treat as error
                     error_msg = result.get("error", "Unknown error from agent-gateway")
                     raise RuntimeError(f"Agent Gateway Error: {error_msg}")

                logger.info(f"Successfully processed WhatsApp message via agent-gateway.")
                return {"status": "success", "gateway_response": result.get("data")}

        except httpx.HTTPStatusError as e:
            # Captures HTTP errors like 500 Internal Server Error, 401 Unauthorized, etc.
            error_msg = f"HTTP Error {e.response.status_code} calling agent-gateway: {e.response.text}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e
            
        except httpx.RequestError as e:
            # Captures connection errors, timeouts, etc.
            error_msg = f"Network error calling agent-gateway: {str(e)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e
