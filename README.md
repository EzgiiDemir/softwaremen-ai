## 🚀 Projeyi Çalıştırma Adımları

### 🛠 Backend (FastAPI)

1.  **Dizine gidin:**
      - `cd backend`
2.  **Sanal ortam oluşturun (Sadece ilk sefer):**
      - `python -m venv .venv`
3.  **Sanal ortamı aktif edin:**
      - Windows: `.\.venv\Scripts\activate`
      - Mac/Linux: `source .venv/bin/activate`
4.  **Bağımlılıkları yükleyin:**
      - `pip install -r requirements.txt`
5.  **Sunucuyu başlatın:**
      - `uvicorn main:app --reload --port 8002`

### 💻 Frontend (Vite / React)

1.  **Dizine gidin:**
      - `cd frontend`
2.  **Paketleri yükleyin:**
      - `npm install`
3.  **Uygulamayı başlatın:**
      - `npm run dev`

-----

## 🔗 Bağlantılar

  - **Frontend:** [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173)
  - **API Dokümantasyonu (Swagger):** [http://localhost:8002/docs](https://www.google.com/search?q=http://localhost:8002/docs)

-----

## 🔑 .env Yapılandırması

`backend/` klasörü içinde bir `.env` dosyası oluşturun ve aşağıdaki bilgileri doldurun:

```env
GROQ_API_KEY=
JWT_SECRET=
DB_SERVER=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

-----
