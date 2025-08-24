from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from .config import JWT_SECRET
from .db import get_db
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
ALGO = "HS256"

def create_token(user_id: int, minutes: int = 60*24*7) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": int(now.timestamp()), "exp": int((now + timedelta(minutes=minutes)).timestamp())}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGO)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    cred_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGO])
        uid = int(payload.get("sub", "0"))
    except (JWTError, ValueError):
        raise cred_exc
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise cred_exc
    return user