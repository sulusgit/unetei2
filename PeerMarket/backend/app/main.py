import os
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from .routes.users import router as auth_router
from .routes.categories import router as cat_router
from .routes.listings import router as list_router
from .routes.me import router as me_router
from .routes.banners import router as banners_router
from .routes.billing import router as billing_router
from .routes.favorites import router as favorites_router
from .routes.reports import router as reports_router
from .routes.admin import router as admin_router

from .db import get_db  

app = FastAPI(title="Peermarket")

app.include_router(auth_router)
app.include_router(cat_router)
app.include_router(list_router)
app.include_router(me_router)
app.include_router(banners_router)
app.include_router(billing_router)
app.include_router(favorites_router)
app.include_router(reports_router)
app.include_router(admin_router)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

_BASE_DIR = os.path.dirname(__file__)
_FRONTEND_DIR = os.path.abspath(os.path.join(_BASE_DIR, "../../frontend"))
_ASSETS_DIR = os.path.join(_FRONTEND_DIR, "assets")

app.mount("/assets", StaticFiles(directory=_ASSETS_DIR), name="assets")

app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="frontend")

@app.get("/health", include_in_schema=False)
def health():
    return {"ok": True}

@app.get("/health/db", include_in_schema=False)
def db_health(db=Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"db": "ok"}
    except Exception as e:
        return {"db": "error", "detail": str(e)}