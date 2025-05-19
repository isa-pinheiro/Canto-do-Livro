from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from back_end.schemas.book import Book

class BookshelfEntryBase(BaseModel):
    status: Literal['to_read', 'reading', 'read', 'favorite'] = 'to_read'
    pages_read: int = Field(ge=0, default=0)
    total_pages: Optional[int] = Field(ge=0, default=None)

class BookshelfEntryCreate(BookshelfEntryBase):
    book_id: int

class BookshelfEntryUpdate(BaseModel):
    status: Optional[Literal['to_read', 'reading', 'read', 'favorite']] = None
    pages_read: Optional[int] = Field(ge=0, default=None)
    total_pages: Optional[int] = Field(ge=0, default=None)

class BookshelfEntry(BookshelfEntryBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    book: Book

    class Config:
        from_attributes = True 