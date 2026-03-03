"""
Database Module
Provides access to Firebase Firestore database
"""

import firebase_admin
from firebase_admin import firestore
import logging

logger = logging.getLogger(__name__)


class FirestoreDatabase:
    """
    Singleton Firestore database wrapper.
    Provides access to Firestore collections and documents.
    """
    
    _instance = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Firestore if not already initialized"""
        if self._db is None:
            try:
                # Get the default Firebase app (must be initialized first via FirebaseAdminService)
                self._db = firestore.client()
                logger.info("✓ Firestore database initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Firestore: {str(e)}")
                raise
    
    def get_db(self):
        """Get Firestore client"""
        return self._db
    
    def collection(self, collection_name: str):
        """Get reference to a collection"""
        return self._db.collection(collection_name)
    
    def document(self, collection_name: str, document_id: str):
        """Get reference to a specific document"""
        return self._db.collection(collection_name).document(document_id)


# Singleton instance
_firestore_db = FirestoreDatabase()


def get_firestore_db():
    """Dependency injection helper to get Firestore database"""
    return _firestore_db.get_db()


# Convenience access
firestore_db = _firestore_db.get_db()
