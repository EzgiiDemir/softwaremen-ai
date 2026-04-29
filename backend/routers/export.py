import io
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from services.auth_service import get_current_user
from services.export_service import veri_to_excel, veri_to_pdf
from db import stockman, financeman, wageman

router = APIRouter(prefix="/export", tags=["export"])

_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
_PDF  = "application/pdf"


def _yetki(payload: dict, modul: str):
    if modul not in payload.get("moduller", []):
        raise HTTPException(status_code=403, detail="Bu modüle erişim yetkiniz yok")


def _streaming(data: bytes, media: str, dosya: str) -> StreamingResponse:
    return StreamingResponse(
        io.BytesIO(data),
        media_type=media,
        headers={"Content-Disposition": f"attachment; filename={dosya}"},
    )


# ── Stok ──────────────────────────────────────────────────────────────────

@router.get("/stok/excel")
def stok_excel(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    _yetki(payload, "stockman")

    rows = stockman.get_stok_listesi()
    sutunlar = ["Ürün Kodu", "Ürün Adı", "Birim", "Aktif"]
    veri = [[r.get("CODE",""), r.get("EXPLANATION",""), r.get("UNIT1",""), r.get("ACTIVE","")] for r in rows]

    return _streaming(veri_to_excel("Stok Listesi", veri, sutunlar), _XLSX, "stok_listesi.xlsx")


@router.get("/stok/pdf")
def stok_pdf(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    _yetki(payload, "stockman")

    rows = stockman.get_stok_listesi()[:50]
    sutunlar = ["Ürün Kodu", "Ürün Adı", "Birim"]
    veri = [[r.get("CODE",""), str(r.get("EXPLANATION",""))[:35], r.get("UNIT1","")] for r in rows]

    return _streaming(veri_to_pdf("Stok Listesi", veri, sutunlar), _PDF, "stok_listesi.pdf")


@router.get("/stok/kritik/excel")
def stok_kritik_excel(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    _yetki(payload, "stockman")

    rows = stockman.get_kritik_stoklar()
    sutunlar = ["Ürün Kodu", "Ürün Adı", "Mevcut Miktar"]
    veri = [[r.get("CODE",""), r.get("EXPLANATION",""), r.get("AVAILABLE_QUANTITY",0)] for r in rows]

    return _streaming(veri_to_excel("Kritik Stok Listesi", veri, sutunlar), _XLSX, "kritik_stoklar.xlsx")


# ── Finans ────────────────────────────────────────────────────────────────

@router.get("/finans/excel")
def finans_excel(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    _yetki(payload, "financeman")

    rows = financeman.get_cari_listesi()
    sutunlar = ["Cari Kodu", "Cari Adı", "Bakiye (₺)"]
    veri = [[r.get("cari_kodu",""), r.get("cari_adi",""), r.get("bakiye", 0)] for r in rows]

    return _streaming(veri_to_excel("Cari Listesi", veri, sutunlar), _XLSX, "cari_listesi.xlsx")


@router.get("/finans/cekler/excel")
def finans_cekler_excel(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    _yetki(payload, "financeman")

    rows = financeman.get_vadesi_gelen_cekler()
    sutunlar = ["Çek No", "Adına", "Tutar (₺)", "Vade Tarihi"]
    veri = [[r.get("CHEQUE_NO",""), r.get("WRITTEN_TO",""), r.get("CHEQUE_TOTAL",0), str(r.get("DUE_DATE",""))] for r in rows]

    return _streaming(veri_to_excel("Vadesi Yaklaşan Çekler", veri, sutunlar), _XLSX, "vadesi_yaklasan_cekler.xlsx")


# ── Personel ──────────────────────────────────────────────────────────────

@router.get("/personel/excel")
def personel_excel(authorization: str | None = Header(None)):
    payload = get_current_user(authorization)
    _yetki(payload, "wageman")

    rows = wageman.get_personel_listesi()
    sutunlar = ["Personel Kodu", "Adı Soyadı", "Türü", "Aktif"]
    veri = [[r.get("CODE",""), r.get("EXPLANATION",""), r.get("TYPE",""), r.get("ACTIVE","")] for r in rows]

    return _streaming(veri_to_excel("Personel Listesi", veri, sutunlar), _XLSX, "personel_listesi.xlsx")
