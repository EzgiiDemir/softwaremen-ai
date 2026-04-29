from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.ai_service import ai_sor, yanit_tipi_tespit
from db import stockman, financeman, accountman, serviceman, wageman

router = APIRouter(prefix="/chat", tags=["chat"])

_DB_OZET = {
    "stockman":   stockman.get_stok_ozet,
    "financeman": financeman.get_finans_ozet,
    "accountman": accountman.get_muhasebe_ozet,
    "serviceman": serviceman.get_servis_ozet,
    "wageman":    wageman.get_personel_ozet,
}

_EXPORT_URLS: dict[tuple, str] = {
    ("stockman",   "export_excel"): "/export/stok/excel",
    ("stockman",   "export_pdf"):   "/export/stok/pdf",
    ("financeman", "export_excel"): "/export/finans/excel",
    ("wageman",    "export_excel"): "/export/personel/excel",
}

_AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
          "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]


def _turkce_tarih() -> str:
    n = datetime.now()
    return f"{n.day} {_AYLAR[n.month - 1]} {n.year} {n.strftime('%H:%M')}"


class SoruRequest(BaseModel):
    soru: str
    modul: str = "genel"


@router.post("/sor")
def sor(req: SoruRequest, authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    moduller = payload.get("moduller", [])

    if req.modul != "genel" and req.modul not in moduller:
        raise HTTPException(status_code=403, detail="Bu modüle erişim yetkiniz yok")

    tip = yanit_tipi_tespit(req.soru)

    # Export tiplerinde AI'ya sormadan direkt hazır mesaj döndür
    if tip in ("export_excel", "export_pdf"):
        export_url = _EXPORT_URLS.get((req.modul, tip))
        dosya_turu = "Excel" if tip == "export_excel" else "PDF"
        if export_url:
            yanit = f"Dosyanız hazırlandı! Aşağıdaki butona tıklayarak {dosya_turu} dosyasını indirebilirsiniz."
        else:
            yanit = f"Bu modül için {dosya_turu} export özelliği henüz desteklenmiyor."
        return {
            "yanit":      yanit,
            "tip":        tip,
            "export_url": export_url,
            "modul":      req.modul,
            "zaman":      _turkce_tarih(),
        }

    veri: dict | list = {}
    fn = _DB_OZET.get(req.modul)
    if fn:
        try:
            veri = fn()
        except Exception as e:
            veri = {"db_hatasi": str(e)}

    yanit = ai_sor(req.soru, req.modul, veri, kullanici_ad=payload.get("ad", ""))

    return {
        "yanit":      yanit,
        "tip":        tip,
        "export_url": None,
        "modul":      req.modul,
        "zaman":      _turkce_tarih(),
    }
