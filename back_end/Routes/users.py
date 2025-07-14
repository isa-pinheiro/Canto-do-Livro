from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.base import get_db
from ..models.user import User
from ..schemas.user import UserResponse, UserSearchResponse, NotificationResponse, FollowResponse
from ..auth import get_current_user
from ..services.user_service import UserService
from ..schemas.bookshelf import FeedEntry, FeedEntryDebug, FeedEntryRobust

router = APIRouter(prefix="/users", tags=["users"])

# ROTAS FIXAS PRIMEIRO
@router.get("/feed", response_model=List[FeedEntry])
async def get_feed(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db), limit: Optional[str] = Query("20")):
    try:
        limit_int = 20
        try:
            limit_int = int(limit) if limit and str(limit).isdigit() else 20
        except Exception as e:
            limit_int = 20
        user_service = UserService(db)
        result = user_service.get_feed(current_user["id"], limit_int)
        if not isinstance(result, list):
            return []
        validated_result = []
        for entry in result:
            try:
                feed_entry = FeedEntry(**entry)
                validated_result.append(feed_entry)
            except Exception as e:
                import traceback
                traceback.print_exc()
                continue
        return validated_result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return []

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_service = UserService(db)
    return user_service.get_notifications(current_user["id"])

@router.get("/search", response_model=List[UserSearchResponse])
async def search_users(
    query: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    result = user_service.search_users(query, current_user["id"])
    return result

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_service = UserService(db)
    return user_service.get_user_by_id(current_user.id)

# ROTAS DINÂMICAS DEPOIS
@router.post("/{user_id}/follow", response_model=FollowResponse)
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.follow_user(current_user, user_id)

@router.delete("/{user_id}/unfollow", response_model=FollowResponse)
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

@router.get("/{user_id}/follow-counts")
async def get_user_follow_counts(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Retorna apenas os contadores de seguidores e seguindo de um usuário"""
    user_service = UserService(db)
    return user_service.get_follow_counts(user_id)

@router.get("/{user_id}", response_model=UserSearchResponse)
async def get_user_profile(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    return user_service.get_user_by_id(user_id, current_user["id"])

@router.get("/username/{username}", response_model=UserSearchResponse)
async def get_user_by_username(
    username: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    result = user_service.get_user_by_username(username, current_user["id"])
    return result

@router.get("/test-follow-counts/{user_id}")
async def test_follow_counts(user_id: int, db: Session = Depends(get_db)):
    """Endpoint de teste para verificar os contadores de seguidores"""
    user_service = UserService(db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "Usuário não encontrado"}
    
    follow_counts = user_service.get_follow_counts(user_id)
    return {
        "user_id": user_id,
        "username": user.username,
        "follow_counts": follow_counts,
        "raw_followers": len(user.followers),
        "raw_following": len(user.following)
    } 