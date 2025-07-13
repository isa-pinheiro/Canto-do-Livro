from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = "postgresql://usuario1:senha123@localhost:5432/canto_livro"
    
    # JWT settings
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "canto_do_livro_secret_key_2024_development_only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days
    
    # CORS settings
    CORS_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"

settings = Settings() 