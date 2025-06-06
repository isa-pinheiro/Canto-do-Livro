from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from back_end.models.user import User
from back_end.schemas.user import UserCreate

class UserFactory:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def validate_password_strength(self, password: str) -> None:
        """Valida a força da senha"""
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve ter pelo menos 8 caracteres"
            )
        
        if not any(c.isupper() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve conter pelo menos uma letra maiúscula"
            )
        
        if not any(c.islower() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve conter pelo menos uma letra minúscula"
            )
        
        if not any(c.isdigit() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha deve conter pelo menos um número"
            )

    def validate_user_data(self, user_data: UserCreate, db: Session) -> None:
        """Valida os dados do usuário"""
        if not user_data.username or not user_data.username.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O nome de usuário é obrigatório"
            )
        
        if not user_data.email or not user_data.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O email é obrigatório"
            )
        
        if not user_data.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A senha é obrigatória"
            )

        # Verifica se o username já existe
        if db.query(User).filter(User.username == user_data.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este nome de usuário já está em uso"
            )
        
        # Verifica se o email já existe
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este email já está em uso"
            )

    def create_user(self, user_data: UserCreate, db: Session) -> User:
        """Cria um novo usuário com todas as validações necessárias"""
        # Valida os dados do usuário
        self.validate_user_data(user_data, db)
        
        # Valida a força da senha
        self.validate_password_strength(user_data.password)
        
        # Cria o hash da senha
        password_hash = self.pwd_context.hash(user_data.password)
        
        # Cria o usuário
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name,
            profile_picture=user_data.profile_picture,
            created_at=datetime.now(timezone.utc)
        )
        
        return db_user 