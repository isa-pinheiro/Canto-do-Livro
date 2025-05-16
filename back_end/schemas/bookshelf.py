from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from schemas.book import Book

class BookshelfEntryBase(BaseModel):
    book_id: int
    status: str
    pages_read: Optional[int] = 0
    total_pages: Optional[int] = None

class BookshelfEntryCreate(BookshelfEntryBase):
    pass

class BookshelfEntryUpdate(BaseModel):
    status: Optional[str] = None
    pages_read: Optional[int] = None
    total_pages: Optional[int] = None

class BookshelfEntry(BookshelfEntryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    book: Book

    class Config:
        from_attributes = True 