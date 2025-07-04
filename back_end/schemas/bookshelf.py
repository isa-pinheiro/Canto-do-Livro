from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, validator
from back_end.schemas.book import Book

class BookshelfEntryBase(BaseModel):
    status: Literal['to_read', 'reading', 'read', 'favorite'] = 'to_read'
    pages_read: int = Field(ge=0, default=0)
    total_pages: Optional[int] = Field(ge=0, default=None)
    rating: Optional[float] = Field(default=None, ge=1, le=5)

    @validator('rating')
    def validate_rating_increment(cls, v):
        if v is not None and v % 0.5 != 0:
            raise ValueError('Rating must be in 0.5 increments')
        return v

class BookshelfEntryCreate(BookshelfEntryBase):
    book_id: int

class BookshelfEntryUpdate(BaseModel):
    status: Optional[Literal['to_read', 'reading', 'read', 'favorite']] = None
    pages_read: Optional[int] = Field(ge=0, default=None)
    total_pages: Optional[int] = Field(ge=0, default=None)
    rating: Optional[float] = Field(default=None, ge=1, le=5)

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