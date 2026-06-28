from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from starlette.requests import Request as StarletteRequest
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Request
from app.schemas import RequestCreate, RequestStatusUpdate, RequestOut, PaginatedResponse
from app.auth import verify_admin, is_admin_request

router = APIRouter(prefix="/api/requests", tags=["requests"])


@router.get("", response_model=PaginatedResponse)
async def list_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=0, le=100),
    session: AsyncSession = Depends(get_session),
):
    query = select(Request)

    if status_filter:
        query = query.where(Request.status == status_filter)

    if priority:
        query = query.where(Request.priority == priority)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            Request.title.ilike(search_pattern) | Request.description.ilike(search_pattern)
        )

    count_q = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_q)
    total = total_result.scalar_one()

    priority_order = case(
        (Request.priority == "high", 1),
        (Request.priority == "normal", 2),
        (Request.priority == "low", 3),
        else_=4,
    )

    if sort_by == "priority":
        order_col = priority_order
    else:
        order_col = Request.created_at

    if sort_order == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    if page_size > 0:
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

    result = await session.execute(query)
    items = result.scalars().all()

    total_pages = max(1, (total + page_size - 1) // page_size) if page_size > 0 else 1

    return PaginatedResponse(
        items=[RequestOut.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(
    data: RequestCreate,
    session: AsyncSession = Depends(get_session),
):
    now = datetime.now(timezone.utc)
    req = Request(
        title=data.title,
        description=data.description,
        priority=data.priority,
        status="new",
        created_at=now,
        updated_at=now,
    )
    session.add(req)
    await session.commit()
    await session.refresh(req)
    return RequestOut.model_validate(req)


@router.patch("/{request_id}/status", response_model=RequestOut)
async def update_request_status(
    request_id: int,
    data: RequestStatusUpdate,
    request: StarletteRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Request).where(Request.id == request_id))
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    admin = await is_admin_request(request)

    if req.status == "done" and not admin:
        raise HTTPException(
            status_code=400,
            detail="Нельзя редактировать заявку в статусе 'done'. Обратитесь к администратору.",
        )

    if req.status == "done" and data.status != "done" and not admin:
        raise HTTPException(
            status_code=400,
            detail="Нельзя перевести заявку из статуса 'done' обратно. Обратитесь к администратору.",
        )

    req.status = data.status
    req.updated_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(req)
    return RequestOut.model_validate(req)


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_request(
    request_id: int,
    session: AsyncSession = Depends(get_session),
    _admin=Depends(verify_admin),
):
    result = await session.execute(select(Request).where(Request.id == request_id))
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    await session.delete(req)
    await session.commit()
    return None
