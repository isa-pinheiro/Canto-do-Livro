from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from back_end.models.base import Base

# Tabela de associação para seguir usuários
user_follows = Table(
    'user_follows',
    Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('following_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String) 
    password_hash = Column(String)
    profile_picture = Column(String, nullable=True)  # URL da imagem
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    bookshelves = relationship("UserBookshelf", back_populates="user", cascade="all, delete-orphan")

    # Relacionamentos para seguir/deixar de seguir
    following = relationship(
        'User',
        secondary=user_follows,
        primaryjoin=(id == user_follows.c.follower_id),
        secondaryjoin=(id == user_follows.c.following_id),
        backref='followers'
    ) 