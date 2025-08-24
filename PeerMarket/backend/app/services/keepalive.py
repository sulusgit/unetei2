from datetime import datetime, timedelta, timezone
from typing import Dict, List
from sqlalchemy.orm import Session
from jose import jwt
import os

from ..models import Listing, User
from ..db import get_db  

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
ALGO = "HS256"

KEEPALIVE_WINDOW_DAYS = 7       
GRACE_CLICK_DAYS = 3            
RENEW_EXTEND_DAYS = 30          

def _now():
    return datetime.now(timezone.utc)

def build_keepalive_digest(db: Session) -> Dict[int, List[Listing]]:
    """
    Return {user_id: [listings nearing expiry]} for ACTIVE listings with expires_at <= now+7d
    """
    soon = _now() + timedelta(days=KEEPALIVE_WINDOW_DAYS)
    rows = (db.query(Listing)
              .filter(Listing.status == 'active', Listing.expires_at <= soon)
              .order_by(Listing.user_id, Listing.expires_at.asc())
              .all())
    result: Dict[int, List[Listing]] = {}
    for l in rows:
        result.setdefault(l.user_id, []).append(l)
    return result

def create_keep_link(listing_id: int) -> str:
    exp = _now() + timedelta(days=GRACE_CLICK_DAYS)
    token = jwt.encode(
        {"action": "renew", "listing_id": listing_id, "exp": int(exp.timestamp())},
        JWT_SECRET, algorithm=ALGO
    )
    return f"http://127.0.0.1:8000/api/listings/renew?token={token}"

def renew_listing_by_id(db: Session, listing_id: int) -> bool:
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l:
        return False
    l.expires_at = _now() + timedelta(days=RENEW_EXTEND_DAYS)
    if l.status == 'expired':
        l.status = 'active'
    db.commit()
    return True

def expire_past_dues(db: Session) -> int:
    """
    Set status='expired' for active listings with expires_at < now.
    Returns number of listings expired.
    """
    now = _now()
    rows = (db.query(Listing)
              .filter(Listing.status == 'active', Listing.expires_at < now)
              .all())
    count = 0
    for l in rows:
        l.status = 'expired'
        count += 1
    if count:
        db.commit()
    return count