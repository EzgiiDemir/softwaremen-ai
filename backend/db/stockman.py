from db.connection import get_smsuit_connection


def _rows(cursor) -> list[dict]:
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_stok_listesi() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT CODE, EXPLANATION, UNIT1, ACTIVE "
            "FROM STK_CARD WHERE ACTIVE = 1"
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_kritik_stoklar() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT s.CODE, s.EXPLANATION, d.AVAILABLE_QUANTITY,
                   d.IN_QUANTITY, d.OUT_QUANTITY
            FROM STK_CARD s
            JOIN DEPOT_STK_LIST d ON s.CODE = d.STK_CODE
            WHERE d.AVAILABLE_QUANTITY < 10
            ORDER BY d.AVAILABLE_QUANTITY ASC
            """
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_stok_ozet() -> dict:
    """
    AI için zengin stok verisi döndürür:
    - Özet sayılar
    - Kritik stokların detaylı listesi (miktar < 10)
    - Tüm ürün listesi (miktar ile birlikte, maks 100)
    """
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()

        # Toplam ürün sayısı
        cursor.execute("SELECT COUNT(*) FROM STK_CARD WHERE ACTIVE = 1")
        toplam = cursor.fetchone()[0]

        # Kritik stok sayısı
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM STK_CARD s
            JOIN DEPOT_STK_LIST d ON s.CODE = d.STK_CODE
            WHERE d.AVAILABLE_QUANTITY < 10
            """
        )
        kritik_sayi = cursor.fetchone()[0]

        # Kritik stokların detaylı listesi
        cursor.execute(
            """
            SELECT TOP 50
                s.CODE        AS urun_kodu,
                s.EXPLANATION AS urun_adi,
                s.UNIT1       AS birim,
                ISNULL(d.AVAILABLE_QUANTITY, 0) AS mevcut_miktar,
                ISNULL(d.IN_QUANTITY, 0)        AS giris_miktar,
                ISNULL(d.OUT_QUANTITY, 0)       AS cikis_miktar
            FROM STK_CARD s
            JOIN DEPOT_STK_LIST d ON s.CODE = d.STK_CODE
            WHERE d.AVAILABLE_QUANTITY < 10 AND s.ACTIVE = 1
            ORDER BY d.AVAILABLE_QUANTITY ASC
            """
        )
        kritik_liste = _rows(cursor)

        # Tüm ürünler (miktarı olanlara öncelik ver)
        cursor.execute(
            """
            SELECT TOP 100
                s.CODE        AS urun_kodu,
                s.EXPLANATION AS urun_adi,
                s.UNIT1       AS birim,
                ISNULL(d.AVAILABLE_QUANTITY, 0) AS mevcut_miktar,
                ISNULL(d.IN_QUANTITY, 0)        AS giris_miktar,
                ISNULL(d.OUT_QUANTITY, 0)       AS cikis_miktar
            FROM STK_CARD s
            LEFT JOIN DEPOT_STK_LIST d ON s.CODE = d.STK_CODE
            WHERE s.ACTIVE = 1
            ORDER BY ISNULL(d.AVAILABLE_QUANTITY, 0) DESC
            """
        )
        stok_listesi = _rows(cursor)

        return {
            "ozet": {
                "toplam_urun":         toplam,
                "kritik_stok_sayisi":  kritik_sayi,
            },
            "kritik_stoklar": kritik_liste,
            "stok_listesi":   stok_listesi,
        }
    finally:
        conn.close()
