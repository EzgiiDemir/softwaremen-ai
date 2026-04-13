🚀 Nasıl Çalıştırılır?
Backend:
cd backend
python -m venv .venv (İlk sefer için)
source .venv/bin/activate (veya Windows: .\.venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload --port 8002

Frontend:
cd frontend
npm install
npm run dev

Bağlantılar:
Frontend: http://localhost:5173
API Dokümantasyonu: http://localhost:8002/docs

.env: GROQ_API_KEY=
JWT_SECRET=
DB_SERVER=
DB_NAME=
DB_USER=
DB_PASSWORD=

