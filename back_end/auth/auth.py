from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from ..models.base import get_db
from ..models.user import User
from ..configs.settings import settings
from ..schemas.user import TokenData
from .auth_context import AuthenticationContext
from .auth_strategies import PasswordAuthenticationStrategy, OAuthAuthenticationStrategy, SSOAuthenticationStrategy
from .utils import verify_password, get_password_hash

# Configuração do OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Instância do contexto de autenticação
auth_context = AuthenticationContext()

def authenticate_user(db: Session, credentials: Dict[str, Any], auth_type: str = "password") -> Optional[User]:
    """Autentica um usuário usando a estratégia apropriada"""
    if auth_type == "password":
        auth_context.set_strategy(PasswordAuthenticationStrategy())
    elif auth_type == "oauth":
        auth_context.set_strategy(OAuthAuthenticationStrategy())
    elif auth_type == "sso":
        auth_context.set_strategy(SSOAuthenticationStrategy())
    else:
        raise ValueError(f"Tipo de autenticação não suportado: {auth_type}")
    
    return auth_context.authenticate(db, credentials)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> dict:
    """Obtém o usuário atual baseado no token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        print(f"Token recebido: {token}")
        print(f"Chave secreta: {settings.SECRET_KEY}")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"Payload decodificado: {payload}")
        user_id: str = payload.get("sub")
        if user_id is None:
            print("ID do usuário não encontrado no token")
            raise credentials_exception
        print(f"ID do usuário encontrado: {user_id}")
        
        # Buscar usuário diretamente pelo ID
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            print("Usuário não encontrado no banco de dados")
            raise credentials_exception
        print(f"Usuário encontrado: {user.username}")
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at
        }
    except JWTError as e:
        print(f"Erro ao decodificar token: {str(e)}")
        raise credentials_exception
    except ValueError as e:
        print(f"Erro ao converter ID do usuário: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"Erro inesperado: {str(e)}")
        raise credentials_exception

async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Verifica se o usuário atual está ativo"""
    if current_user.get("disabled"):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user 