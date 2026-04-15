# Softwaremen AI Asistan

Groq (llama-3.3-70b) destekli, JWT kimlik doğrulamalı, çok müşterili ERP yapay zeka asistanı.

## Kurulum

### Gereksinimler
- Python 3.11+
- Node.js 18+
- SQL Server (opsiyonel — yoksa mock data kullanılır)
- ODBC Driver 17 for SQL Server (DB bağlantısı için)

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

`.env` dosyasını düzenle:
```
GROQ_API_KEY=<groq_api_key>
JWT_SECRET=<guclu_rastgele_deger>
DB_SERVER=localhost
DB_NAME=
DB_USER=
DB_PASSWORD=<sifre>
```

### Frontend
```bash
cd frontend
npm install
```

`frontend/.env` dosyasını düzenle:
```
VITE_API_URL=http://localhost:8002
```

---

## Çalıştırma

**Backend:**
```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8002
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Tarayıcı: `http://localhost:5173`  
API Docs: `http://localhost:8002/docs`

---

## Modüller

| Modül | Açıklama |
|---|---|
| StockMan | Stok yönetimi |
| FinanceMan | Finans & kasa |
| AccountMan | Muhasebe |
| ServiceMan | Teknik servis |
| ProductMan | Üretim |
| BarcodeMan | Barkod & etiket |
| WageMan | İnsan kaynakları |
| POS | Satış noktası |
| smProposal | Teklif yönetimi |
| smLoyalty | Sadakat programı |
| smImports | İthalat |
| smGrocery | Müstahsil |

---

## Yeni Müşteri Ekleme

`backend/main.py` içindeki `MUSTERILER` ve `SIFRELER` sözlüklerine ekle:

```python
MUSTERILER["yeni_musteri"] = {
    "ad": "Yeni Firma A.Ş.",
    "modul_erisim": ["stockman", "financeman", "pos"],
}
SIFRELER["yeni_musteri"] = "guclu_sifre_123"
```

---

## DB Bağlantısı

`backend/.env` dosyasındaki `DB_*` değişkenlerini doldur.  
Bağlantı başarılı olursa `/health` endpoint'i `"db": "connected"` döner.  
Başarısız olursa mock data kullanılmaya devam eder, sistem çalışmaya devam eder.

Yeni modüller için `backend/db.py` içine getter fonksiyonu ekle ve `DB_GETTERS` haritasına kaydet.

---

## Production Deploy

### Backend (örnek — systemd)
```ini
[Unit]
Description=Softwaremen AI Backend

[Service]
WorkingDirectory=/opt/softwaremen/backend
ExecStart=/opt/softwaremen/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8002
Restart=always

[Install]
WantedBy=multi-user.target
```

### Frontend (örnek — Nginx)
```bash
npm run build
# dist/ klasörünü Nginx root olarak ayarla
```

`frontend/.env` içinde production URL'sini güncelle:
```
VITE_API_URL=https://api.softwaremen.com
```
