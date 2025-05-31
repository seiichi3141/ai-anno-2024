"""
API認証関連の機能
"""
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from src.config import ALLOWED_API_KEYS

# APIキー認証用のヘッダー
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    """APIキーを検証する"""
    # APIキーが設定されていない場合はスキップ（開発環境用）
    if not ALLOWED_API_KEYS or ALLOWED_API_KEYS[0] == '':
        return None
        
    if api_key not in ALLOWED_API_KEYS:
        raise HTTPException(
            status_code=401,
            detail="無効なAPIキーです",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return api_key
