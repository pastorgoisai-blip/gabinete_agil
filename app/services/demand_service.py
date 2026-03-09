from sqlalchemy.orm import Session
from app.models.demand import Demand
from app.services.tenant_vault_service import TenantVaultService
from typing import Optional, Dict
import uuid

class GovIntegrationError(Exception):
    pass

class DemandService:
    """
    Service for managing demands (citizen requests).
    Handles creation, updates, and synchronization with external city hall systems.
    """

    def __init__(self, db: Session, tenant_vault_service: Optional[TenantVaultService] = None):
        self.db = db
        self.vault_service = tenant_vault_service or TenantVaultService(db)

    def create_demand(self, demand_data: Dict, sync_external: bool = False) -> Demand:
        """
        Creates a new demand and optionally syncs it with the external City Hall system.
        
        Args:
            demand_data: Dictionary containing demand attributes.
            sync_external: If True, attempts to sync with the external system using cabinet credentials.
            
        Returns:
            The created Demand object.
            
        Raises:
            GovIntegrationError: If sync_external is True but no valid cabinet credentials are found.
        """
        cabinet_id = demand_data.get("cabinet_id")
        if not cabinet_id:
             raise ValueError("Cabinet ID is required to create a demand.")

        # If external sync is requested, we MUST have valid government credentials for the cabinet.
        if sync_external:
            creds = self.vault_service.get_cabinet_gov_credentials(uuid.UUID(str(cabinet_id)))
            
            if not creds or not creds.get("username") or not creds.get("password"):
                raise GovIntegrationError("O Gabinete ainda não configurou a conta oficial da prefeitura.")
                
            # Simulate external sync logic here (e.g., calling City Hall API)
            # In a real implementation, we would use the credentials to authenticate against the external API.
            print(f"DEBUG: Syncing demand with City Hall using credentials for user: {creds['username']}")
            demand_data['sync_status'] = 'synced' # Optimistic update for simulation
            demand_data['external_id'] = f"EXT-{uuid.uuid4().hex[:8].upper()}"

        new_demand = Demand(**demand_data)
        self.db.add(new_demand)
        self.db.commit()
        self.db.refresh(new_demand)
        
        return new_demand
