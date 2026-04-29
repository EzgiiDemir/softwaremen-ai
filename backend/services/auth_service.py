from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException
from config import JWT_SECRET, JWT_ALGO, JWT_EXPIRE_HOURS


def token_olustur(kullanici_id: str, ad: str, moduller: list[str]) -> str:
    payload = {
        "sub": str(kullanici_id),
        "ad": ad,
        "moduller": moduller,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def token_dogrula(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Geçersiz veya süresi dolmuş token: {e}")


def get_current_user(authorization: str | None) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header eksik")
    token = authorization.removeprefix("Bearer ").strip()
    return token_dogrula(token)
