from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, chat, dashboard, export

app = FastAPI(
    title="Softwaremen AI Asistan",
    description="SMSUIT_DAU + GIGASOFT.mdb bağlantı | JWT güvenliği | Groq AI | Export",
    version="4.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(export.router)


@app.get("/", include_in_schema=False)
def root():
    return {"durum": "Softwaremen AI Asistan v4.2 çalışıyor"}


@app.get("/health", tags=["sistem"])
def health():
    from db.connection import test_connections
    return {"api": "ok", "veritabanlari": test_connections()}


@app.get("/debug", tags=["sistem"])
def debug():
    """Bağlantı ve .env teşhisi. Üretimde kapatın."""
    import pyodbc
    from config import (
        DB_SERVER, DB_NAME, DB_USER, DB_TIMEOUT,
        GIGASOFT_SERVER, GIGASOFT_NAME, GIGASOFT_USER,
        MDB_PATH, MDB_PASSWORD,
    )
    from db.connection import test_connections

    return {
        "env": {
            "DB_SERVER":        DB_SERVER        or "BOŞTU — .env okunamadı!",
            "DB_NAME":          DB_NAME,
            "DB_USER":          DB_USER,
            "DB_TIMEOUT":       DB_TIMEOUT,
            "GIGASOFT_SERVER":  GIGASOFT_SERVER  or "(tanımlı değil)",
            "GIGASOFT_NAME":    GIGASOFT_NAME,
            "GIGASOFT_USER":    GIGASOFT_USER,
            "MDB_PATH":         MDB_PATH         or "(tanımlı değil)",
            "MDB_PASSWORD_set": bool(MDB_PASSWORD),
        },
        "odbc_suruculer": pyodbc.drivers(),
        "baglanti_testi": test_connections(),
    }


@app.get("/debug/kullanici", tags=["sistem"])
def debug_kullanici(kullanici_adi: str):
    """Kullanıcının GIGASOFT'taki ham verisini gösterir. Üretimde kapatın."""
    try:
        from db.connection import get_gigasoft_connection
        conn = get_gigasoft_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT CODE, EXPLANATION, USER_NAME, PASSWORD, ACTIVE "
            "FROM USERS WHERE USER_NAME = ? OR CODE = ?",
            (kullanici_adi, kullanici_adi),
        )
        row = cursor.fetchone()
        if not row:
            return {"durum": "bulunamadı", "aranan": kullanici_adi}

        kod       = str(row[0] or "").strip()
        ad        = str(row[1] or "").strip()
        user_name = str(row[2] or "").strip()
        password  = str(row[3] or "").strip()
        active    = row[4]

        # PASSWORD_NET kolonunu dene
        sifre_net = ""
        try:
            cursor.execute("SELECT PASSWORD_NET FROM USERS WHERE CODE = ?", (kod,))
            r = cursor.fetchone()
            sifre_net = str(r[0] or "").strip() if r else ""
        except Exception:
            sifre_net = "(kolon yok)"

        # Modüller
        moduller_raw = {}
        try:
            cursor.execute("SELECT * FROM USER_PROGRAMS WHERE USER_CODE = ?", (kod,))
            prow = cursor.fetchone()
            if prow:
                cols = [c[0] for c in cursor.description]
                moduller_raw = dict(zip(cols, prow))
        except Exception as e:
            moduller_raw = {"hata": str(e)}

        conn.close()
        return {
            "durum":      "bulundu",
            "kod":        kod,
            "ad":         ad,
            "user_name":  user_name,
            "active":     active,
            "PASSWORD":     f"{'(dolu)' if password  else '(boş)'} | uzunluk={len(password)}  | ilk3={password[:3]!r}",
            "PASSWORD_NET": f"{'(dolu)' if sifre_net and sifre_net != '(kolon yok)' else '(boş/yok)'} | uzunluk={len(sifre_net)} | ilk3={sifre_net[:3]!r}",
            "user_programs": moduller_raw,
        }
    except Exception as e:
        return {"durum": "hata", "detay": str(e)}


@app.get("/debug/kullanicilar", tags=["sistem"])
def debug_kullanicilar():
    """SMSUIT_DAU'daki kullanıcıları ve çözümlenmiş şifrelerini gösterir. Üretimde kapatın."""
    try:
        from db.connection import get_smsuit_connection
        from db.users import gigasoft_decode
        conn = get_smsuit_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT CODE, EXPLANATION, USER_NAME, PASSWORD, ACTIVE FROM USERS ORDER BY CODE"
        )
        rows = []
        for row in cursor.fetchall():
            enc = str(row[3] or "").strip()
            try:
                decoded = gigasoft_decode(enc)
                # Sadece yazdırılabilir karakter içerip içermediğini kontrol et
                printable = all(32 <= ord(c) <= 126 for c in decoded)
                sifre_gercek = decoded if printable else "(özel karakter — LOCAL_USERS kullan)"
            except Exception:
                sifre_gercek = "(çözümlenemedi)"
            rows.append({
                "kod":        str(row[0] or "").strip(),
                "ad":         str(row[1] or "").strip(),
                "user_name":  str(row[2] or "").strip(),
                "active":     row[4],
                "gercek_sifre": sifre_gercek,
            })
        conn.close()
        return {"toplam": len(rows), "kullanicilar": rows}
    except Exception as e:
        return {"durum": "hata", "detay": str(e)}
