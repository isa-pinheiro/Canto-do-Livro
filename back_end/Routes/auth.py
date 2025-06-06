from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import shutil
from pathlib import Path
from sqlalchemy import func, case
from pydantic import BaseModel

from back_end.models.base import get_db
from back_end.models.user import User
from back_end.configs.settings import settings
from back_end.schemas.user import UserCreate, Token, TokenData, User as UserSchema, UserUpdate, UserResponse
from back_end.auth import get_current_user
from back_end.services.auth_service import AuthService
from back_end.services.user_service import UserService

class LoginData(BaseModel):
    username: str
    password: str

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    auth_service = AuthService()
    return auth_service.register_user(user_data, db)

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    auth_service = AuthService()
    return auth_service.authenticate_user(form_data.username, form_data.password, db)

@router.post("/login", response_model=Token)
async def login_json(login_data: LoginData, db: Session = Depends(get_db)):
    auth_service = AuthService()
    return auth_service.authenticate_user(login_data.username, login_data.password, db)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_service = UserService(db)
    return user_service.get_user_by_id(current_user["id"])

@router.post("/me/profile-picture", response_model=UserResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    user = user_service.get_user_by_id(current_user["id"])
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/profile_pictures")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"{current_user['id']}_{datetime.utcnow().timestamp()}.{file_extension}"
    file_path = upload_dir / filename

    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save file"
        )

    # Update user profile
    user = db.query(User).filter(User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Delete old profile picture if exists
    if user.profile_picture:
        old_file = Path(user.profile_picture.replace('/api/static/', ''))
        if old_file.exists():
            old_file.unlink()

    # Update user profile picture URL
    user.profile_picture = f"/api/static/profile_pictures/{filename}"
    db.commit()
    db.refresh(user)

    return user

@router.patch("/me", response_model=UserResponse)
async def update_user_info(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.update_user_profile(current_user["id"], user_update)

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    auth_service = AuthService()
    # Implement refresh token logic here
    # This part remains the same as it's specific to token refresh
    # ... existing refresh token code ...