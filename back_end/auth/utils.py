from ..services.user_factory import UserFactory

# Instância da UserFactory
user_factory = UserFactory()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha está correta"""
    return user_factory.pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera o hash da senha"""
    return user_factory.pwd_context.hash(password) 