from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models.user import User
from .utils import verify_password

class AuthenticationStrategy(ABC):
    """Interface para estratégias de autenticação"""
    
    @abstractmethod
    def authenticate(self, db: Session, credentials: Dict[str, Any]) -> Optional[User]:
        """Método abstrato para autenticação"""
        pass

class PasswordAuthenticationStrategy(AuthenticationStrategy):
    """Estratégia de autenticação por senha"""
    
    def authenticate(self, db: Session, credentials: Dict[str, Any]) -> Optional[User]:
        username = credentials.get("username")
        password = credentials.get("password")
        
        if not username or not password:
            return None
            
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
            
        if not verify_password(password, user.password_hash):
            return None
            
        return user

class OAuthAuthenticationStrategy(AuthenticationStrategy):
    """Estratégia de autenticação OAuth"""
    
    def authenticate(self, db: Session, credentials: Dict[str, Any]) -> Optional[User]:
        oauth_token = credentials.get("oauth_token")
        provider = credentials.get("provider")
        
        if not oauth_token or not provider:
            return None
            
        # Aqui você implementaria a lógica específica para cada provedor OAuth
        # Por exemplo, validar o token com o Google, Facebook, etc.
        # Por enquanto, retornamos None como placeholder
        return None

class SSOAuthenticationStrategy(AuthenticationStrategy):
    """Estratégia de autenticação SSO"""
    
    def authenticate(self, db: Session, credentials: Dict[str, Any]) -> Optional[User]:
        sso_token = credentials.get("sso_token")
        
        if not sso_token:
            return None
            
        # Aqui você implementaria a lógica específica para SSO
        # Por exemplo, validar o token com seu provedor SSO
        # Por enquanto, retornamos None como placeholder
        return None 