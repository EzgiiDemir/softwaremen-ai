import pyodbc
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")


def get_connection():
    server   = os.getenv("DB_SERVER",   "localhost")
    database = os.getenv("DB_NAME",     "SoftwaremenDB")
    user     = os.getenv("DB_USER",     "sa")
    password = os.getenv("DB_PASSWORD", "")

    try:
        conn = pyodbc.connect(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password};"
            f"TrustServerCertificate=yes",
            timeout=3
        )
        return conn
    except Exception:
        return None


def get_stockman_data(conn):
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP 10
                si.code, si.name,
                ISNULL(sb.quantity, 0)  AS stok,
                ISNULL(si.min_stock, 0) AS min_stok
            FROM stock_items si
            LEFT JOIN stock_balances sb ON si.id = sb.stock_item_id
            WHERE si.is_active = 1
            ORDER BY sb.quantity ASC
        """)
        rows = cursor.fetchall()
        return [{"kod": r[0], "urun": r[1], "stok": r[2], "min_stok": r[3]}
                for r in rows]
    except Exception:
        return None


def get_financeman_data(conn):
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                SUM(CASE WHEN is_pos = 0 THEN current_balance ELSE 0 END) AS kasa,
                COUNT(*) AS kasa_sayisi
            FROM cash_registers
            WHERE is_active = 1
        """)
        row = cursor.fetchone()
        return {"kasa_bakiye": row[0] or 0, "kasa_sayisi": row[1] or 0}
    except Exception:
        return None


def get_wageman_data(conn):
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                COUNT(*)                                                AS toplam_personel,
                SUM(ISNULL(gross_salary, 0))                           AS bu_ay_bordro,
                SUM(CASE WHEN status = 'izinli'   THEN 1 ELSE 0 END)  AS izinli,
                SUM(CASE WHEN status = 'devamsiz' THEN 1 ELSE 0 END)  AS devamsiz
            FROM employees
            WHERE is_active = 1
        """)
        row = cursor.fetchone()
        return {
            "toplam_personel": row[0] or 0,
            "bu_ay_bordro":    row[1] or 0,
            "izinli":          row[2] or 0,
            "devamsiz":        row[3] or 0,
        }
    except Exception:
        return None


def get_pos_data(conn):
    if not conn:
        return None
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                ISNULL(SUM(total_amount), 0)                              AS bugun_ciro,
                SUM(CASE WHEN status = 'open'   THEN 1 ELSE 0 END)       AS acik_masa,
                COUNT(*)                                                   AS toplam_masa
            FROM pos_tables
            WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
        """)
        row = cursor.fetchone()
        return {
            "bugun_ciro":  row[0] or 0,
            "acik_masa":   row[1] or 0,
            "toplam_masa": row[2] or 0,
        }
    except Exception:
        return None


# Modül → DB fonksiyon haritası
# Yeni modüller eklendikçe buraya fonksiyon eklemek yeterli
DB_GETTERS = {
    "stockman":   get_stockman_data,
    "financeman": get_financeman_data,
    "wageman":    get_wageman_data,
    "pos":        get_pos_data,
}
