from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from ..db import get_db
from ..auth import get_current_user
from ..models import Listing, User

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("")
def create_report(
    listing_id: int = Form(...),
    reason: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)  
):
    lst = db.query(Listing).filter(Listing.id == listing_id).first()
    if not lst:
        raise HTTPException(status_code=404, detail="Listing not found")

    lst.is_reported = True
    if reason:
        lst.report_description = reason[:1000]
    db.commit()
    return {"ok": True}