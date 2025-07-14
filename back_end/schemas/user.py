from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class BookshelfStats(BaseModel):
    total: int
    want_to_read: int
    reading: int
    read: int

class FollowCounts(BaseModel):
    followers_count: int
    following_count: int

class UserSearchResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime
    bookshelf_stats: BookshelfStats
    is_following: Optional[bool] = None
    follow_counts: Optional[FollowCounts] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    current_password: Optional[str] = None
    password: Optional[str] = None

    class Config:
        from_attributes = True

class UserInDB(UserBase):
    id: int
    disabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class User(UserInDB):
    pass

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    bookshelf_stats: Optional[BookshelfStats] = None
    is_following: Optional[bool] = None
    follow_counts: Optional[FollowCounts] = None

    class Config:
        from_attributes = True
        # Permitir conversão de tipos para evitar problemas de validação
        arbitrary_types_allowed = True

class NotificationResponse(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class FollowResponse(BaseModel):
    is_following: bool
    message: str 