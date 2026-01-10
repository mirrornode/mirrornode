"""
MIRRORNODE Security Module
API Key Authentication + Authorization

Authority: THOTH Security Commander
Date: 2025-01-09
Status: LOCKDOWN PASS ACTIVE
"""
import os
from typing import Optional
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Key configuration
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key() -> str:
    """
    Retrieve API key from environment.
    
    Returns:
        str: MIRRORNODE API key
        
    Raises:
        RuntimeError: If MIRRORNODE_API_KEY not set
    """
    key = os.getenv("MIRRORNODE_API_KEY")
    if not key:
        raise RuntimeError(
            "MIRRORNODE_API_KEY not set. Generate with: openssl rand -hex 32"
        )
    return key

def require_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Dependency that validates API key from X-API-Key header.
    
    Args:
        api_key: API key from request header (injected by FastAPI)
    
    Raises:
        HTTPException: 401 if key missing or invalid
    
    Returns:
        str: Validated API key
    """
    expected_key = get_api_key()
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Include X-API-Key header.",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    if api_key != expected_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    return api_key

def require_admin_key(api_key: str = Security(require_api_key)) -> str:
    """
    Dependency for admin-only endpoints (future use).
    Currently identical to require_api_key.
    
    Args:
        api_key: Validated API key from require_api_key
    
    Returns:
        str: Validated admin API key
    """
    # Future: Check against MIRRORNODE_ADMIN_KEY
    return api_key
