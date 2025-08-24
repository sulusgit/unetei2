#!/usr/bin/env python3
"""
Expire active listings whose expires_at < now.
Usage:  python3 scripts/expire_listings.py
Run from backend/ folder with venv activated.
"""
import os, sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "app"))

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.services.keepalive import expire_past_dues

def main():
    db: Session = SessionLocal()
    try:
        n = expire_past_dues(db)
        print(f"Expired {n} listing(s)")
    finally:
        db.close()

if __name__ == "__main__":
    main()