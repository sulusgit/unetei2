from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..auth import get_current_user
from ..models import Favorite, Listing, User

router = APIRouter(prefix="/api/favorites", tags=["favorites"])

@router.post("/{listing_id}", status_code=201)
def add_favorite(listing_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Listing not found")
    ex = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.listing_id == listing_id).first()
    if ex:
        return {"ok": True}
    db.add(Favorite(user_id=user.id, listing_id=listing_id))
    db.commit()
    return {"ok": True}

@router.delete("/{listing_id}")
def remove_favorite(listing_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ex = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.listing_id == listing_id).first()
    if not ex:
        return {"ok": True}
    db.delete(ex)
    db.commit()
    return {"ok": True}

@router.get("")
def list_my_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    favs = (db.query(Favorite, Listing)
              .join(Listing, Listing.id == Favorite.listing_id)
              .filter(Favorite.user_id == user.id)
              .order_by(Favorite.created_at.desc())
              .all())
    out = []
    for fav, l in favs:
        out.append({
            "id": l.id,
            "title": l.title,
            "price": float(l.price),
            "status": l.status,
            "created_at": l.created_at,
            "images": [img.url for img in l.images]
        })
    return {"items": out}