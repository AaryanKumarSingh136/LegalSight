import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import APP_TITLE, APP_DESCRIPTION, APP_VERSION, CORS_ORIGINS
from app.db.database import engine, Base, SessionLocal
from app.services.auth_service import AuthService

# Routers
from app.api.auth import router as auth_router
from app.api.contracts import router as contracts_router
from app.api.analysis import router as analysis_router
from app.api.audit import router as audit_router
from app.api.search import router as search_router
from app.api.smart_contracts import router as smart_contracts_router
from app.api.admin import router as admin_router
from app.api.reports import router as reports_router
from app.api.precedents import router as precedents_router
from app.api.knowledge_graph import router as kg_router
from app.api.export import router as export_router
from app.api.ws import router as ws_router
from app.api.datasets import router as datasets_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed demo accounts
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        AuthService.seed_demo_users(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(contracts_router)
app.include_router(analysis_router)
app.include_router(audit_router)
app.include_router(search_router)
app.include_router(smart_contracts_router)
app.include_router(admin_router)
app.include_router(reports_router)
app.include_router(precedents_router)
app.include_router(kg_router)
app.include_router(export_router)
app.include_router(ws_router)
app.include_router(datasets_router)

@app.get("/")
def root_status():
    return {
        "status": "ONLINE",
        "service": APP_TITLE,
        "version": APP_VERSION,
        "docs": "/docs",
        "timestamp": "2026-09-07T21:40:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
