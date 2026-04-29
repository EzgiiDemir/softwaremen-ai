"""
SMSUIT_DAU.USERS tablosundan kullanıcı doğrulama.

Şifre algoritması (GIGASOFT proprietary XOR):
  KEY = [36, 9, 3, 3, 102, 125, 116, 112, 51, 65]  (10-byte, döngüsel)
  encoded = "~" + XOR(plain, KEY)

  Örnek: "qLJV" → "~UEIU"  (ADMIN kullanıcısı)

Tablo şeması (SMSUIT_DAU):
  USERS        : CODE, EXPLANATION, USER_NAME, PASSWORD, ACTIVE
  USER_PROGRAMS: GIGASOFT veritabanında (modül yetkileri)
"""

import os
import logging
from db.connection import get_smsuit_connection, get_gigasoft_connection

logger = logging.getLogger(__name__)

# GIGASOFT XOR şifreleme anahtarı (10-byte, döngüsel)
_GIGASOFT_KEY = [36, 9, 3, 3, 102, 125, 116, 112, 51, 65]

_MODUL_KOLONLARI = [
    "STOCKMAN", "FINANCEMAN", "ACCOUNTMAN",
    "SERVICEMAN", "PRODUCTMAN", "BARCODEMAN", "WAGEMAN",
]


# ── GIGASOFT şifreleme ────────────────────────────────────────────────────────

def _safe_str(val) -> str:
    """
    pyodbc bazen PASSWORD gibi sütunları bytes döndürebilir.
    bytes gelirse latin-1 ile decode et (GIGASOFT tek baytlık charset kullanır).
    """
    if val is None:
        return ""
    if isinstance(val, (bytes, bytearray)):
        return val.decode("latin-1")
    return str(val)


def gigasoft_encode(plain: str) -> str:
    """Plaintext şifreyi GIGASOFT formatına çevirir: 'sifre' → '~XXXXX'"""
    result = [
        chr(ord(c) ^ _GIGASOFT_KEY[i % len(_GIGASOFT_KEY)])
        for i, c in enumerate(plain)
    ]
    return "~" + "".join(result)


def gigasoft_decode(encoded: str) -> str:
    """GIGASOFT şifreli değerden gerçek şifreyi çözer: '~XXXXX' → 'sifre'"""
    s = _safe_str(encoded)
    if s.startswith("~"):
        s = s[1:]
    result = [
        chr(ord(c) ^ _GIGASOFT_KEY[i % len(_GIGASOFT_KEY)])
        for i, c in enumerate(s)
    ]
    return "".join(result)


# ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────

def _local_users() -> dict[str, str]:
    """LOCAL_USERS=001:sifre1,100:sifre2 formatını parse eder."""
    raw = os.getenv("LOCAL_USERS", "")
    users: dict[str, str] = {}
    for entry in raw.split(","):
        parts = entry.strip().split(":", 1)
        if len(parts) == 2:
            key = parts[0].strip()
            val = parts[1].strip()
            if key:
                users[key] = val
    return users


def _normalize_kod(kod: str) -> str:
    """'001' ve '1' aynı kullanıcıyı temsil edebilir."""
    stripped = kod.lstrip("0")
    return stripped if stripped else "0"


def _is_active(val) -> bool:
    """ACTIVE alanını farklı kolon tiplerinde kontrol eder."""
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    if isinstance(val, int):
        return val != 0
    return str(val).strip().upper() not in ("0", "F", "N", "FALSE", "")


def _get_moduller(kod: str) -> list[str]:
    """
    Modül yetkilerini GIGASOFT.USER_PROGRAMS tablosundan çeker.
    GIGASOFT bağlantısı başarısız olursa tüm modüller verilir.
    """
    # Negatif kod (SUPER gibi) → tam yetki
    if str(kod).startswith("-"):
        return [k.lower() for k in _MODUL_KOLONLARI]

    modul_sql = ", ".join(_MODUL_KOLONLARI)
    try:
        conn = get_gigasoft_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                f"SELECT {modul_sql} FROM USER_PROGRAMS WHERE USER_CODE = ?",
                (kod,),
            )
            prow = cursor.fetchone()
            if prow:
                return [
                    kol.lower()
                    for kol, val in zip(_MODUL_KOLONLARI, prow)
                    if _is_active(val)
                ]
        finally:
            conn.close()
    except Exception as e:
        logger.warning("USER_PROGRAMS çekilemedi (kod=%s): %s", kod, e)

    # Varsayılan: tüm modüller
    return [k.lower() for k in _MODUL_KOLONLARI]


