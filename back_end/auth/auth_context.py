from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from .auth_strategies import AuthenticationStrategy, PasswordAuthenticationStrategy
from ..models.user import User

class AuthenticationContext:
    """Contexto de autenticação que utiliza diferentes estratégias"""
    
    def __init__(self, strategy: AuthenticationStrategy = None):
        self._strategy = strategy or PasswordAuthenticationStrategy()
    
    def set_strategy(self, strategy: AuthenticationStrategy) -> None:
        """Define a estratégia de autenticação a ser utilizada"""
        self._strategy = strategy
    
    def authenticate(self, db: Session, credentials: Dict[str, Any]) -> Optional[User]:
        """Executa a autenticação usando a estratégia definida"""
        return self._strategy.authenticate(db, credentials) 