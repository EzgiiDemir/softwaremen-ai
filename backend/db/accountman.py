from db.connection import get_smsuit_connection


def _rows(cursor) -> list[dict]:
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_hesap_plani() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT TOP 20 ACCOUNTCODE, ACCOUNT_EXPLANATION FROM ACCOUNT_VOUCHERS"
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_son_islemler() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT TOP 10 *
            FROM ENTRY_TRANSACTIONS
            ORDER BY ID DESC
            """
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_muhasebe_ozet() -> dict:
    """
    AI için zengin muhasebe verisi döndürür:
    - Özet sayılar
    - Hesap planı listesi (tüm hesaplar)
    - Son 30 işlem detaylı
    - Bu ayki ve geçen ayki işlem sayıları
    """
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()

        # Fiş sayısı
        cursor.execute("SELECT COUNT(*) FROM ACCOUNT_VOUCHERS")
        fis_sayisi = cursor.fetchone()[0]

        # Son işlem tarihi
        cursor.execute(
            "SELECT TOP 1 CONVERT(varchar, TRANS_DATE, 104) "
            "FROM ENTRY_TRANSACTIONS ORDER BY ID DESC"
        )
        row = cursor.fetchone()
        son_islem = row[0] if row else "Veri yok"

        # Bu ay yapılan işlem sayısı
        cursor.execute(
            """
            SELECT COUNT(*) FROM ENTRY_TRANSACTIONS
            WHERE YEAR(TRANS_DATE)  = YEAR(GETDATE())
              AND MONTH(TRANS_DATE) = MONTH(GETDATE())
            """
        )
        bu_ay_islem = cursor.fetchone()[0]

        # Hesap planı (tüm hesaplar)
        cursor.execute(
            """
            SELECT
                ACCOUNTCODE         AS hesap_kodu,
                ACCOUNT_EXPLANATION AS hesap_adi
            FROM ACCOUNT_VOUCHERS
            ORDER BY ACCOUNTCODE
            """
        )
        hesap_plani = _rows(cursor)

        # Son 30 muhasebe işlemi
        cursor.execute(
            """
            SELECT TOP 30 *
            FROM ENTRY_TRANSACTIONS
            ORDER BY ID DESC
            """
        )
        son_islemler = _rows(cursor)

        return {
            "ozet": {
                "bekleyen_fis_sayisi": fis_sayisi,
                "son_islem_tarihi":    son_islem,
                "bu_ay_islem_sayisi":  bu_ay_islem,
            },
            "hesap_plani":  hesap_plani,
            "son_islemler": son_islemler,
        }
    finally:
        conn.close()
