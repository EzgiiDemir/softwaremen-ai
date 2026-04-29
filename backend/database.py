"""
Çift veritabanı motoru: MS Access (.mdb) + SQL Server (smsuit)

Bağlantı stratejisi:
  - SQL Server : pyodbc ODBC-seviye pooling (pyodbc.pooling = True)
  - MDB (Access): threading.Lock ile seri erişim (Access eşzamanlı yazma desteklemez)

Veritabanı haritası:
  smsuit → SQL Server 192.168.128.208 / SMSUIT (stok, finans, servis...)
  mdb    → GIGASOFT.mdb (Access) — kullanıcı doğrulama
"""

import os
import re
import threading
import logging
from contextlib import contextmanager
from typing import Generator

import pyodbc
from fastapi import HTTPException
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

# ODBC seviye connection pooling — SQL Server bağlantılarını yeniden kullanır
pyodbc.pooling = True

_TIMEOUT = 5  # saniye
_MDB_PATH = os.getenv("MDB_PATH", "")

# ── Connection string'ler ─────────────────────────────────────────────────────
_CONN_STRINGS: dict[str, str] = {
    "mdb": (
        r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
        f"DBQ={_MDB_PATH};"
    ),
    "smsuit": (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={os.getenv('DB_SERVER', '')};"
        f"DATABASE={os.getenv('DB_NAME', 'SMSUIT')};"
        f"UID={os.getenv('DB_USER', 'sa')};"
        f"PWD={os.getenv('DB_PASSWORD', '')};"
        f"TrustServerCertificate=yes;"
        f"Connection Timeout={_TIMEOUT};"
    ),
}

VALID_DB_TYPES = frozenset(_CONN_STRINGS.keys())

# MDB için seri erişim kilidi
_mdb_lock = threading.Lock()

# Tablo adı güvenlik kontrolü — sadece harf/rakam/alt çizgi
_TABLE_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_\s]*$")


# ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────

def _validate_db_type(db_tipi: str) -> None:
    if db_tipi not in VALID_DB_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz db_tipi: '{db_tipi}'. Geçerli seçenekler: {', '.join(sorted(VALID_DB_TYPES))}",
        )


def _validate_table_name(name: str) -> None:
    if not _TABLE_RE.match(name):
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz tablo adı: '{name}'. Sadece harf, rakam ve alt çizgi kullanılabilir.",
        )


def _rows_to_dicts(cursor: pyodbc.Cursor) -> list[dict]:
    cols = [col[0] for col in cursor.description]
    return [
        {col: (val.strip() if isinstance(val, str) else val) for col, val in zip(cols, row)}
        for row in cursor.fetchall()
    ]


# ── Hata dönüştürücüler ───────────────────────────────────────────────────────

def _mdb_error(e: pyodbc.Error) -> None:
    msg = str(e).lower()
    if any(k in msg for k in ("already in use", "exclusive", "locked", "sharing violation")):
        raise HTTPException(
            status_code=503,
            detail="Veritabanı meşgul: .mdb dosyası başka bir program tarafından özel modda açık.",
        )
    if "not a valid path" in msg or "could not find" in msg:
        raise HTTPException(
            status_code=503,
            detail=f"Dosya bulunamadı: {_MDB_PATH}",
        )
    raise HTTPException(status_code=503, detail=f"Access bağlantı hatası: {e}")


def _sql_error(e: pyodbc.Error, db_tipi: str) -> None:
    code = str(e.args[0]) if e.args else ""
    msg = str(e).lower()
    if "08001" in code or "timeout" in msg or "timed out" in msg:
        raise HTTPException(
            status_code=503,
            detail=f"SQL Server ({db_tipi}) zaman aşımı — sunucu yanıt vermiyor.",
        )
    if "28000" in code or "login failed" in msg:
        raise HTTPException(
            status_code=503,
            detail=f"SQL Server ({db_tipi}) kimlik doğrulama hatası — kullanıcı adı/şifre yanlış.",
        )
    if "17" in code or "cannot open" in msg:
        raise HTTPException(
            status_code=503,
            detail=f"SQL Server ({db_tipi}) bağlantı reddedildi — sunucu adresi hatalı veya servis çalışmıyor.",
        )
    raise HTTPException(status_code=503, detail=f"SQL Server ({db_tipi}) hatası: {e}")


