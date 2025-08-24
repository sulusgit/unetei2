from sqlalchemy import (
    Column, BigInteger, Text, Numeric, Enum, ForeignKey,
    TIMESTAMP, func, Integer, Boolean, DateTime, Float, String
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

listing_status = PG_ENUM('active','sold','archived','expired', name='listing_status', create_type=False)

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    name = Column(Text)
    phone = Column(Text)
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Category(Base):
    __tablename__ = "categories"
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False)

class Listing(Base):
    __tablename__ = "listings"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    category_id = Column(BigInteger, ForeignKey("categories.id"))
    title = Column(Text, nullable=False)
    description = Column(Text)
    price = Column(Numeric(12,2), nullable=False)
    city = Column(Text)
    status = Column(listing_status, nullable=False, server_default='active')
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    is_reported = Column(Boolean, nullable=False, default=False)
    report_description = Column(Text, nullable=True)
    images = relationship("ListingImage", cascade="all, delete-orphan", back_populates="listing")

class ListingImage(Base):
    __tablename__ = "listing_images"
    id = Column(BigInteger, primary_key=True)
    listing_id = Column(BigInteger, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    sort_order = Column(Integer, nullable=False, server_default="0")
    listing = relationship("Listing", back_populates="images")

class Favorite(Base):
    __tablename__ = "favorites"
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    listing_id = Column(BigInteger, ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Report(Base):
    __tablename__ = "reports"
    id = Column(BigInteger, primary_key=True)
    listing_id = Column(BigInteger, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(BigInteger, ForeignKey("users.id"))
    reason = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Banner(Base):
    __tablename__ = "banners"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    image_url = Column(Text, nullable=False)
    target_url = Column(Text, nullable=False)
    position = Column(Text, nullable=False)
    start_at = Column(TIMESTAMP(timezone=True), nullable=False)
    end_at = Column(TIMESTAMP(timezone=True), nullable=False)
    status = Column(Text, nullable=False)
    impressions = Column(BigInteger, nullable=False)
    clicks = Column(BigInteger, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class BannerOrder(Base):
    __tablename__ = "banner_orders"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    banner_id = Column(BigInteger, ForeignKey("banners.id"))
    side = Column(Text, nullable=False)
    start_at = Column(TIMESTAMP(timezone=True), nullable=False)
    end_at = Column(TIMESTAMP(timezone=True), nullable=False)
    price_cents = Column(Integer, nullable=False)
    status = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(BigInteger, primary_key=True)
    order_id = Column(BigInteger, ForeignKey("banner_orders.id", ondelete="CASCADE"), nullable=False)
    amount_cents = Column(Integer, nullable=False)
    issued_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    due_at = Column(TIMESTAMP(timezone=True), nullable=False)
    status = Column(Text, nullable=False)
    note = Column(Text)