from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.user import User
from ..models.bookshelf import UserBookshelf
from ..schemas.user import UserResponse, UserUpdate
from ..auth import get_current_user
from sqlalchemy import func, case

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Buscar estatísticas da estante
        bookshelf_stats = db.query(
            func.count(UserBookshelf.id).label('total'),
            func.sum(case((UserBookshelf.status == 'to_read', 1), else_=0)).label('want_to_read'),
            func.sum(case((UserBookshelf.status == 'reading', 1), else_=0)).label('reading'),
            func.sum(case((UserBookshelf.status == 'read', 1), else_=0)).label('read'),
            func.sum(case((UserBookshelf.status == 'favorite', 1), else_=0)).label('favorite')
        ).filter(UserBookshelf.user_id == current_user.id).first()

        # Converter para dicionário com valores padrão
        stats_dict = {
            'total': bookshelf_stats.total or 0,
            'want_to_read': bookshelf_stats.want_to_read or 0,
            'reading': bookshelf_stats.reading or 0,
            'read': bookshelf_stats.read or 0,
            'favorite': bookshelf_stats.favorite or 0
        }

        # Adicionar estatísticas ao objeto do usuário
        user_dict = {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "profile_picture": current_user.profile_picture,
            "bookshelf_stats": stats_dict
        }

        print(f"Dados do usuário retornados: {user_dict}")
        return user_dict
    except Exception as e:
        print(f"Erro ao buscar dados do usuário: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar dados do usuário: {str(e)}"
        ) 