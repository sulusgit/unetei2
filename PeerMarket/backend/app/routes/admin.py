from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..db import get_db
from ..auth import get_current_user
from ..models import User, Banner, Listing
import os, smtplib
from email.message import EmailMessage

router = APIRouter(prefix="/api/admin", tags=["admin"])

def require_admin(user: User = Depends(get_current_user)):
    if not getattr(user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin only")
    return user

def send_email(to_email: str, subject: str, body: str):
    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    pwd  = os.getenv("SMTP_PASS", "")
    sender = os.getenv("SMTP_SENDER", user or "no-reply@peermarket.local")
    if not host or not user or not pwd:
        print("[email] skipped; SMTP not configured")
        return
    msg = EmailMessage()
    msg["From"] = sender; msg["To"] = to_email; msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(host, port) as s:
        s.starttls(); s.login(user, pwd); s.send_message(msg)

@router.get("/reports")
def admin_list_reported_listings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    rows = (
        db.query(Listing)
        .filter(Listing.is_reported == True)
        .order_by(desc(Listing.created_at))
        .all()
    )
    return {"items": [{
        "id": l.id,
        "title": l.title,
        "price": l.price,
        "city": l.city,
        "created_at": l.created_at,
        "reason": l.report_description or "",
        "status": l.status
    } for l in rows]}

@router.post("/reports/{listing_id}/dismiss")
def admin_dismiss_reported(
    listing_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")
    l.is_reported = False
    l.report_description = None
    db.commit()
    return {"ok": True}

@router.post("/reports/{listing_id}/deactivate")
def admin_deactivate_reported(
    listing_id: int,
    reason: str = Form(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")
    l.status = "archived"
    l.is_reported = False
    l.report_description = reason[:1000]
    db.commit()

    owner = db.query(User).filter(User.id == l.user_id).first()
    if owner and owner.email:
        subject = f"Your listing #{l.id} was deactivated"
        body = (
            f"Hello,\n\n"
            f"Your listing (ID {l.id}, '{l.title}') was deactivated by admin.\n\n"
            f"Reason:\n{reason}\n\n"
            f"- PeerMarket"
        )
        try: send_email(owner.email, subject, body)
        except Exception as e: print("[email] failed:", e)

    return {"ok": True, "listing_id": l.id, "status": l.status}

@router.get("/banners/pending")
def admin_banners_pending(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(Banner).filter(Banner.status == "draft").order_by(desc(Banner.created_at)).all()
    return {"items": [{
        "id": b.id, "user_id": b.user_id, "image_url": b.image_url,
        "target_url": b.target_url, "position": b.position,
        "start_at": b.start_at, "end_at": b.end_at, "status": b.status
    } for b in rows]}

@router.post("/banners/{banner_id}/approve")
def admin_banner_approve(banner_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    b = db.query(Banner).filter(Banner.id == banner_id).first()
    if not b: raise HTTPException(status_code=404, detail="Banner not found")
    b.status = "approved"; db.commit()
    return {"ok": True, "status": b.status}

@router.post("/banners/{banner_id}/reject")
def admin_banner_reject(banner_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    b = db.query(Banner).filter(Banner.id == banner_id).first()
    if not b: raise HTTPException(status_code=404, detail="Banner not found")
    b.status = "rejected"; db.commit()
    return {"ok": True, "status": b.status}