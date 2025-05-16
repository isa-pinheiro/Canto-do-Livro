from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class BookshelfStats(BaseModel):
    total: int
    want_to_read: int
    reading: int
    read: int
    favorite: int

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    current_password: Optional[str] = None

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
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserResponse(UserBase):
    id: int
    profile_picture: Optional[str] = None
    bookshelf_stats: Optional[BookshelfStats] = None
    created_at: datetime

    class Config:
        from_attributes = True 