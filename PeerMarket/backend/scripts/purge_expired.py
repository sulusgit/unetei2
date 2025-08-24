#!/usr/bin/env python3
"""
Remove listings that have status='expired' and expired more than 90 days ago.
Deletes listing_images files from disk and DB rows.
Run: python3 -m scripts.purge_expired
"""
import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Listing, ListingImage
from app.services.images import delete_image_by_url

def main():
    db: Session = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        olds = (db.query(Listing).filter(Listing.status == 'expired', Listing.expires_at < cutoff).all())
        removed = 0
        for l in olds:
            imgs = db.query(ListingImage).filter(ListingImage.listing_id == l.id).all()
            for img in imgs:
                delete_image_by_url(img.url)
            db.delete(l)
            removed += 1
        if removed:
            db.commit()
        print(f"Purged {removed} listing(s)")
    finally:
        db.close()

if __name__ == "__main__":
    main()