import logging
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from db.users import get_user_by_username, verify_password
from services.auth_service import token_olustur, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class GirisRequest(BaseModel):
    kullanici_adi: str
    sifre: str


@router.post("/giris")
def giris(req: GirisRequest):
    # 1. Kullanıcıyı GIGASOFT.mdb'den getir
    try:
        user = get_user_by_username(req.kullanici_adi.strip())
    except Exception as e:
        logger.error("MDB bağlantı hatası: %s", e)
        raise HTTPException(
            status_code=503,
            detail=f"Veritabanı bağlantı hatası: {e}",
        )

    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")

    # 2. Şifre doğrula
    if not verify_password(user, req.sifre):
        raise HTTPException(status_code=401, detail="Hatalı şifre")

    # 3. JWT token üret
    try:
        token = token_olustur(user["kod"], user["ad"], user["moduller"])
    except Exception as e:
        logger.error("Token üretim hatası: %s", e)
        raise HTTPException(status_code=500, detail=f"Token üretilemedi: {e}")

    return {
        "token":        token,
        "kullanici_id": user["kod"],
        "ad":           user["ad"],
        "moduller":     user["moduller"],
    }


@router.get("/ben")
def ben(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    return {
        "kullanici_id": payload.get("sub"),
        "ad":           payload.get("ad"),
        "moduller":     payload.get("moduller", []),
    }
