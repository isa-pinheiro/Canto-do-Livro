from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Configs.database import engine, Base
from Configs.models import User
from Routes import auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)