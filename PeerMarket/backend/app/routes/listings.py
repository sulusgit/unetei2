from datetime import datetime, timedelta, timezone
from typing import List, Optional
import os

from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from jose import jwt, JWTError

from ..db import get_db
from ..models import Listing, ListingImage, User
from ..auth import get_current_user
from ..services.images import save_image, delete_image_by_url
from ..utils.pagination import paginate

router = APIRouter(prefix="/api/listings", tags=["listings"])

def default_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=30)

ALGO = "HS256"
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

POST_COOLDOWN_SECONDS = 30

@router.post("", status_code=201)
def create_listing(
    title: str = Form(...),
    description: str = Form(""),
    price: float = Form(0.0),
    category_id: Optional[int] = Form(None),
    city: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Title required")
    if len(title) > 140:
        raise HTTPException(status_code=400, detail="Title too long")
    if description and len(description) > 5000:
        raise HTTPException(status_code=400, detail="Description too long")
    if price is not None and price < 0:
        raise HTTPException(status_code=400, detail="Invalid price")

    last = (
        db.query(Listing)
        .filter(Listing.user_id == user.id)
        .order_by(Listing.created_at.desc())
        .limit(1)
        .first()
    )
    if last:
        now_db = db.query(func.now()).scalar() 
        delta = (now_db - last.created_at).total_seconds()
        if delta < POST_COOLDOWN_SECONDS:
            raise HTTPException(status_code=429, detail="Too many listings, slow down")

    listing = Listing(
        user_id=user.id,
        category_id=category_id,
        title=title.strip(),
        description=description.strip(),
        price=price if price is not None else 0,
        city=city.strip() if city else None,
        expires_at=default_expiry(),
    )
    db.add(listing)
    db.flush()  

    for idx, f in enumerate(images[:8]):  
        _, url = save_image(f)
        db.add(ListingImage(listing_id=listing.id, url=url, sort_order=idx))

    db.commit()
    db.refresh(listing)
    return {"id": listing.id}

@router.get("/renew")
def renew_via_token(token: str, db: Session = Depends(get_db)):
    """
    Public endpoint hit from email: /api/listings/renew?token=...
    Token payload: { action:'renew', listing_id, exp }
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGO])
        if payload.get("action") != "renew":
            raise HTTPException(status_code=400, detail="Invalid action")
        listing_id = int(payload.get("listing_id", 0))
    except (JWTError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")

    l.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    if l.status == "expired":
        l.status = "active"
    db.commit()

    return {"ok": True, "message": "Listing kept live for 30 more days.", "listing_id": l.id}

@router.get("")
def list_listings(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="search text"),
    category_id: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    qry = db.query(Listing).filter(Listing.status == "active")

    if category_id:
        qry = qry.filter(Listing.category_id == category_id)
    if city:
        qry = qry.filter(Listing.city == city)
    if min_price is not None:
        qry = qry.filter(Listing.price >= min_price)
    if max_price is not None:
        qry = qry.filter(Listing.price <= max_price)
    if q:
        like = f"%{q.strip()}%"
        qry = qry.filter(or_(Listing.title.ilike(like), Listing.description.ilike(like)))

    if sort == "newest":
        qry = qry.order_by(Listing.created_at.desc())
    elif sort == "price_asc":
        qry = qry.order_by(Listing.price.asc())
    elif sort == "price_desc":
        qry = qry.order_by(Listing.price.desc())

    rows, meta = paginate(qry, page, page_size)

    data = [
        {
            "id": l.id,
            "title": l.title,
            "price": float(l.price),
            "city": l.city,
            "created_at": l.created_at,
            "images": [img.url for img in l.images],
        }
        for l in rows
    ]

    return {"items": data, "meta": meta}

@router.get("/{listing_id}")
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")

    owner = db.query(User).filter(User.id == l.user_id).first()

    return {
        "id": l.id,
        "title": l.title,
        "description": l.description,
        "price": float(l.price),
        "city": l.city,
        "status": l.status,
        "created_at": l.created_at,
        "expires_at": l.expires_at,
        "images": [img.url for img in l.images],
        "owner": {
            "id": owner.id if owner else None,
            "name": owner.name if owner else None,
            "email": owner.email if owner else None,
            "phone": owner.phone if owner else None,
        }
    }

@router.delete("/{listing_id}")
def archive_listing(listing_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    if l.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    l.status = "archived"
    db.commit()
    return {"ok": True}


@router.patch("/{listing_id}")
def edit_listing(
    listing_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category_id: Optional[int] = Form(None),
    city: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    if l.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    if title is not None:
        t = title.strip()
        if not t:
            raise HTTPException(status_code=400, detail="Title required")
        if len(t) > 140:
            raise HTTPException(status_code=400, detail="Title too long")
        l.title = t
    if description is not None:
        if len(description) > 5000:
            raise HTTPException(status_code=400, detail="Description too long")
        l.description = description.strip()
    if price is not None:
        if price < 0:
            raise HTTPException(status_code=400, detail="Invalid price")
        l.price = price
    if category_id is not None:
        l.category_id = category_id
    if city is not None:
        l.city = city.strip() if city else None

    db.commit()
    return {"ok": True}

@router.post("/{listing_id}/status")
def set_listing_status(
    listing_id: int,
    status: str = Form(...),  
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if status not in ("active", "sold", "archived"):
        raise HTTPException(status_code=400, detail="Bad status")
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    if l.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")
    l.status = status
    db.commit()
    return {"ok": True, "status": status}

@router.post("/{listing_id}/renew")
def renew_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    if l.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    l.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    if l.status == "expired":
        l.status = "active"
    db.commit()
    return {"ok": True, "expires_at": l.expires_at}

@router.post("/{listing_id}/images")
def add_images(
    listing_id: int,
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    if l.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    current_count = db.query(ListingImage).filter(ListingImage.listing_id == listing_id).count()
    max_new = max(0, 8 - current_count)
    for idx, f in enumerate(images[:max_new]):
        _, url = save_image(f)
        db.add(ListingImage(listing_id=listing_id, url=url, sort_order=current_count + idx))
    db.commit()
    return {"ok": True}


@router.delete("/{listing_id}/images/{image_id}")
def delete_image(
    listing_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    img = (
        db.query(ListingImage)
        .join(Listing, Listing.id == ListingImage.listing_id)
        .filter(ListingImage.id == image_id, Listing.id == listing_id)
        .first()
    )
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    if img.listing.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your image")
    public_url = img.url
    db.delete(img)
    db.commit()
    delete_image_by_url(public_url)
    return {"ok": True}