from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL

client = Groq(api_key=GROQ_API_KEY)

SISTEM_PROMPTU = """Sen Softwaremen ERP sisteminin yapay zeka asistanısın.

DİL KURALLARI:
Ana dilin Türkçedir, Türkçeyi anadil seviyesinde kullanırsın.
Noktalama işaretlerini eksiksiz ve doğru kullanırsın.
Resmi ama sıcak bir dil kullanırsın.
Kullanıcı adını biliyorsan zaman zaman kullanırsın.

FORMAT KURALLARI — KESİNLİKLE UYULMASI ZORUNLU:
1. YASAK: Hiçbir koşulda yıldız (*) veya çift yıldız (**) kullanma. Madde işareti olarak da kullanma.
2. YASAK: Diyez (# ## ###) kullanma.
3. Madde işareti olarak sadece tire (-) veya numara (1. 2. 3.) kullan.
4. Vurgu için büyük harf kullan (örn: ÖNEMLİ) ya da hiç kullanma.
5. Normal yanıtları kısa paragraflar ya da numaralı liste olarak yaz.
6. Tablo dışında boru (|) karakteri kullanma.

TABLO KURALLARI — TABLO İSTENİRSE KESİNLİKLE BU FORMAT:
Satır 1 (başlık): | Sütun Adı | Sütun Adı | Sütun Adı |
Satır 2 (ayraç) : | --- | --- | --- |
Sonraki satırlar: | değer | değer | değer |
Tablo öncesi ve sonrası tek cümle açıklama yaz.
UYARI: Tablo yerine madde listesi veya düz metin YAZMA. Sadece yukarıdaki boru formatını kullan.

SAYI FORMATI:
125400 → 125.400 TL şeklinde yaz.
0.15 → yüzde 15 şeklinde yaz.
2026-04-17 → 17 Nisan 2026 şeklinde yaz.

YETENEK SETİ:
Veri analizi yapar, trend bulur, karşılaştırma yapar, tahmin üretir, rapor oluşturur, tablo çizer, özet çıkarır ve aksiyon önerisi verir.
Veriler eksik ya da hatalıysa mevcut bilgiyle en iyi tahmini yapar.
Her yanıtın sonunda gerekiyorsa bir sonraki adım önerir."""

_MODUL_EKLERI = {
    "stockman":   "Stok yönetimi, ürün hareketleri, depo durumu ve tedarik konularında uzmansın.",
    "financeman": "Kasa, banka, cari hesap, çek ve fatura yönetimi konularında uzmansın.",
    "accountman": "Hesap planı, yevmiye, KDV ve muhasebe işlemleri konularında uzmansın.",
    "serviceman": "Teknik servis çağrıları, garanti takibi ve servis raporları konularında uzmansın.",
    "wageman":    "Personel yönetimi, bordro, izin takibi ve İK süreçleri konularında uzmansın.",
    "genel":      "Tüm ERP modülleri hakkında genel bilgiye sahipsin.",
}

_TIP_PROMPT_EKI = {
    "tablo": (
        "ZORUNLU: Yanıtını SADECE Markdown pipe tablo formatında ver. Madde listesi veya düz metin YAZMA.\n"
        "Kesinlikle şu formatı kullan:\n"
        "| Başlık 1 | Başlık 2 | Başlık 3 |\n"
        "| --- | --- | --- |\n"
        "| değer | değer | değer |\n"
        "Tablodan önce tek cümle giriş, tablodan sonra tek cümle yorum yaz."
    ),
    "rapor": (
        "Yanıtını şu yapıda yaz, her bölüm başında etiket kullan:\n\n"
        "ÖZET:\nKısa özet buraya.\n\n"
        "BULGULAR:\n1. Birinci bulgu\n2. İkinci bulgu\n\n"
        "SONUÇ:\nSonuç cümlesi.\n\n"
        "ÖNERİ:\nAksiyon önerisi."
    ),
    "karsilastirma": (
        "Karşılaştırmayı tablo olarak göster veya numara sıralamasıyla yap. "
        "Farkları ve yüzde değişimleri mutlaka belirt."
    ),
    "tahmin": (
        "Mevcut veriyi analiz et ve gelecek 30 günlük projeksiyon yap. "
        "Varsayımlarını 1. 2. 3. şeklinde listele. "
        "İyimser ve gerçekçi senaryo sun."
    ),
}


def yanit_tipi_tespit(soru: str) -> str:
    s = soru.lower()
    if any(k in s for k in ["tablo", "listele", "sırala", "göster", "liste"]):
        return "tablo"
    if any(k in s for k in ["rapor", "raporu", "özet rapor", "analiz raporu"]):
        return "rapor"
    if any(k in s for k in ["excel", "indir", "dışa aktar", "export"]):
        return "export_excel"
    if any(k in s for k in ["pdf", "yazdır", "çıktı al"]):
        return "export_pdf"
    if any(k in s for k in ["karşılaştır", "fark", "geçen ay", "önceki"]):
        return "karsilastirma"
    if any(k in s for k in ["tahmin", "projeksiyon", "önümüzdeki", "gelecek"]):
        return "tahmin"
    return "sohbet"


def ai_sor(soru: str, modul: str, veri: dict | list, kullanici_ad: str = "") -> str:
    modul_eki = _MODUL_EKLERI.get(modul, _MODUL_EKLERI["genel"])
    tip       = yanit_tipi_tespit(soru)
    tip_eki   = _TIP_PROMPT_EKI.get(tip, "")
    kullanici = f"Kullanıcı adı: {kullanici_ad}\n" if kullanici_ad else ""

    prompt = (
        f"{SISTEM_PROMPTU}\n\n"
        f"Modül: {modul.upper()} — {modul_eki}\n"
        f"{kullanici}"
        f"Mevcut veri:\n{veri}\n\n"
        f"{tip_eki}\n\n"
        f"Soru: {soru}"
    )

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
