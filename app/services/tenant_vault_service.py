from typing import Dict, Optional
import uuid
from sqlalchemy.orm import Session
from app.models.cabinet import Cabinet
from app.services.crypto_service import CryptoService

class TenantVaultService:
    """
    Service for managing secure credentials at the Cabinet (Tenant) level.
    """

    def __init__(self, db: Session, crypto_service: Optional[CryptoService] = None):
        self.db = db
        self.crypto = crypto_service or CryptoService()

    def get_cabinet_gov_credentials(self, cabinet_id: uuid.UUID) -> Dict[str, str]:
        """
        Retrieves and decrypts the government credentials for a cabinet.
        
        Returns:
            Dict with 'username' and 'password' (decrypted).
        """
        cabinet = self.db.query(Cabinet).filter(Cabinet.id == cabinet_id).first()
        
        if not cabinet or not cabinet.gov_credentials:
            return {}

        creds = cabinet.gov_credentials
        username = creds.get("username")
        password_enc = creds.get("password_enc")

        if not username or not password_enc:
            return {}

        try:
            password = self.crypto.decrypt(password_enc)
            return {
                "username": username,
                "password": password
            }
        except Exception as e:
            print(f"Error decrypting credentials for cabinet {cabinet_id}: {e}")
            return {}

    def save_cabinet_gov_credentials(self, cabinet_id: uuid.UUID, username: str, password: str) -> bool:
        """
        Encrypts and saves government credentials for a cabinet.
        """
        cabinet = self.db.query(Cabinet).filter(Cabinet.id == cabinet_id).first()
        if not cabinet:
            raise ValueError(f"Cabinet {cabinet_id} not found")

        encrypted_password = self.crypto.encrypt(password)
        
        cabinet.gov_credentials = {
            "username": username,
            "password_enc": encrypted_password
        }
        
        self.db.add(cabinet)
        self.db.commit()
        return True
