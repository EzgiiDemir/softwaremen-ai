from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import json
from db import get_connection, DB_GETTERS


load_dotenv(dotenv_path=Path(__file__).parent / ".env")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
JWT_SECRET = os.getenv("JWT_SECRET", "fallback_secret")
JWT_ALGORITHM = "HS256"
JWT_SURE_DAKIKA = 480  # 8 saat

app = FastAPI(title="Softwaremen AI Asistan")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ── Müşteri ve şifre tabloları ──────────────────────────────────────────────
MUSTERILER = {
    "demo": {
        "ad": "Demo Market",
        "modul_erisim": ["stockman", "financeman", "pos", "wageman"],
    },
    "musteri_a": {
        "ad": "ABC Market",
        "modul_erisim": ["stockman", "financeman", "pos", "barcodeman", "smloyalty"],
    },
    "musteri_b": {
        "ad": "XYZ Restoran",
        "modul_erisim": ["pos", "serviceman", "wageman", "smproposal"],
    },
}

SIFRELER = {
    "demo":       "demo123",
    "musteri_a":  "musteri_a123",
    "musteri_b":  "musteri_b123",
}

# ── JWT yardımcıları ─────────────────────────────────────────────────────────
def token_olustur(musteri_id: str) -> str:
    musteri = MUSTERILER[musteri_id]
    payload = {
        "sub": musteri_id,
        "ad":  musteri["ad"],
        "modul_erisim": musteri["modul_erisim"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_SURE_DAKIKA),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def token_dogrula(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")


# ── Mock veri ────────────────────────────────────────────────────────────────
MOCK_DATA = {
    "stockman": {
        "kritik_stoklar": [
            {"urun": "Coca Cola 330ml", "stok": 12, "gunluk_satis": 45, "kalan_gun": 0},
            {"urun": "Ülker Çikolata",  "stok": 8,  "gunluk_satis": 20, "kalan_gun": 0},
            {"urun": "Lipton Çay 100lü","stok": 3,  "gunluk_satis": 5,  "kalan_gun": 0},
        ],
        "toplam_urun": 847,
        "bugun_satis": 234,
        "bu_ay_ciro": 125400,
    },
    "financeman": {
        "kasa_bakiye": 45230,
        "banka_bakiye": 128500,
        "acik_fatura": 67800,
        "vadesi_gelen_cek": [
            {"musteri": "ABC Market", "tutar": 12500, "vade": "15.04.2026"},
            {"musteri": "XYZ Gıda",   "tutar": 8300,  "vade": "18.04.2026"},
        ],
    },
    "serviceman": {
        "acik_cagri": 12,
        "bugun_kapanan": 4,
        "ortalama_cozum_sure": "2.3 gün",
        "bekleyen_parca": ["Kompresor 2HP", "Termostat B200"],
    },
    "wageman": {
        "toplam_personel": 23,
        "bu_ay_bordro": 187500,
        "izinli": 2,
        "devamsiz": 1,
        "bu_ay_izin_talep": 5,
        "onay_bekleyen": 2,
    },
    "accountman": {
        "hesap_plani": [
            {"kod": "100", "ad": "Kasa",              "bakiye": 45230},
            {"kod": "102", "ad": "Bankalar",           "bakiye": 128500},
            {"kod": "120", "ad": "Alıcılar",           "bakiye": 234000},
            {"kod": "320", "ad": "Satıcılar",          "bakiye": 180000},
            {"kod": "600", "ad": "Yurt İçi Satışlar",  "bakiye": 125400},
        ],
        "bu_ay_yevmiye": 234,
        "kdv_beyan_durumu": "Hazır",
        "bekleyen_fisler": 12,
        "toplam_borc": 450000,
        "toplam_alacak": 380000,
    },
    "productman": {
        "aktif_receteler": 23,
        "devam_eden_uretim": 5,
        "bekleyen_hammadde": ["Un 500kg", "Şeker 200kg"],
        "bu_ay_uretim_maliyeti": 87500,
    },
    "barcodeman": {
        "bugun_basilan_etiket": 450,
        "bekleyen_is": 3,
        "yazici_durum": "Aktif",
        "son_guncelleme": "13.04.2026",
    },
    "smproposal": {
        "bekleyen_teklif": 8,
        "onaylanan": 5,
        "reddedilen": 2,
        "toplam_teklif_tutari": 234500,
        "bu_ay_kazanma_orani": "62%",
    },
    "smloyalty": {
        "toplam_uye": 1250,
        "aktif_uye": 890,
        "bu_ay_yeni_uye": 45,
        "puan_kullanan": 123,
        "churn_riski_yuksek": 34,
    },
    "smimports": {
        "aktif_sevkiyat": 3,
        "gumrukte_bekleyen": 1,
        "toplam_maliyet": 125000,
        "kur_riski": "Orta",
    },
    "smgrocery": {
        "bugun_mustahasil_fis": 12,
        "toplam_stopaj": 3450,
        "taze_urun_stok": 45,
        "fire_yuzdesi": "3.2%",
    },
    "pos": {
        "bugun_ciro": 45230,
        "acik_masa": 8,
        "toplam_masa": 20,
        "en_cok_satan": "Coca Cola",
        "saatlik_doluluk": "78%",
    },
}

MODUL_PROMPTLARI = {
    "stockman":   "Sen Softwaremen StockMan modülünün asistanısın. Stok seviyeleri, kritik ürünler, satış hızları, sipariş önerileri ve depo yönetimi konularında rehberlik ediyorsun.",
    "financeman": "Sen Softwaremen FinanceMan modülünün asistanısın. Kasa ve banka bakiyeleri, açık faturalar, çek/senet takibi ve nakit akış planlaması konularında analiz yapıyorsun.",
    "serviceman": "Sen Softwaremen ServiceMan modülünün asistanısın. Teknik servis çağrıları, garanti süreçleri, teknisyen iş yükü ve yedek parça takibi konularında yardım ediyorsun.",
    "wageman":    "Sen Softwaremen WageMan modülünün asistanısın. Bordro hesaplamaları, devam takibi, izin yönetimi, SGK bildirimleri ve personel maliyetleri konularında destek sağlıyorsun.",
    "accountman": "Sen Softwaremen AccountMan modülünün asistanısın. Muhasebe fişleri, hesap planı, KDV beyanı, mizan ve bilanço konularında rehberlik ediyorsun.",
    "productman": "Sen Softwaremen ProductMan modülünün asistanısın. Üretim reçeteleri, iş emirleri, hammadde planlaması ve üretim maliyetleri konularında analiz yapıyorsun.",
    "barcodeman": "Sen Softwaremen BarcodeMan modülünün asistanısın. Barkod ve etiket basım işlemleri, yazıcı durumu ve ürün etiketleme konularında destek sağlıyorsun.",
    "smproposal": "Sen Softwaremen smProposal modülünün asistanısın. Satış teklifleri, teklif onay süreçleri, kazanma oranları ve müşteri fiyatlandırması konularında analiz yapıyorsun.",
    "smloyalty":  "Sen Softwaremen smLoyalty modülünün asistanısın. Müşteri sadakat programı, puan sistemi, üye aktivitesi ve churn riski analizi konularında yardım ediyorsun.",
    "smimports":  "Sen Softwaremen smImports modülünün asistanısın. İthalat sevkiyatları, gümrük süreçleri, kur riski yönetimi ve tedarik maliyetleri konularında rehberlik ediyorsun.",
    "smgrocery":  "Sen Softwaremen smGrocery modülünün asistanısın. Müstahsil alımları, stopaj kesintileri, taze ürün stok yönetimi ve fire takibi konularında destek sağlıyorsun.",
    "pos":        "Sen Softwaremen POS modülünün asistanısın. Günlük ciro takibi, masa/kasa yönetimi, en çok satan ürünler ve doluluk oranı konularında analiz yapıyorsun.",
    "genel":      "Sen Softwaremen ERP sisteminin genel asistanısın. Tüm modüller hakkında sorulara yanıt veriyorsun.",
}


# ── Request modelleri ────────────────────────────────────────────────────────
class GirisRequest(BaseModel):
    musteri_id: str
    sifre: str


class SoruRequest(BaseModel):
    soru: str
    modul: str = "genel"


# ── Endpoint'ler ─────────────────────────────────────────────────────────��───
@app.get("/")
def root():
    return {"durum": "Softwaremen AI Asistan çalışıyor"}


@app.get("/health")
def health():
    conn = get_connection()
    db_durum = "connected" if conn else "mock"
    if conn:
        conn.close()
    return {"status": "ok", "ai": "groq", "db": db_durum}


@app.post("/giris")
def giris(req: GirisRequest):
    musteri = MUSTERILER.get(req.musteri_id)
    if not musteri or SIFRELER.get(req.musteri_id) != req.sifre:
        raise HTTPException(status_code=401, detail="Geçersiz müşteri ID veya şifre")
    token = token_olustur(req.musteri_id)
    return {
        "token": token,
        "musteri_id": req.musteri_id,
        "ad": musteri["ad"],
        "modul_erisim": musteri["modul_erisim"],
    }


@app.post("/sor")
async def sor(req: SoruRequest, kullanici: dict = Depends(token_dogrula)):
    modul_erisim = kullanici.get("modul_erisim", [])
    if req.modul != "genel" and req.modul not in modul_erisim:
        raise HTTPException(status_code=403, detail="Bu modüle erişim izniniz yok")

    try:
        # DB'den veri almayı dene, başarısız olursa mock'a düş
        veri_kaynagi = "mock"
        veri = MOCK_DATA.get(req.modul, {})
        getter = DB_GETTERS.get(req.modul)
        if getter:
            conn = get_connection()
            db_veri = getter(conn)
            if conn:
                conn.close()
            if db_veri:
                veri = db_veri
                veri_kaynagi = "db"

        sistem_promptu = MODUL_PROMPTLARI.get(req.modul, MODUL_PROMPTLARI["genel"])

        prompt = f"""{sistem_promptu}

Müşteri: {kullanici.get("ad")}
Modül verisi ({veri_kaynagi}):
{veri}

Kullanıcı sorusu: {req.soru}

Türkçe, kısa ve net yanıt ver. Sayısal veriler varsa mutlaka kullan.
Madde madde yaz, uzun paragraf yazma."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        yanit = response.choices[0].message.content
        return {"yanit": yanit, "modul": req.modul, "musteri": kullanici.get("sub")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ozet/{modul}")
async def modul_ozet(modul: str, kullanici: dict = Depends(token_dogrula)):
    modul_erisim = kullanici.get("modul_erisim", [])
    if modul not in modul_erisim:
        raise HTTPException(status_code=403, detail="Bu modüle erişim izniniz yok")

    try:
        veri = MOCK_DATA.get(modul, {})
        getter = DB_GETTERS.get(modul)
        if getter:
            conn = get_connection()
            db_veri = getter(conn)
            if conn:
                conn.close()
            if db_veri:
                veri = db_veri

        if not veri:
            raise HTTPException(status_code=404, detail="Modül bulunamadı")

        prompt = f"""{MODUL_PROMPTLARI.get(modul, '')}

Aşağıdaki veriyi analiz et ve Türkçe kısa özet çıkar.
Dikkat edilmesi gereken 2-3 kritik nokta belirt.
Madde madde yaz.

Veri: {veri}"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        ozet = response.choices[0].message.content
        return {"modul": modul, "ozet": ozet, "ham_veri": veri}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/bildirimler/{musteri_id}")
async def bildirimler(musteri_id: str, kullanici: dict = Depends(token_dogrula)):
    if kullanici.get("sub") != musteri_id:
        raise HTTPException(status_code=403, detail="Erişim izniniz yok")

    modul_erisim = kullanici.get("modul_erisim", [])

    # Her erişilebilir modül için DB'yi dene, başarısız olursa mock kullan
    conn = get_connection()
    musteri_verisi = {}
    for modul in modul_erisim:
        getter = DB_GETTERS.get(modul)
        db_veri = getter(conn) if getter else None
        musteri_verisi[modul] = db_veri if db_veri else MOCK_DATA.get(modul, {})
    if conn:
        conn.close()

    try:
        prompt = f"""Sen Softwaremen ERP sisteminin bildirim motorusun.
Müşteri: {kullanici.get("ad")}
Erişim izinli modüller: {modul_erisim}

Aşağıdaki modül verilerini analiz et, kritik durumları tespit et.

Veri:
{json.dumps(musteri_verisi, ensure_ascii=False, indent=2)}

Yanıtı SADECE geçerli JSON dizisi olarak ver:
[
  {{"tip": "kritik", "modul": "modül_adı", "mesaj": "Türkçe bildirim mesajı"}},
  {{"tip": "uyari",  "modul": "modül_adı", "mesaj": "Türkçe bildirim mesajı"}},
  {{"tip": "bilgi",  "modul": "modül_adı", "mesaj": "Türkçe bildirim mesajı"}}
]

tip: "kritik" (kırmızı), "uyari" (sarı), "bilgi" (mavi)
Sadece gerçekten önemli 5-8 bildirim üret. Başka hiçbir şey yazma."""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )
        icerik = response.choices[0].message.content.strip()

        if "```" in icerik:
            icerik = icerik.split("```")[1]
            if icerik.startswith("json"):
                icerik = icerik[4:]
            icerik = icerik.strip()

        bildirim_listesi = json.loads(icerik)
        return {"bildirimler": bildirim_listesi, "musteri": musteri_id}

    except json.JSONDecodeError:
        return {"bildirimler": [], "musteri": musteri_id, "hata": "JSON parse hatası"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
