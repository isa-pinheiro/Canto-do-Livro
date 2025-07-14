from typing import Optional, Literal, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from back_end.schemas.book import Book

class BookshelfEntryBase(BaseModel):
    status: Literal['to_read', 'reading', 'read'] = 'to_read'
    pages_read: int = Field(ge=0, default=0)
    total_pages: Optional[int] = Field(ge=0, default=None)
    rating: Optional[float] = Field(default=None, ge=1, le=5)
    is_favorite: bool = Field(default=False)

    @validator('rating')
    def validate_rating_increment(cls, v):
        if v is not None and v % 0.5 != 0:
            raise ValueError('Rating must be in 0.5 increments')
        return v

class BookshelfEntryCreate(BookshelfEntryBase):
    book_id: int

class BookshelfEntryUpdate(BaseModel):
    status: Optional[Literal['to_read', 'reading', 'read']] = None
    pages_read: Optional[int] = Field(ge=0, default=None)
    total_pages: Optional[int] = Field(ge=0, default=None)
    rating: Optional[float] = Field(default=None, ge=1, le=5)
    is_favorite: Optional[bool] = None

    @validator('rating')
    def validate_rating_increment(cls, v):
        if v is not None and v % 0.5 != 0:
            raise ValueError('Rating must be in 0.5 increments')
        return v

class BookshelfEntry(BookshelfEntryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    book: Book

    class Config:
        from_attributes = True

class UserAverageRating(BaseModel):
    average_rating: float = Field(ge=0, le=5)
    total_rated_books: int = Field(ge=0)
    total_read_books: int = Field(ge=0)
    message: str 

class FeedEntry(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: str
    pages_read: int
    total_pages: Optional[int] = None
    rating: Optional[float] = None
    is_favorite: bool = False
    created_at: str
    updated_at: str
    # Informações do usuário
    user: Optional[dict] = None
    # Informações do livro
    book: Optional[dict] = None
    # Tipo de atividade para melhor formatação no frontend
    activity_type: Optional[str] = None

    class Config:
        from_attributes = True
        # Permitir conversão de tipos para evitar problemas de validação
        arbitrary_types_allowed = True

class FeedEntryDebug(BaseModel):
    """Schema simplificado para debug"""
    id: int
    user_id: int
    book_id: int
    status: str
    pages_read: int
    total_pages: Optional[int] = None
    rating: Optional[float] = None
    is_favorite: bool = False
    created_at: str
    updated_at: str
    user: Optional[dict] = None
    book: Optional[dict] = None
    activity_type: Optional[str] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        # Ser mais permissivo com tipos
        validate_assignment = False

class FeedEntryRobust(BaseModel):
    """Schema mais robusto para o feed com validação flexível"""
    id: Union[int, str]
    user_id: Union[int, str]
    book_id: Union[int, str]
    status: str
    pages_read: Union[int, str]
    total_pages: Optional[Union[int, str]] = None
    rating: Optional[Union[float, str]] = None
    is_favorite: bool = False
    created_at: str
    updated_at: str
    user: Optional[dict] = None
    book: Optional[dict] = None
    activity_type: Optional[str] = None

    @validator('id', 'user_id', 'book_id', pre=True)
    def convert_ids_to_int(cls, v):
        if v is not None:
            return int(v)
        return v

    @validator('pages_read', 'total_pages', pre=True)
    def convert_pages_to_int(cls, v):
        if v is not None:
            return int(v)
        return v

    @validator('rating', pre=True)
    def convert_rating_to_float(cls, v):
        if v is not None:
            return float(v)
        return v

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        validate_assignment = False 