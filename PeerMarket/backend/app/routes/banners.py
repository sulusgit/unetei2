from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from ..db import get_db
from ..auth import get_current_user
from ..models import Banner, User
import os, shutil, uuid

router = APIRouter(prefix="/api/banners", tags=["banners"])

UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), "..", "uploads")
BANNER_DIR = os.path.abspath(os.path.join(UPLOAD_ROOT, "banners"))
os.makedirs(BANNER_DIR, exist_ok=True)

def _save_banner_file(f: UploadFile) -> str:
    ext = os.path.splitext(f.filename or "")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Only jpg/png/webp are allowed")
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(BANNER_DIR, name)
    with open(path, "wb") as out:
        shutil.copyfileobj(f.file, out)
    return f"/uploads/banners/{name}"  

@router.post("", summary="Create a banner (user → pending/approval)")
def create_banner(
    position: str = Form(...),            
    target_url: str = Form(...),
    start_at: str = Form(...),            
    end_at: str = Form(...),              
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pos = (position or "").lower()
    if pos not in ("left", "right"):
        raise HTTPException(status_code=400, detail="position must be left or right")
    try:
        start_dt = datetime.fromisoformat(start_at)
        end_dt = datetime.fromisoformat(end_at)
        if end_dt <= start_dt:
            raise ValueError
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date range")

    image_url = _save_banner_file(image)

    b = Banner(
        user_id=user.id,
        position=pos,
        target_url=target_url.strip(),
        image_url=image_url,
        start_at=start_dt,
        end_at=end_dt,
        status="draft",  
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return {
        "ok": True,
        "banner": {
            "id": b.id,
            "image_url": b.image_url,
            "target_url": b.target_url,
            "position": b.position,
            "start_at": b.start_at,
            "end_at": b.end_at,
            "status": b.status,
        },
        "message": "Submitted. Awaiting admin approval."
    }

@router.get("/mine")
def my_banners(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Banner).filter(Banner.user_id == user.id).order_by(desc(Banner.created_at)).all()
    return {"items": [{
        "id": b.id,
        "image_url": b.image_url,
        "target_url": b.target_url,
        "position": b.position,
        "start_at": b.start_at,
        "end_at": b.end_at,
        "status": b.status
    } for b in rows]}

@router.get("/serve", summary="Serve an active banner for a given position")
def serve_banner(position: str, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    b = (
        db.query(Banner)
        .filter(
            Banner.position == position,
            Banner.status == "approved",
            (Banner.start_at == None) | (Banner.start_at <= now),
            (Banner.end_at == None) | (Banner.end_at >= now),
        )
        .order_by(Banner.created_at.desc())
        .first()
    )
    if not b:
        return {"banner": None}
    return {
        "banner": {
            "id": b.id,
            "image_url": b.image_url,
            "target_click_url": b.target_url,
            "position": b.position,
        }
    }