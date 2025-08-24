#!/usr/bin/env python3
"""
Send 7-day keep-alive digest emails to users who have active listings expiring within 7 days.
Usage:  python3 scripts/send_keepalive.py
Run from backend/ folder with venv activated.
"""
import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "app"))

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import User, Listing
from app.services.keepalive import build_keepalive_digest, create_keep_link
from app.services.emailer import send_email

def main():
    db: Session = SessionLocal()
    try:
        digest = build_keepalive_digest(db)
        for user_id, listings in digest.items():
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.email:
                continue
            rows = []
            for l in listings:
                link = create_keep_link(l.id)
                rows.append(f"<li>{l.title} (expires {l.expires_at.date()}) — <a href='{link}'>Keep Live</a></li>")
            html = f"""
                <h3>Your listings are nearing expiry</h3>
                <p>Click “Keep Live” within 3 days to keep them online. Otherwise they will auto-expire.</p>
                <ul>{''.join(rows)}</ul>
            """
            send_email(user.email, "Peermarket: keep your listings live", html, text_body="")
            print(f"Sent keep-alive to {user.email}: {len(listings)} item(s)")
    finally:
        db.close()

if __name__ == "__main__":
    main()