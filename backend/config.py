import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# SMSUIT SQL Server — iş verisi (stok, finans, servis...)
DB_SERVER   = os.getenv("DB_SERVER", "")
DB_NAME     = os.getenv("DB_NAME", "SMSUIT_DAU")
DB_USER     = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_TIMEOUT  = 10

# GIGASOFT SQL Server — birincil kullanıcı doğrulama
GIGASOFT_SERVER   = os.getenv("GIGASOFT_SERVER", "")
GIGASOFT_NAME     = os.getenv("GIGASOFT_NAME", "GIGASOFT")
GIGASOFT_USER     = os.getenv("GIGASOFT_USER", "sa")
GIGASOFT_PASSWORD = os.getenv("GIGASOFT_PASSWORD", "")

# GIGASOFT Access — yedek kullanıcı doğrulama
MDB_PATH     = os.getenv("MDB_PATH", "")
MDB_PASSWORD = os.getenv("MDB_PASSWORD", "")

# JWT
JWT_SECRET       = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGO         = "HS256"
JWT_EXPIRE_HOURS = 8

# Groq AI
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = "llama-3.3-70b-versatile"
