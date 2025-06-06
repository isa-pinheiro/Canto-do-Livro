from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from back_end.models.base import Base, engine
from back_end.routes import auth, bookshelf, users
import os
from datetime import datetime

# Create database tables
Base.metadata.create_all(bind=engine)

# Create uploads directory if it doesn't exist
os.makedirs("uploads/profile_pictures", exist_ok=True)

app = FastAPI(
    title="Canto do Livro API",
    description="API para gerenciamento de estante de livros",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite requisições de qualquer origem durante o desenvolvimento
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos HTTP
    allow_headers=["*"],
    expose_headers=["*"]
)

# Mount static files
app.mount("/api/static", StaticFiles(directory="uploads"), name="static")

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(bookshelf.router, prefix="/api")
app.include_router(users.router, prefix="/api")

@app.get("/")
async def root():
    try:
        return {
            "message": "Bem-vindo à API do Canto do Livro",
            "status": "online",
            "version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno do servidor: {str(e)}"
        )

@app.get("/health")
async def health_check():
    try:
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro na verificação de saúde: {str(e)}"
        )