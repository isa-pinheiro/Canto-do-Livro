from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_
from passlib.context import CryptContext

from back_end.models.user import User
from back_end.models.bookshelf import UserBookshelf
from back_end.schemas.user import UserResponse, UserUpdate, UserSearchResponse

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def get_user_by_id(self, user_id: int) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        return user

    def get_user_stats(self, user_id: int) -> dict:
        bookshelf_stats = self.db.query(
            func.count(UserBookshelf.id).label('total'),
            func.sum(case((UserBookshelf.status == 'to_read', 1), else_=0)).label('want_to_read'),
            func.sum(case((UserBookshelf.status == 'reading', 1), else_=0)).label('reading'),
            func.sum(case((UserBookshelf.status == 'read', 1), else_=0)).label('read'),
            func.sum(case((UserBookshelf.status == 'favorite', 1), else_=0)).label('favorite')
        ).filter(UserBookshelf.user_id == user_id).first()

        return {
            'total': bookshelf_stats.total or 0,
            'want_to_read': bookshelf_stats.want_to_read or 0,
            'reading': bookshelf_stats.reading or 0,
            'read': bookshelf_stats.read or 0,
            'favorite': bookshelf_stats.favorite or 0
        }

    def follow_user(self, current_user: User, user_to_follow_id: int) -> User:
        if user_to_follow_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode seguir a si mesmo"
            )
        
        user_to_follow = self.get_user_by_id(user_to_follow_id)
        
        if user_to_follow in current_user.following:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você já segue este usuário"
            )
        
        current_user.following.append(user_to_follow)
        self.db.commit()
        self.db.refresh(current_user)
        return current_user

    def unfollow_user(self, current_user: User, user_to_unfollow_id: int) -> User:
        if user_to_unfollow_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode deixar de seguir a si mesmo"
            )
        
        user_to_unfollow = self.get_user_by_id(user_to_unfollow_id)
        
        if user_to_unfollow not in current_user.following:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não segue este usuário"
            )
        
        current_user.following.remove(user_to_unfollow)
        self.db.commit()
        self.db.refresh(current_user)
        return current_user

    def get_user_followers(self, user_id: int) -> List[UserSearchResponse]:
        user = self.get_user_by_id(user_id)
        followers = user.followers
        results = []
        
        for follower in followers:
            stats_dict = self.get_user_stats(follower.id)
            results.append({
                "id": follower.id,
                "username": follower.username,
                "full_name": follower.full_name,
                "profile_picture": follower.profile_picture,
                "created_at": follower.created_at,
                "bookshelf_stats": stats_dict
            })
        return results

    def get_user_following(self, user_id: int) -> List[UserSearchResponse]:
        user = self.get_user_by_id(user_id)
        following = user.following
        results = []
        
        for followed in following:
            stats_dict = self.get_user_stats(followed.id)
            results.append({
                "id": followed.id,
                "username": followed.username,
                "full_name": followed.full_name,
                "profile_picture": followed.profile_picture,
                "created_at": followed.created_at,
                "bookshelf_stats": stats_dict
            })
        return results

    def search_users(self, query: str, current_user_id: int) -> List[UserSearchResponse]:
        users = self.db.query(User).filter(
            User.id != current_user_id,
            or_(
                User.username.ilike(f"%{query}%"),
                User.full_name.ilike(f"%{query}%")
            )
        ).all()

        results = []
        current_user = self.get_user_by_id(current_user_id)
        
        for user in users:
            stats_dict = self.get_user_stats(user.id)
            is_following = user in current_user.following
            created_at = user.created_at or datetime.now()

            results.append({
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "profile_picture": user.profile_picture,
                "created_at": created_at,
                "bookshelf_stats": stats_dict,
                "is_following": is_following
            })
        return results

    def update_user_profile(self, user_id: int, user_update: UserUpdate) -> User:
        user = self.get_user_by_id(user_id)
        
        # Verificar se o usuário está tentando alterar a senha
        if user_update.password:
            if not user_update.current_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Senha atual é necessária para alterar a senha"
                )
            
            # Verificar se a senha atual está correta
            if not self.verify_password(user_update.current_password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Senha atual incorreta"
                )
            
            # Atualizar a senha
            user.password_hash = self.get_password_hash(user_update.password)
        
        # Atualizar outros campos
        update_data = user_update.dict(exclude={'password', 'current_password'})
        for field, value in update_data.items():
            if value is not None:  # Só atualiza se o valor não for None
                setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user 