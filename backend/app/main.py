import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import BACKEND_PORT, FRONTEND_PORT
from app.database import init_db
from app.auth import verify_admin
from app.routes.requests import router as requests_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Учёт заявок",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://localhost:{FRONTEND_PORT}", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requests_router)


@app.get("/api/auth/login")
async def login(admin=Depends(verify_admin)):
    return {"ok": True, "message": "Успешная авторизация"}
