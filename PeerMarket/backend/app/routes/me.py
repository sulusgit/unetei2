from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..db import get_db
from ..auth import get_current_user
from ..models import Listing, User
from ..utils.pagination import paginate

router = APIRouter(prefix="/api/me", tags=["me"])

@router.get("/listings")
def my_listings(
    status: Optional[str] = Query(None, pattern="^(active|sold|archived|expired)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    qry = db.query(Listing).filter(Listing.user_id == user.id)
    if status:
        qry = qry.filter(Listing.status == status)
    qry = qry.order_by(Listing.created_at.desc())
    rows, meta = paginate(qry, page, page_size)
    data = [{
        "id": l.id, "title": l.title, "price": float(l.price),
        "status": l.status, "created_at": l.created_at, "expires_at": l.expires_at
    } for l in rows]
    return {"items": data, "meta": meta}