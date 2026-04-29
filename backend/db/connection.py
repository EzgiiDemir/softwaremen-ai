"""
Veritabanı bağlantıları.

Bağlantı önceliği (kullanıcı doğrulama):
  1. GIGASOFT SQL Server (192.168.128.208 / GIGASOFT)
  2. GIGASOFT.mdb Access (yedek — SQL Server yoksa)
"""

import pyodbc

# Access ODBC driver'ı registry'e geçici DSN yazmaya çalışır;
# admin yetkisi olmayan süreçlerde bu başarısız olur.
# pooling=False bu davranışı devre dışı bırakır.
pyodbc.pooling = False

from config import (
    DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD, DB_TIMEOUT,
    GIGASOFT_SERVER, GIGASOFT_NAME, GIGASOFT_USER, GIGASOFT_PASSWORD,
    MDB_PATH, MDB_PASSWORD,
)


def get_smsuit_connection() -> pyodbc.Connection:
    """SMSUIT_DAU SQL Server — iş verisi."""
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        f"TrustServerCertificate=yes;"
        f"Connection Timeout={DB_TIMEOUT};",
        timeout=DB_TIMEOUT,
    )


def _gigasoft_via_sqlserver() -> pyodbc.Connection:
    """GIGASOFT SQL Server — kullanıcı tabloları."""
    if not GIGASOFT_SERVER:
        raise RuntimeError("GIGASOFT_SERVER .env'de tanımlı değil.")
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={GIGASOFT_SERVER};"
        f"DATABASE={GIGASOFT_NAME};"
        f"UID={GIGASOFT_USER};"
        f"PWD={GIGASOFT_PASSWORD};"
        f"TrustServerCertificate=yes;"
        f"Connection Timeout={DB_TIMEOUT};",
        timeout=DB_TIMEOUT,
    )


def _gigasoft_via_mdb() -> pyodbc.Connection:
    """GIGASOFT.mdb Access — yedek yöntem."""
    if not MDB_PATH:
        raise RuntimeError("MDB_PATH .env'de tanımlı değil.")
    pwd_kismi = f"PWD={MDB_PASSWORD};" if MDB_PASSWORD else ""
    return pyodbc.connect(
        "DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
        f"DBQ={MDB_PATH};"
        f"{pwd_kismi}",
        timeout=DB_TIMEOUT,
    )


def get_gigasoft_connection() -> pyodbc.Connection:
    """
    Önce SQL Server GIGASOFT'u dener, başarısız olursa MDB'ye geçer.
    Her iki yöntem de başarısız olursa son hatayı fırlatır.
    """
    try:
        return _gigasoft_via_sqlserver()
    except Exception as sql_err:
        pass  # SQL Server yoksa MDB'ye düş

    try:
        return _gigasoft_via_mdb()
    except Exception as mdb_err:
        # Her ikisi de başarısız — birleşik hata mesajı ver
        raise RuntimeError(
            f"GIGASOFT bağlantısı kurulamadı.\n"
            f"SQL Server hatası: {sql_err}\n"
            f"MDB hatası: {mdb_err}"
        )


def test_connections() -> list[dict]:
    """Tüm DB bağlantılarını test eder ve sonuçları döndürür."""
    results = []

    # SMSUIT SQL Server
    try:
        get_smsuit_connection().close()
        results.append({"db": "smsuit", "durum": "connected"})
    except Exception as e:
        results.append({"db": "smsuit", "durum": "error", "detay": str(e)})

    # GIGASOFT SQL Server
    try:
        _gigasoft_via_sqlserver().close()
        results.append({"db": "gigasoft_sqlserver", "durum": "connected"})
    except Exception as e:
        results.append({"db": "gigasoft_sqlserver", "durum": "error", "detay": str(e)})

    # GIGASOFT MDB
    try:
        _gigasoft_via_mdb().close()
        results.append({"db": "gigasoft_mdb", "durum": "connected"})
    except Exception as e:
        results.append({"db": "gigasoft_mdb", "durum": "error", "detay": str(e)})

    return results
