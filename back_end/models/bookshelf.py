from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from back_end.models.base import Base

class Book(Base):
    __tablename__ = 'books'

    id = Column(Integer, primary_key=True)
    name = Column(String(512), nullable=False)
    isbn13 = Column(String(13), unique=True, nullable=True)
    isbn10 = Column(String(10), unique=True, nullable=True)
    subtitle = Column(String(512), nullable=True)
    category = Column(String(255), nullable=True)
    cover_url = Column(String(1024), nullable=True)
    description = Column(Text, nullable=True)
    publication_year = Column(Integer, nullable=True)
    num_pages = Column(Integer, nullable=True)
    average_rating = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bookshelves = relationship("UserBookshelf", back_populates="book")

class UserBookshelf(Base):
    __tablename__ = "user_bookshelves"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))
    status = Column(String, default="to_read")  # to_read, reading, read
    pages_read = Column(Integer, default=0)
    total_pages = Column(Integer)
    rating = Column(Float, nullable=True) # 1 to 5 stars, with 0.5 increments
    is_favorite = Column(Boolean, default=False)  # <-- Campo favorito
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="bookshelves")
    book = relationship("Book", back_populates="bookshelves") 