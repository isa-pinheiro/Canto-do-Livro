from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BookBase(BaseModel):
    name: str
    isbn13: Optional[str] = None
    isbn10: Optional[str] = None
    subtitle: Optional[str] = None
    category: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    publication_year: Optional[int] = None
    num_pages: Optional[int] = None
    average_rating: Optional[float] = 0.0

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 