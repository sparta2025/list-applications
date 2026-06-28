from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class RequestCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    priority: str = Field(default="normal")

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in ("low", "normal", "high"):
            raise ValueError("priority must be one of: low, normal, high")
        return v


class RequestStatusUpdate(BaseModel):
    status: str = Field(...)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("new", "in_progress", "done"):
            raise ValueError("status must be one of: new, in_progress, done")
        return v


class RequestOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedResponse(BaseModel):
    items: list[RequestOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class LoginResponse(BaseModel):
    ok: bool
    message: str


class ErrorResponse(BaseModel):
    detail: str
