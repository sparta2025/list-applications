from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint

from app.database import Base


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="new")
    priority = Column(String(10), nullable=False, default="normal")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("length(title) >= 3", name="title_min_length"),
        CheckConstraint("status IN ('new', 'in_progress', 'done')", name="valid_status"),
        CheckConstraint("priority IN ('low', 'normal', 'high')", name="valid_priority"),
    )
