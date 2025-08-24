from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..utils.security import hash_password, verify_password
from ..auth import create_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

def _norm_email(s: str) -> str:
    return (s or "").strip().lower()

@router.post("/register")
def register(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(None),
    phone: str = Form(None),
    db: Session = Depends(get_db)
):
    email_n = _norm_email(email)
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password too short")
    existing = db.query(User).filter(User.email == email_n).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    u = User(email=email_n, password_hash=hash_password(password), name=(name or "").strip() or None, phone=(phone or "").strip() or None)
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "email": u.email, "name": u.name, "is_admin": u.is_admin}

@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    email_n = _norm_email(email)
    u = db.query(User).filter(User.email == email_n).first()
    if not u or not verify_password(password, u.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_token(u.id)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}