import os
from cryptography.fernet import Fernet
import base64
from typing import Optional

class CryptoService:
    """
    Service for encrypting and decrypting sensitive data.
    Uses Fernet (symmetric encryption).
    """

    def __init__(self, secret_key: Optional[str] = None):
        """
        Initialize the CryptoService.
        
        Args:
            secret_key: The secret key for encryption. If not provided,
                       it tries to read from APP_SECRET_KEY env var.
                       If neither exists, it generates a temporary one (NOT RECOMMENDED FOR PROD).
        """
        self.secret_key = secret_key or os.getenv("APP_SECRET_KEY")
        
        if not self.secret_key:
            # Fallback for dev/test without env var - WARNING: Data won't persist across restarts if this happens
            print("WARNING: APP_SECRET_KEY not found. Using a temporary key.")
            self.key = Fernet.generate_key()
        else:
            # Ensure key is 32 url-safe base64-encoded bytes
            try:
                # If the key is just a raw string, we might need to handle it, 
                # but Fernet expects specific format. 
                # For this implementation, we assume the env var provides a valid Fernet key.
                self.key = self.secret_key.encode() if isinstance(self.secret_key, str) else self.secret_key
            except Exception as e:
                print(f"Error loading key: {e}")
                self.key = Fernet.generate_key()

        self.cipher = Fernet(self.key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypts a plaintext string."""
        if not plaintext:
            return ""
        encrypted_bytes = self.cipher.encrypt(plaintext.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')

    def decrypt(self, ciphertext: str) -> str:
        """Decrypts a ciphertext string."""
        if not ciphertext:
            return ""
        try:
            decrypted_bytes = self.cipher.decrypt(ciphertext.encode('utf-8'))
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            print(f"Decryption error: {e}")
            raise ValueError("Invalid credentials or wrong key")
