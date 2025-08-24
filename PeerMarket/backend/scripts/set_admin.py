import sys
from app.db import SessionLocal
from app.models import User

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 -m scripts.set_admin you@example.com")
        return
    email = sys.argv[1]
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == email).first()
        if not u:
            print("No such user")
            return
        u.is_admin = True
        db.commit()
        print(f"OK: {email} is now admin")
    finally:
        db.close()

if __name__ == "__main__":
    main()