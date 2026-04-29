from db.connection import get_smsuit_connection


def _rows(cursor) -> list[dict]:
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_personel_listesi() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT CODE, EXPLANATION, TYPE, ACTIVE "
            "FROM PERSONNEL_CARD WHERE ACTIVE = 1"
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_personel_ozet() -> dict:
    """
    AI için zengin personel verisi döndürür:
    - Özet sayılar
    - Tüm aktif personel listesi (tip ve durum bilgisiyle)
    - Tipe göre dağılım
    """
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()

        # Toplam personel
        cursor.execute("SELECT COUNT(*) FROM PERSONNEL_CARD")
        toplam = cursor.fetchone()[0]

        # Aktif personel
        cursor.execute("SELECT COUNT(*) FROM PERSONNEL_CARD WHERE ACTIVE = 1")
        aktif = cursor.fetchone()[0]

        # Tüm aktif personel listesi
        cursor.execute(
            """
            SELECT
                CODE        AS personel_kodu,
                EXPLANATION AS personel_adi,
                TYPE        AS tip,
                ACTIVE      AS aktif
            FROM PERSONNEL_CARD
            WHERE ACTIVE = 1
            ORDER BY EXPLANATION
            """
        )
        personel_listesi = _rows(cursor)

        # Tipe göre dağılım
        cursor.execute(
            """
            SELECT
                CAST(ISNULL(TYPE, 0) AS varchar(20)) AS tip,
                COUNT(*) AS sayi
            FROM PERSONNEL_CARD
            WHERE ACTIVE = 1
            GROUP BY TYPE
            ORDER BY COUNT(*) DESC
            """
        )
        tip_dagilim = _rows(cursor)

        return {
            "ozet": {
                "toplam_personel": toplam,
                "aktif_personel":  aktif,
            },
            "personel_listesi": personel_listesi,
            "tip_dagilim":      tip_dagilim,
        }
    finally:
        conn.close()
