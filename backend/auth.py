import os
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 480

security = HTTPBearer()

USERS: dict[str, dict] = {
    "demo": {
        "sifre": "demo123",
        "ad": "Demo Market",
        "modul_erisim": ["stockman", "financeman", "pos", "wageman"],
    },
    "musteri_a": {
        "sifre": "musteri_a123",
        "ad": "ABC Market",
        "modul_erisim": ["*"],
    },
    "musteri_b": {
        "sifre": "musteri_b123",
        "ad": "XYZ Restoran",
        "modul_erisim": ["pos", "serviceman", "wageman"],
    },
}


def token_olustur(musteri_id: str) -> str:
    user = USERS[musteri_id]
    payload = {
        "sub": musteri_id,
        "ad": user["ad"],
        "modul_erisim": user["modul_erisim"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def token_dogrula(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