# ── Bağlantı açıcılar ─────────────────────────────────────────────────────────

def _open_mdb() -> pyodbc.Connection:
    if not _MDB_PATH:
        raise HTTPException(status_code=503, detail="MDB_PATH .env dosyasında tanımlı değil.")
    try:
        return pyodbc.connect(_CONN_STRINGS["mdb"], timeout=_TIMEOUT)
    except pyodbc.Error as e:
        _mdb_error(e)


def _open_sql(db_tipi: str) -> pyodbc.Connection:
    try:
        return pyodbc.connect(_CONN_STRINGS[db_tipi])
    except pyodbc.Error as e:
        _sql_error(e, db_tipi)


# ── Context manager — ana bağlantı kapısı ─────────────────────────────────────

@contextmanager
def get_conn(db_tipi: str) -> Generator[pyodbc.Connection, None, None]:
    """
    Thread-safe bağlantı context manager'ı.
    MDB için global kilit kullanır; SQL Server için ODBC pooling yeterli.
    """
    _validate_db_type(db_tipi)

    if db_tipi == "mdb":
        with _mdb_lock:
            conn = _open_mdb()
            try:
                yield conn
            finally:
                try:
                    conn.close()
                except Exception:
                    pass
    else:
        conn = _open_sql(db_tipi)
        try:
            yield conn
        finally:
            try:
                conn.close()
            except Exception:
                pass


# ── Yüksek seviye sorgu fonksiyonları ────────────────────────────────────────

def query_table(db_tipi: str, tablo_adi: str, limit: int = 500) -> list[dict]:
    _validate_table_name(tablo_adi)
    with get_conn(db_tipi) as conn:
        try:
            cursor = conn.cursor()
            # TOP söz dizimi hem Access hem SQL Server'da aynı şekilde çalışır
            cursor.execute(f"SELECT TOP {int(limit)} * FROM [{tablo_adi}]")
            return _rows_to_dicts(cursor)
        except pyodbc.ProgrammingError as e:
            raise HTTPException(
                status_code=404,
                detail=f"Tablo bulunamadı: '{tablo_adi}' — {e}",
            )
        except pyodbc.Error as e:
            raise HTTPException(status_code=500, detail=f"Sorgu hatası: {e}")


def list_tables(db_tipi: str) -> list[str]:
    with get_conn(db_tipi) as conn:
        cursor = conn.cursor()
        if db_tipi == "mdb":
            return sorted(t.table_name for t in cursor.tables(tableType="TABLE"))
        cursor.execute(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
            "WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
        )
        return [row[0] for row in cursor.fetchall()]


def execute_query(db_tipi: str, sql: str, params: tuple = ()) -> list[dict]:
    """Ham SQL çalıştırır. Sadece güvenilir dahili kullanım için."""
    with get_conn(db_tipi) as conn:
        try:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            return _rows_to_dicts(cursor)
        except pyodbc.Error as e:
            raise HTTPException(status_code=500, detail=f"Sorgu hatası: {e}")


def check_health(db_tipi: str) -> dict:
    try:
        with get_conn(db_tipi) as conn:
            cursor = conn.cursor()
            if db_tipi == "mdb":
                next(iter(cursor.tables(tableType="TABLE")), None)
            else:
                cursor.execute("SELECT 1")
        return {"db": db_tipi, "durum": "ok"}
    except HTTPException as e:
        return {"db": db_tipi, "durum": "hata", "detay": e.detail}
    except Exception as e:
        return {"db": db_tipi, "durum": "hata", "detay": str(e)}
