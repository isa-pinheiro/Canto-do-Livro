from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import shutil
from pathlib import Path
from sqlalchemy import func, case

from models.base import get_db
from models.user import User
from configs.settings import settings
from schemas.user import UserCreate, Token, TokenData, User as UserSchema, UserUpdate, UserResponse
from auth.dependencies import get_current_user

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
    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        print(f"Tentativa de login para usuário: {form_data.username}")
        
        # Authenticate user
        user = db.query(User).filter(User.username == form_data.username).first()
        if not user:
            print(f"Usuário não encontrado: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário ou senha inválidos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not verify_password(form_data.password, user.password_hash):
            print(f"Senha inválida para usuário: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário ou senha inválidos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user.disabled:
            print(f"Usuário desabilitado: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário desabilitado"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        print(f"Login bem-sucedido para usuário: {form_data.username}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        print(f"Erro durante o login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro durante o login: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get the current user's profile data
    """
    try:
        user = db.query(User).filter(User.id == current_user["id"]).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Buscar estatísticas da estante
        from models.bookshelf import UserBookshelf
        bookshelf_stats = db.query(
            func.count(UserBookshelf.id).label('total'),
            func.sum(case((UserBookshelf.status == 'to_read', 1), else_=0)).label('want_to_read'),
            func.sum(case((UserBookshelf.status == 'reading', 1), else_=0)).label('reading'),
            func.sum(case((UserBookshelf.status == 'read', 1), else_=0)).label('read'),
            func.sum(case((UserBookshelf.status == 'favorite', 1), else_=0)).label('favorite')
        ).filter(UserBookshelf.user_id == user.id).first()

        # Converter para dicionário com valores padrão
        stats_dict = {
            'total': bookshelf_stats.total or 0,
            'want_to_read': bookshelf_stats.want_to_read or 0,
            'reading': bookshelf_stats.reading or 0,
            'read': bookshelf_stats.read or 0,
            'favorite': bookshelf_stats.favorite or 0
        }

        # Preparar resposta
        response_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at,
            "bookshelf_stats": stats_dict
        }

        print(f"Dados do usuário retornados: {response_data}")
        return response_data

    except Exception as e:
        print(f"Erro ao buscar dados do usuário: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar dados do usuário: {str(e)}"
        )

@router.post("/me/profile-picture", response_model=UserSchema)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a profile picture for the current user
    """
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
    try:
        print(f"Atualizando usuário {current_user['id']} com dados: {user_update.dict(exclude_unset=True)}")
        
        # Buscar usuário no banco
        user = db.query(User).filter(User.id == current_user['id']).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        # Verificar se o usuário está tentando alterar a senha
        if user_update.password:
            if not user_update.current_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Senha atual é necessária para alterar a senha"
                )
            
            # Verificar se a senha atual está correta
            if not verify_password(user_update.current_password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Senha atual incorreta"
                )
            
            # Atualizar a senha
            user.password_hash = get_password_hash(user_update.password)
        
        # Atualizar outros campos
        update_data = user_update.dict(exclude_unset=True, exclude={'password', 'current_password'})
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        # Buscar estatísticas da estante
        from models.bookshelf import UserBookshelf
        bookshelf_stats = db.query(
            func.count(UserBookshelf.id).label('total'),
            func.sum(case((UserBookshelf.status == 'to_read', 1), else_=0)).label('want_to_read'),
            func.sum(case((UserBookshelf.status == 'reading', 1), else_=0)).label('reading'),
            func.sum(case((UserBookshelf.status == 'read', 1), else_=0)).label('read'),
            func.sum(case((UserBookshelf.status == 'favorite', 1), else_=0)).label('favorite')
        ).filter(UserBookshelf.user_id == user.id).first()

        # Converter para dicionário com valores padrão
        stats_dict = {
            'total': bookshelf_stats.total or 0,
            'want_to_read': bookshelf_stats.want_to_read or 0,
            'reading': bookshelf_stats.reading or 0,
            'read': bookshelf_stats.read or 0,
            'favorite': bookshelf_stats.favorite or 0
        }

        # Preparar resposta
        response_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at,
            "bookshelf_stats": stats_dict
        }
        
        print(f"Dados atualizados retornados: {response_data}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar usuário: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar usuário: {str(e)}"
        )