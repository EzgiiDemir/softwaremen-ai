from db.connection import get_smsuit_connection


def _rows(cursor) -> list[dict]:
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_kasa_durumu() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT CODE, EXPLANATION, TOTAL_CASH FROM PETTY_CASH")
        return _rows(cursor)
    finally:
        conn.close()


def get_cari_listesi() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT TOP 20
                c.CODE, c.EXPLANATION,
                ISNULL(SUM(t.DEPT) - SUM(t.CREDIT), 0) AS bakiye
            FROM CURRENT_CARD c
            LEFT JOIN CURRENT_TRANSACTION t ON c.CODE = t.CURRENT_CODE
            GROUP BY c.CODE, c.EXPLANATION
            ORDER BY c.CODE
            """
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_vadesi_gelen_cekler() -> list[dict]:
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT CHEQUE_NO, WRITTEN_TO, CHEQUE_TOTAL, DUE_DATE
            FROM CHEQUE_CARD
            WHERE DUE_DATE <= DATEADD(day, 7, GETDATE())
            ORDER BY DUE_DATE ASC
            """
        )
        return _rows(cursor)
    finally:
        conn.close()


def get_finans_ozet() -> dict:
    """
    AI için zengin finans verisi döndürür:
    - Özet sayılar
    - Kasa hesapları (tüm kasalar bakiyeleriyle)
    - Cari hesaplar (bakiyesi olanlara göre sıralı, maks 100)
    - Yaklaşan çekler (30 gün içinde vadesi dolacaklar)
    - Vadesi geçmiş çekler
    """
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()

        # Kasa toplamı
        cursor.execute("SELECT ISNULL(SUM(TOTAL_CASH), 0) FROM PETTY_CASH")
        kasa_toplam = float(cursor.fetchone()[0])

        # Cari hesap sayısı
        cursor.execute("SELECT COUNT(*) FROM CURRENT_CARD")
        cari_sayisi = cursor.fetchone()[0]

        # 7 gün içinde vadesi gelecek çek sayısı
        cursor.execute(
            """
            SELECT COUNT(*) FROM CHEQUE_CARD
            WHERE DUE_DATE <= DATEADD(day, 7, GETDATE())
              AND DUE_DATE >= GETDATE()
            """
        )
        yaklas_cek = cursor.fetchone()[0]

        # Tüm kasa hesapları (bakiyeleriyle)
        cursor.execute(
            """
            SELECT
                CODE        AS kasa_kodu,
                EXPLANATION AS kasa_adi,
                ISNULL(TOTAL_CASH, 0) AS bakiye
            FROM PETTY_CASH
            ORDER BY ISNULL(TOTAL_CASH, 0) DESC
            """
        )
        kasalar = _rows(cursor)

        # Cari hesaplar — bakiyeyi CURRENT_TRANSACTION'dan hesapla
        cursor.execute(
            """
            SELECT TOP 100
                c.CODE        AS cari_kodu,
                c.EXPLANATION AS cari_adi,
                ISNULL(SUM(t.DEPT) - SUM(t.CREDIT), 0) AS bakiye
            FROM CURRENT_CARD c
            LEFT JOIN CURRENT_TRANSACTION t ON c.CODE = t.CURRENT_CODE
            GROUP BY c.CODE, c.EXPLANATION
            ORDER BY ABS(ISNULL(SUM(t.DEPT) - SUM(t.CREDIT), 0)) DESC
            """
        )
        cari_hesaplar = _rows(cursor)

        # 30 gün içinde vadesi dolacak çekler
        cursor.execute(
            """
            SELECT
                CHEQUE_NO   AS cek_kodu,
                WRITTEN_TO  AS aciklama,
                ISNULL(CHEQUE_TOTAL, 0) AS tutar,
                DUE_DATE    AS vade_tarihi
            FROM CHEQUE_CARD
            WHERE DUE_DATE BETWEEN GETDATE() AND DATEADD(day, 30, GETDATE())
            ORDER BY DUE_DATE ASC
            """
        )
        yaklasan_cekler = _rows(cursor)

        # Vadesi geçmiş çekler
        cursor.execute(
            """
            SELECT TOP 50
                CHEQUE_NO   AS cek_kodu,
                WRITTEN_TO  AS aciklama,
                ISNULL(CHEQUE_TOTAL, 0) AS tutar,
                DUE_DATE    AS vade_tarihi
            FROM CHEQUE_CARD
            WHERE DUE_DATE < GETDATE()
            ORDER BY DUE_DATE DESC
            """
        )
        gecmis_cekler = _rows(cursor)

        return {
            "ozet": {
                "kasa_toplam":          kasa_toplam,
                "cari_sayisi":          cari_sayisi,
                "vadesi_yaklasan_cek":  yaklas_cek,
            },
            "kasalar":         kasalar,
            "cari_hesaplar":   cari_hesaplar,
            "yaklasan_cekler": yaklasan_cekler,
            "gecmis_cekler":   gecmis_cekler,
        }
    finally:
        conn.close()
