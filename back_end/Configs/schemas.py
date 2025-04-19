from pydantic import BaseModel, EmailStr, constr, Field
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str 

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserBase(BaseModel):
    username: str = Field(..., min_length=1)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=1)

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

class UserInDB(User):
    hashed_password: str