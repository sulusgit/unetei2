from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from ..db import get_db
from ..auth import get_current_user
from ..models import User, Banner, BannerOrder, Invoice

router = APIRouter(prefix="/api/billing", tags=["billing"])

def iso_to_dt(s: str) -> datetime:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="Bad datetime format (use ISO8601)")

@router.post("/orders", status_code=201)
def create_order(
    banner_id: int = Form(...),
    side: str = Form(...),             
    start_at: str = Form(...),         
    end_at: str = Form(...),           
    price_cents: int = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if side not in ("left", "right"):
        raise HTTPException(status_code=400, detail="side must be left|right")
    sa, ea = iso_to_dt(start_at), iso_to_dt(end_at)
    if ea <= sa:
        raise HTTPException(status_code=400, detail="end_at must be after start_at")
    if price_cents <= 0:
        raise HTTPException(status_code=400, detail="price_cents must be > 0")

    b = db.query(Banner).filter(Banner.id == banner_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Banner not found")
    if b.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your banner")

    order = BannerOrder(
        user_id=user.id,
        banner_id=banner_id,
        side=side,
        start_at=sa,
        end_at=ea,
        price_cents=price_cents,
        status="pending"
    )
    db.add(order)
    db.flush()  

    inv = Invoice(
        order_id=order.id,
        amount_cents=price_cents,
        due_at=sa,
        status="open",
        note=None
    )
    db.add(inv)
    db.commit()
    db.refresh(order)
    db.refresh(inv)
    return {
        "order_id": order.id,
        "invoice_id": inv.id,
        "order_status": order.status,
        "invoice_status": inv.status
    }

@router.get("/orders")
def list_my_orders(
    status: Optional[str] = None,     
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(BannerOrder).filter(BannerOrder.user_id == user.id)
    if status:
        q = q.filter(BannerOrder.status == status)
    q = q.order_by(BannerOrder.created_at.desc())
    rows = q.all()
    return [{
        "id": r.id, "banner_id": r.banner_id, "side": r.side,
        "start_at": r.start_at, "end_at": r.end_at,
        "price_cents": r.price_cents, "status": r.status
    } for r in rows]

@router.get("/invoices")
def list_my_invoices(
    status: Optional[str] = None,     
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = (db.query(Invoice)
           .join(BannerOrder, BannerOrder.id == Invoice.order_id)
           .filter(BannerOrder.user_id == user.id))
    if status:
        q = q.filter(Invoice.status == status)
    q = q.order_by(Invoice.issued_at.desc())
    rows = q.all()
    return [{
        "id": r.id, "order_id": r.order_id, "amount_cents": r.amount_cents,
        "issued_at": r.issued_at, "due_at": r.due_at, "status": r.status, "note": r.note
    } for r in rows]

@router.post("/invoices/{invoice_id}/status")
def set_invoice_status(
    invoice_id: int,
    status: str = Form(...),          
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    inv = (db.query(Invoice)
             .join(BannerOrder, BannerOrder.id == Invoice.order_id)
             .filter(Invoice.id == invoice_id, BannerOrder.user_id == user.id)
             .first())
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if status not in ("open", "paid", "void"):
        raise HTTPException(status_code=400, detail="Bad status")

    inv.status = status
    db.flush()

    if status == "paid":
        order = db.query(BannerOrder).filter(BannerOrder.id == inv.order_id).first()
        if not order:
            raise HTTPException(status_code=500, detail="Order missing for invoice")

        order.status = "paid"
        b = db.query(Banner).filter(Banner.id == order.banner_id).first()
        if b:
            b.position = order.side
            b.start_at = order.start_at
            b.end_at = order.end_at
            b.status = "active"   

    elif status == "void":
        order = db.query(BannerOrder).filter(BannerOrder.id == inv.order_id).first()
        if order:
            order.status = "cancelled"

    db.commit()
    return {"ok": True, "invoice_status": inv.status}