from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Category

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("")
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Category).order_by(Category.name).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in rows]