# ── Ana fonksiyonlar ──────────────────────────────────────────────────────────

def get_user_by_username(kullanici_adi: str) -> dict | None:
    """
    SMSUIT_DAU.USERS tablosundan kullanıcıyı USER_NAME veya CODE ile arar.
    Döner: {kod, ad, sifre_enc, moduller}
    """
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()

        # 1. USER_NAME ile ara (kullanıcının login adı)
        cursor.execute(
            "SELECT CODE, EXPLANATION, USER_NAME, PASSWORD, ACTIVE "
            "FROM USERS WHERE USER_NAME = ?",
            (kullanici_adi,),
        )
        row = cursor.fetchone()

        # 2. CODE ile ara
        if not row:
            cursor.execute(
                "SELECT CODE, EXPLANATION, USER_NAME, PASSWORD, ACTIVE "
                "FROM USERS WHERE CODE = ?",
                (kullanici_adi,),
            )
            row = cursor.fetchone()

        # 3. Sıfır normalize edilmiş kod ile ara (001 → 1)
        if not row:
            normalized = _normalize_kod(kullanici_adi)
            if normalized != kullanici_adi:
                cursor.execute(
                    "SELECT CODE, EXPLANATION, USER_NAME, PASSWORD, ACTIVE "
                    "FROM USERS WHERE CODE = ?",
                    (normalized,),
                )
                row = cursor.fetchone()

        if not row:
            logger.warning("Kullanıcı bulunamadı: %s", kullanici_adi)
            return None

        kod    = _safe_str(row[0]).strip()
        ad     = _safe_str(row[1]).strip()
        active = row[4]

        if not _is_active(active):
            logger.warning("Pasif kullanıcı: %s", kullanici_adi)
            return None

        # PASSWORD sütunu bazen bytes döner — _safe_str ile normalize et
        sifre_enc = _safe_str(row[3]).strip()
        moduller  = _get_moduller(kod)

        return {
            "kod":       kod,
            "ad":        ad,
            "sifre_enc": sifre_enc,
            "moduller":  moduller,
        }
    finally:
        conn.close()


def verify_password(user: dict, girilen: str) -> bool:
    """
    Şifre doğrulama katmanları:
      1. Kullanıcı gerçek şifresini girer → GIGASOFT XOR ile encode → stored ile karşılaştır
      2. Kullanıcı ~ olmadan şifreli değeri girer → başına ~ ekle
      3. Kullanıcı tam şifreli değeri girer (~ ile)
      4. Byte-level karşılaştırma (latin-1 encoding ile)
      5. LOCAL_USERS .env override
    """
    girilen = girilen.strip()
    stored  = user["sifre_enc"]
    kod     = user["kod"]

    if stored:
        encoded = gigasoft_encode(girilen)

        # 1. Gerçek şifre → GIGASOFT encode → karşılaştır (ANA YÖNTEM)
        if encoded == stored:
            return True

        # 2. Kullanıcı ~ olmadan şifreli değeri yazdı
        if "~" + girilen == stored:
            return True

        # 3. Kullanıcı tam şifreli değeri yazdı (~ ile)
        if girilen == stored:
            return True

        # 4. Byte-level karşılaştırma: encoded ve stored'u latin-1 bytes olarak karşılaştır
        try:
            if encoded.encode("latin-1") == stored.encode("latin-1"):
                return True
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass

        logger.debug(
            "Şifre eşleşmedi (kod=%s) stored_len=%d encoded_len=%d",
            kod, len(stored), len(encoded),
        )

    # 5. LOCAL_USERS override — kod'un farklı formatlarını dene
    local    = _local_users()
    kod_norm = _normalize_kod(kod)
    for local_key, local_pass in local.items():
        if local_pass != girilen:
            continue
        if local_key in (kod, kod_norm) or _normalize_kod(local_key) == kod_norm:
            return True

    return False


def get_all_users() -> list[dict]:
    """Tüm kullanıcıları listeler (şifreler dahil edilmez)."""
    conn = get_smsuit_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT CODE, EXPLANATION, USER_NAME, ACTIVE FROM USERS ORDER BY CODE"
        )
        cols = [c[0] for c in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]
    finally:
        conn.close()
