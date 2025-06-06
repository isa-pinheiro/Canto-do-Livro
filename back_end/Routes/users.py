from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.base import get_db
from ..models.user import User
from ..models.bookshelf import UserBookshelf
from ..schemas.user import UserResponse, UserUpdate, UserSearchResponse
from ..auth import get_current_user
from sqlalchemy import func, case, or_
from datetime import datetime
from ..services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

# Endpoints de gerenciamento de seguidores
@router.post("/{user_id}/follow", response_model=UserResponse)
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.follow_user(current_user, user_id)

@router.delete("/{user_id}/unfollow", response_model=UserResponse)
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.unfollow_user(current_user, user_id)

@router.get("/{user_id}/followers", response_model=List[UserSearchResponse])
async def get_user_followers(
    user_id: int,
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.get_user_followers(user_id)

@router.get("/{user_id}/following", response_model=List[UserSearchResponse])
async def get_user_following(
    user_id: int,
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.get_user_following(user_id)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_service = UserService(db)
    return user_service.get_user_by_id(current_user.id)

@router.get("/search", response_model=List[UserSearchResponse])
async def search_users(
    query: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.search_users(query, current_user["id"])

@router.get("/{user_id}", response_model=UserSearchResponse)
async def get_user_profile(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.get_user_by_id(user_id) 