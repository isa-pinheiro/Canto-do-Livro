from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.base import get_db
from ..models.user import User
from ..models.bookshelf import UserBookshelf
from ..schemas.user import UserResponse, UserUpdate, UserSearchResponse
from ..auth import get_current_user
from sqlalchemy import func, case, or_

router = APIRouter(prefix="/users", tags=["users"])

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

@router.get("/search", response_model=List[UserSearchResponse])
async def search_users(
    query: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search users by username or full name, excluding the current user
    """
    try:
        # Search for users matching the query, excluding the current user
        users = db.query(User).filter(
            User.id != current_user["id"],
            or_(
                User.username.ilike(f"%{query}%"),
                User.full_name.ilike(f"%{query}%")
            )
        ).all()

        results = []
        for user in users:
            # Get bookshelf stats for each user
            bookshelf_stats = db.query(
                func.count(UserBookshelf.id).label('total'),
                func.sum(case((UserBookshelf.status == 'to_read', 1), else_=0)).label('want_to_read'),
                func.sum(case((UserBookshelf.status == 'reading', 1), else_=0)).label('reading'),
                func.sum(case((UserBookshelf.status == 'read', 1), else_=0)).label('read'),
                func.sum(case((UserBookshelf.status == 'favorite', 1), else_=0)).label('favorite')
            ).filter(UserBookshelf.user_id == user.id).first()

            stats_dict = {
                'total': bookshelf_stats.total or 0,
                'want_to_read': bookshelf_stats.want_to_read or 0,
                'reading': bookshelf_stats.reading or 0,
                'read': bookshelf_stats.read or 0,
                'favorite': bookshelf_stats.favorite or 0
            }

            results.append({
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "profile_picture": user.profile_picture,
                "created_at": user.created_at,
                "bookshelf_stats": stats_dict
            })

        return results
    except Exception as e:
        print(f"Erro ao buscar usuários: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar usuários: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserSearchResponse)
async def get_user_profile(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user profile by ID
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Buscar estatísticas da estante
        bookshelf_stats = db.query(
            func.count(UserBookshelf.id).label('total'),
            func.sum(case((UserBookshelf.status == 'to_read', 1), else_=0)).label('want_to_read'),
            func.sum(case((UserBookshelf.status == 'reading', 1), else_=0)).label('reading'),
            func.sum(case((UserBookshelf.status == 'read', 1), else_=0)).label('read'),
            func.sum(case((UserBookshelf.status == 'favorite', 1), else_=0)).label('favorite')
        ).filter(UserBookshelf.user_id == user.id).first()

        stats_dict = {
            'total': bookshelf_stats.total or 0,
            'want_to_read': bookshelf_stats.want_to_read or 0,
            'reading': bookshelf_stats.reading or 0,
            'read': bookshelf_stats.read or 0,
            'favorite': bookshelf_stats.favorite or 0
        }

        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at,
            "bookshelf_stats": stats_dict
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar perfil do usuário: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar perfil do usuário: {str(e)}"
        )

@router.post("/{user_id}/follow")
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Follow a user
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode seguir a si mesmo"
        )

    user_to_follow = db.query(User).filter(User.id == user_id).first()
    if not user_to_follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    if user_to_follow in current_user.following:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já segue este usuário"
        )

    current_user.following.append(user_to_follow)
    db.commit()

    return {"message": "Usuário seguido com sucesso"}

@router.delete("/{user_id}/follow")
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unfollow a user
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deixar de seguir a si mesmo"
        )

    user_to_unfollow = db.query(User).filter(User.id == user_id).first()
    if not user_to_unfollow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    if user_to_unfollow not in current_user.following:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não segue este usuário"
        )

    current_user.following.remove(user_to_unfollow)
    db.commit()

    return {"message": "Deixou de seguir o usuário com sucesso"}

@router.get("/{user_id}/followers")
async def get_user_followers(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user followers
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    followers = []
    for follower in user.followers:
        followers.append({
            "id": follower.id,
            "username": follower.username,
            "full_name": follower.full_name,
            "profile_picture": follower.profile_picture
        })

    return followers

@router.get("/{user_id}/following")
async def get_user_following(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get users that the user is following
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    following = []
    for followed in user.following:
        following.append({
            "id": followed.id,
            "username": followed.username,
            "full_name": followed.full_name,
            "profile_picture": followed.profile_picture
        })

    return following 