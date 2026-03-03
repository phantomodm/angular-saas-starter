"""
Firebase Admin SDK Wrapper Service
Handles token verification and user management
"""

import firebase_admin
from firebase_admin import credentials, auth
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class FirebaseAdminService:
    """
    Singleton service for Firebase Admin SDK initialization and operations.
    Provides methods for token verification, user management, and custom claims.
    """
    
    _instance = None
    _app = None
    
    def __new__(cls):
        """Ensure only one instance of Firebase Admin SDK is initialized"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Firebase Admin SDK if not already initialized"""
        if self._app is None:
            self._initialize_firebase()
    
    def _initialize_firebase(self):
        """
        Initialize Firebase Admin SDK using service account credentials.
        Credentials file path is read from environment variable.
        """
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', './serviceAccountKey.json')
        
        if not Path(cred_path).exists():
            raise FileNotFoundError(
                f"Firebase credentials file not found at {cred_path}. "
                "Please download from Firebase Console > Project Settings > Service Accounts "
                "and set FIREBASE_CREDENTIALS_PATH environment variable."
            )
        
        try:
            cred = credentials.Certificate(cred_path)
            self._app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {str(e)}")
            raise
    
    def verify_token(self, token: str) -> dict:
        """
        Verify Firebase ID token and return decoded claims.
        
        Args:
            token (str): Firebase ID token from Authorization header
            
        Returns:
            dict: Decoded token claims including uid, email, custom_claims, etc.
            
        Raises:
            ValueError: If token is invalid, expired, or malformed
        """
        if not token:
            raise ValueError("Token is required")
        
        try:
            decoded_token = auth.verify_id_token(token)
            logger.debug(f"Token verified for user: {decoded_token.get('uid')}")
            return decoded_token
        except firebase_admin.auth.InvalidIdTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise ValueError(f"Invalid token: {str(e)}")
        except firebase_admin.auth.ExpiredIdTokenError as e:
            logger.warning(f"Token expired: {str(e)}")
            raise ValueError(f"Token expired: {str(e)}")
        except firebase_admin.auth.RevokedIdTokenError as e:
            logger.warning(f"Token revoked: {str(e)}")
            raise ValueError(f"Token revoked: {str(e)}")
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise ValueError(f"Token verification failed: {str(e)}")
    
    def get_user(self, uid: str) -> dict:
        """
        Get user information from Firebase.
        
        Args:
            uid (str): Firebase user ID
            
        Returns:
            dict: User information including email, display_name, custom_claims
            
        Raises:
            ValueError: If user not found or retrieval fails
        """
        try:
            user = auth.get_user(uid)
            return {
                'uid': user.uid,
                'email': user.email,
                'email_verified': user.email_verified,
                'display_name': user.display_name,
                'photo_url': user.photo_url,
                'disabled': user.disabled,
                'custom_claims': user.custom_claims or {}
            }
        except firebase_admin.auth.UserNotFoundError:
            logger.warning(f"User not found: {uid}")
            raise ValueError(f"User not found: {uid}")
        except Exception as e:
            logger.error(f"Could not retrieve user {uid}: {str(e)}")
            raise ValueError(f"Could not retrieve user: {str(e)}")
    
    def set_custom_claims(self, uid: str, claims: dict) -> None:
        """
        Set custom claims on a user account.
        Used for storing roles, permissions, organization ID, etc.
        
        Args:
            uid (str): Firebase user ID
            claims (dict): Custom claims to set (e.g., {'role': 'admin', 'org_id': '123'})
            
        Raises:
            ValueError: If user not found or claim setting fails
        """
        try:
            auth.set_custom_user_claims(uid, claims)
            logger.info(f"Custom claims set for user {uid}: {list(claims.keys())}")
        except firebase_admin.auth.UserNotFoundError:
            logger.error(f"User not found for claims: {uid}")
            raise ValueError(f"User not found: {uid}")
        except Exception as e:
            logger.error(f"Could not set custom claims for {uid}: {str(e)}")
            raise ValueError(f"Could not set custom claims: {str(e)}")
    
    def delete_user(self, uid: str) -> None:
        """
        Delete a user account from Firebase.
        
        Args:
            uid (str): Firebase user ID
            
        Raises:
            ValueError: If user deletion fails
        """
        try:
            auth.delete_user(uid)
            logger.info(f"User deleted: {uid}")
        except firebase_admin.auth.UserNotFoundError:
            logger.warning(f"User not found for deletion: {uid}")
            raise ValueError(f"User not found: {uid}")
        except Exception as e:
            logger.error(f"Could not delete user {uid}: {str(e)}")
            raise ValueError(f"Could not delete user: {str(e)}")
    
    def create_custom_token(self, uid: str, additional_claims: dict = None) -> str:
        """
        Create a custom Firebase token for server-side auth.
        Useful for testing or admin operations.
        
        Args:
            uid (str): Firebase user ID
            additional_claims (dict): Custom claims to include in token
            
        Returns:
            str: Custom Firebase token
            
        Raises:
            ValueError: If token creation fails
        """
        try:
            token = auth.create_custom_token(uid, additional_claims=additional_claims)
            return token.decode('utf-8') if isinstance(token, bytes) else token
        except Exception as e:
            logger.error(f"Could not create custom token for {uid}: {str(e)}")
            raise ValueError(f"Could not create custom token: {str(e)}")
    
    def get_app(self):
        """Get the initialized Firebase app instance"""
        if self._app is None:
            self._initialize_firebase()
        return self._app


# Global singleton instance
firebase_service = FirebaseAdminService()
