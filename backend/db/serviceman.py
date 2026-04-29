"""
SERVICE_TABLE şeması:
  SERVICE_ID, CURRENT_CODE, MACHINE_NO, STATUS (tinyint: 0=açık 1=kapandı),
  START_DATE, END_DATE, CLOSED_DATE, TYPE, GROUP, PLACE, WARRANTY_STATUS
"""

from db.connection import get_smsuit_connection

_STATUS_ACIK   = 0
_STATUS_KAPALI = 1


def _rows(cursor) -> list[dict]:
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_acik_cagrilar() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""
            SELECT TOP 20
                SERVICE_ID, CURRENT_CODE, MACHINE_NO,
                STATUS, START_DATE, WARRANTY_STATUS
            FROM SERVICE_TABLE
            WHERE STATUS = {_STATUS_ACIK}
            ORDER BY START_DATE DESC
            """
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_servis_ozet() -> dict:
    """
    AI için zengin servis verisi döndürür:
    - Özet sayılar (açık/kapanan)
    - Tüm açık çağrıların detaylı listesi
    - Bugün ve bu hafta kapanan çağrılar
    - Garanti durumuna göre dağılım
    """
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()

        # Açık çağrı sayısı
        cursor.execute(
            f"SELECT COUNT(*) FROM SERVICE_TABLE WHERE STATUS = {_STATUS_ACIK}"
        )
        acik_sayi = cursor.fetchone()[0]

        # Bugün kapanan
        cursor.execute(
            f"""
            SELECT COUNT(*) FROM SERVICE_TABLE
            WHERE STATUS = {_STATUS_KAPALI}
              AND CAST(CLOSED_DATE AS DATE) = CAST(GETDATE() AS DATE)
            """
        )
        bugun_kapanan = cursor.fetchone()[0]

        # Bu hafta kapanan
        cursor.execute(
            f"""
            SELECT COUNT(*) FROM SERVICE_TABLE
            WHERE STATUS = {_STATUS_KAPALI}
              AND CLOSED_DATE >= DATEADD(day, -7, GETDATE())
            """
        )
        hafta_kapanan = cursor.fetchone()[0]

        # Açık çağrıların detaylı listesi (tümü)
        cursor.execute(
            f"""
            SELECT
                SERVICE_ID      AS servis_id,
                CURRENT_CODE    AS musteri_kodu,
                MACHINE_NO      AS makine_no,
                START_DATE      AS baslangic_tarihi,
                WARRANTY_STATUS AS garanti_durumu,
                ISNULL(TYPE,  '') AS servis_tipi,
                ISNULL(PLACE, '') AS konum
            FROM SERVICE_TABLE
            WHERE STATUS = {_STATUS_ACIK}
            ORDER BY START_DATE ASC
            """
        )
        acik_cagrilar = _rows(cursor)

        # Son 20 kapalı çağrı
        cursor.execute(
            f"""
            SELECT TOP 20
                SERVICE_ID      AS servis_id,
                CURRENT_CODE    AS musteri_kodu,
                MACHINE_NO      AS makine_no,
                START_DATE      AS baslangic_tarihi,
                CLOSED_DATE     AS kapanis_tarihi,
                WARRANTY_STATUS AS garanti_durumu
            FROM SERVICE_TABLE
            WHERE STATUS = {_STATUS_KAPALI}
            ORDER BY CLOSED_DATE DESC
            """
        )
        kapali_cagrilar = _rows(cursor)

        return {
            "ozet": {
                "acik_cagri_sayisi": acik_sayi,
                "bugun_kapanan":     bugun_kapanan,
                "hafta_kapanan":     hafta_kapanan,
            },
            "acik_cagrilar":   acik_cagrilar,
            "kapali_cagrilar": kapali_cagrilar,
        }
    finally:
        conn.close()
