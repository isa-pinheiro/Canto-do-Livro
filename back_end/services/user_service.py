from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_
from passlib.context import CryptContext

from back_end.models.user import User
from back_end.models.bookshelf import UserBookshelf
from back_end.models.notification import Notification
from back_end.schemas.user import UserResponse, UserUpdate, UserSearchResponse
from back_end.services.user_factory import UserFactory

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_factory = UserFactory()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.user_factory.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.user_factory.pwd_context.hash(password)

    def get_user_by_id(self, user_id: int, current_user_id: int = None):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        stats_dict = self.get_user_stats(user.id)
        
        # Obter contadores de seguidores e seguindo
        follow_counts = self.get_follow_counts(user.id)
        
        # Se for o próprio usuário, retorna UserResponse (com email, etc)
        if current_user_id is not None and user_id == current_user_id:
            return {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "profile_picture": user.profile_picture,
                "created_at": user.created_at,
                "bookshelf_stats": stats_dict,
                "follow_counts": follow_counts
            }
        
        # Se for outro usuário, verifica se o usuário atual está seguindo
        is_following = False
        if current_user_id is not None:
            current_user_obj = self.db.query(User).filter(User.id == current_user_id).first()
            if current_user_obj:
                is_following = user in current_user_obj.following
                print(f"=== GET_USER_BY_ID DEBUG ===")
                print(f"User ID: {user_id}")
                print(f"Current user ID: {current_user_id}")
                print(f"Current user following count: {len(current_user_obj.following)}")
                print(f"Current user following IDs: {[u.id for u in current_user_obj.following]}")
                print(f"User {user.id} in following: {is_following}")
        
        # Retorna dados públicos com informação de seguimento
        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at,
            "bookshelf_stats": stats_dict,
            "is_following": is_following,
            "follow_counts": follow_counts
        }

    def get_user_by_username(self, username: str, current_user_id: int = None) -> UserSearchResponse:
        print(f"=== GET_USER_BY_USERNAME DEBUG ===")
        print(f"Username: {username}")
        print(f"Current user ID: {current_user_id}")
        
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        stats_dict = self.get_user_stats(user.id)
        follow_counts = self.get_follow_counts(user.id)
        
        print(f"User ID: {user.id}")
        print(f"Follow counts: {follow_counts}")
        print(f"User followers: {len(user.followers)}")
        print(f"User following: {len(user.following)}")
        
        # Verifica se o usuário atual está seguindo
        is_following = False
        if current_user_id is not None:
            current_user_obj = self.db.query(User).filter(User.id == current_user_id).first()
            if current_user_obj:
                is_following = user in current_user_obj.following
        
        result = {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at,
            "bookshelf_stats": stats_dict,
            "is_following": is_following,
            "follow_counts": follow_counts
        }
        
        print(f"Returning result: {result}")
        return result

    def get_user_stats(self, user_id: int) -> dict:
        bookshelf_stats = self.db.query(
            func.count(UserBookshelf.id).label('total'),
            func.sum(case((UserBookshelf.status == 'to_read', 1), else_=0)).label('want_to_read'),
            func.sum(case((UserBookshelf.status == 'reading', 1), else_=0)).label('reading'),
            func.sum(case((UserBookshelf.status == 'read', 1), else_=0)).label('read')
        ).filter(UserBookshelf.user_id == user_id).first()

        return {
            'total': bookshelf_stats.total or 0,
            'want_to_read': bookshelf_stats.want_to_read or 0,
            'reading': bookshelf_stats.reading or 0,
            'read': bookshelf_stats.read or 0
        }

    def get_follow_counts(self, user_id: int) -> dict:
        """Retorna os contadores de seguidores e seguindo para um usuário"""
        print(f"=== GET_FOLLOW_COUNTS DEBUG ===")
        print(f"User ID: {user_id}")
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"User not found for ID: {user_id}")
            return {'followers_count': 0, 'following_count': 0}
        
        followers_count = len(user.followers)
        following_count = len(user.following)
        
        print(f"Followers count: {followers_count}")
        print(f"Following count: {following_count}")
        
        result = {
            'followers_count': followers_count,
            'following_count': following_count
        }
        
        print(f"Returning follow counts: {result}")
        return result

    def follow_user(self, current_user: dict, user_to_follow_id: int) -> dict:
        print(f"=== FOLLOW_USER DEBUG ===")
        print(f"Current user ID: {current_user['id']}")
        print(f"User to follow ID: {user_to_follow_id}")
        
        current_user_obj = self.db.query(User).filter(User.id == current_user["id"]).first()
        print(f"Current user found: {current_user_obj is not None}")
        
        if current_user_obj:
            print(f"Current user following count: {len(current_user_obj.following)}")
            print(f"Current user following IDs: {[u.id for u in current_user_obj.following]}")
        
        if user_to_follow_id == current_user_obj.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode seguir a si mesmo"
            )
        user_to_follow = self.db.query(User).filter(User.id == user_to_follow_id).first()
        if not user_to_follow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        is_already_following = user_to_follow in current_user_obj.following
        print(f"User {user_to_follow_id} already in following: {is_already_following}")
        
        if is_already_following:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você já segue este usuário"
            )
        current_user_obj.following.append(user_to_follow)
        self.db.commit()
        self.db.refresh(current_user_obj)
        notification = Notification(
            user_id=user_to_follow.id,
            type="follow",
            message=f"{current_user_obj.username} começou a te seguir."
        )
        self.db.add(notification)
        self.db.commit()
        return {
            "is_following": True,
            "message": f"Você começou a seguir {user_to_follow.username}"
        }

    def unfollow_user(self, current_user: dict, user_to_unfollow_id: int) -> dict:
        print(f"=== UNFOLLOW_USER DEBUG ===")
        print(f"Current user ID: {current_user['id']}")
        print(f"User to unfollow ID: {user_to_unfollow_id}")
        
        current_user_obj = self.db.query(User).filter(User.id == current_user["id"]).first()
        print(f"Current user found: {current_user_obj is not None}")
        
        if current_user_obj:
            print(f"Current user following count: {len(current_user_obj.following)}")
            print(f"Current user following IDs: {[u.id for u in current_user_obj.following]}")
        
        if user_to_unfollow_id == current_user_obj.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não pode deixar de seguir a si mesmo"
            )
        user_to_unfollow = self.db.query(User).filter(User.id == user_to_unfollow_id).first()
        if not user_to_unfollow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        
        is_following = user_to_unfollow in current_user_obj.following
        print(f"User {user_to_unfollow_id} in following: {is_following}")
        
        if not is_following:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Você não segue este usuário"
            )
        current_user_obj.following.remove(user_to_unfollow)
        self.db.commit()
        self.db.refresh(current_user_obj)
        return {
            "is_following": False,
            "message": f"Você deixou de seguir {user_to_unfollow.username}"
        }

    def get_user_followers(self, user_id: int) -> List[UserSearchResponse]:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        followers = user.followers
        results = []
        for follower in followers:
            stats_dict = self.get_user_stats(follower.id)
            follow_counts = self.get_follow_counts(follower.id)
            results.append({
                "id": follower.id,
                "username": follower.username,
                "full_name": follower.full_name,
                "profile_picture": follower.profile_picture,
                "created_at": follower.created_at,
                "bookshelf_stats": stats_dict,
                "follow_counts": follow_counts
            })
        return results

    def get_user_following(self, user_id: int) -> List[UserSearchResponse]:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )
        following = user.following
        results = []
        for followed in following:
            stats_dict = self.get_user_stats(followed.id)
            follow_counts = self.get_follow_counts(followed.id)
            results.append({
                "id": followed.id,
                "username": followed.username,
                "full_name": followed.full_name,
                "profile_picture": followed.profile_picture,
                "created_at": followed.created_at,
                "bookshelf_stats": stats_dict,
                "follow_counts": follow_counts
            })
        return results

    def search_users(self, query: str, current_user_id: int) -> List[UserSearchResponse]:
        print(f"=== SEARCH_USERS DEBUG ===")
        print(f"Query: {query}")
        print(f"Current user ID: {current_user_id}")
        
        users = self.db.query(User).filter(
            User.id != current_user_id,
            or_(
                User.username.ilike(f"%{query}%"),
                User.full_name.ilike(f"%{query}%")
            )
        ).all()

        results = []
        current_user_obj = self.db.query(User).filter(User.id == current_user_id).first()
        print(f"Current user found: {current_user_obj is not None}")
        if current_user_obj:
            print(f"Current user following count: {len(current_user_obj.following)}")
            print(f"Current user following IDs: {[u.id for u in current_user_obj.following]}")
        
        for user in users:
            stats_dict = self.get_user_stats(user.id)
            follow_counts = self.get_follow_counts(user.id)
            is_following = user in current_user_obj.following if current_user_obj else False
            created_at = user.created_at or datetime.now()
            
            print(f"User {user.id} ({user.username}): is_following = {is_following}")
            if current_user_obj:
                print(f"  - Current user following list: {[u.id for u in current_user_obj.following]}")
                print(f"  - User {user.id} in following list: {user.id in [u.id for u in current_user_obj.following]}")
                print(f"  - Direct check: {user in current_user_obj.following}")

            results.append({
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "profile_picture": user.profile_picture,
                "created_at": created_at,
                "bookshelf_stats": stats_dict,
                "is_following": is_following,
                "follow_counts": follow_counts
            })
        return results

    def update_user_profile(self, user_id: int, user_update: UserUpdate) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
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
            if not self.verify_password(user_update.current_password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Senha atual incorreta"
                )
            # Atualizar a senha
            user.password_hash = self.get_password_hash(user_update.password)
        # Verificar se o novo username já está em uso
        if user_update.username and user_update.username != user.username:
            existing_user = self.db.query(User).filter(User.username == user_update.username).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este nome de usuário já está em uso"
                )
        # Verificar se o novo email já está em uso
        if user_update.email and user_update.email != user.email:
            existing_user = self.db.query(User).filter(User.email == user_update.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este email já está em uso"
                )
        # Atualizar outros campos
        update_data = user_update.dict(exclude_unset=True)
        update_data.pop("current_password", None)
        update_data.pop("password", None)
        for field, value in update_data.items():
            if value is not None:
                setattr(user, field, value)
        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao atualizar perfil: {str(e)}"
            )

    def get_notifications(self, user_id: int):
        from back_end.schemas.user import NotificationResponse
        notifications = self.db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
        result = []
        for n in notifications:
            print(f"Notificação: id={n.id}, type={n.type}, message={n.message}, is_read={n.is_read}, created_at={n.created_at}")
            try:
                notif = NotificationResponse.from_orm(n)
                result.append(notif)
            except Exception as e:
                print(f"Erro ao converter notificação id={n.id}: {e}")
        return result

    def get_feed(self, user_id: int, limit: int = 20):
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return []
        followed_ids = [u.id for u in user.following]
        if not followed_ids:
            return []
        from back_end.models.bookshelf import UserBookshelf
        feed_entries = self.db.query(UserBookshelf).filter(UserBookshelf.user_id.in_(followed_ids)).order_by(UserBookshelf.updated_at.desc()).limit(limit).all()
        return feed_entries 