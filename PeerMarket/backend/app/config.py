import os

DB_DSN = os.getenv("DB_DSN", "postgresql://postgres:Password@localhost:5433/peermarket")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "uploads"))
FROM_EMAIL = os.getenv("FROM_EMAIL", "no-reply@peermarket.local")