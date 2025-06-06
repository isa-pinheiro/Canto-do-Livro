from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from back_end.models.bookshelf import Book, UserBookshelf
from back_end.schemas.book import BookCreate, Book as BookSchema
from back_end.schemas.bookshelf import BookshelfEntry, BookshelfEntryUpdate

class BookshelfService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_bookshelf(self, user_id: int, status: Optional[str] = None) -> List[BookshelfEntry]:
        query = self.db.query(UserBookshelf).filter(UserBookshelf.user_id == user_id)
        if status:
            query = query.filter(UserBookshelf.status == status)
        return query.all()

    def add_to_bookshelf(self, user_id: int, book_data: dict) -> BookshelfEntry:
        # Get the book by ID
        book = self.db.query(Book).filter(Book.id == book_data["book_id"]).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Livro não encontrado"
            )

        # Check if book is already in user's bookshelf
        existing_entry = self.db.query(UserBookshelf).filter(
            UserBookshelf.user_id == user_id,
            UserBookshelf.book_id == book.id
        ).first()

        if existing_entry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este livro já está na sua estante"
            )

        # Create bookshelf entry with total_pages from book or provided value
        total_pages = book_data.get("total_pages")
        if total_pages is None:
            total_pages = book.num_pages

        bookshelf = UserBookshelf(
            user_id=user_id,
            book_id=book.id,
            status=book_data["status"],
            total_pages=total_pages
        )
        
        self.db.add(bookshelf)
        self.db.commit()
        self.db.refresh(bookshelf)
        
        return bookshelf

    def update_bookshelf_entry(self, entry_id: int, user_id: int, entry_update: BookshelfEntryUpdate) -> BookshelfEntry:
        bookshelf_entry = self.db.query(UserBookshelf).filter(
            UserBookshelf.id == entry_id,
            UserBookshelf.user_id == user_id
        ).first()

        if not bookshelf_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bookshelf entry not found"
            )

        # Validate the status
        valid_statuses = ['to_read', 'reading', 'read', 'favorite']
        if entry_update.status and entry_update.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status inválido. Deve ser um dos seguintes: {', '.join(valid_statuses)}"
            )

        # Update fields
        update_data = entry_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(bookshelf_entry, field, value)

        # If updating pages read, check if it doesn't exceed total
        if 'pages_read' in update_data and bookshelf_entry.total_pages:
            if update_data['pages_read'] > bookshelf_entry.total_pages:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pages read cannot exceed total pages"
                )
            # If read all pages, mark as read
            if update_data['pages_read'] == bookshelf_entry.total_pages:
                bookshelf_entry.status = 'read'

        self.db.commit()
        self.db.refresh(bookshelf_entry)
        return bookshelf_entry

    def remove_from_bookshelf(self, bookshelf_id: int, user_id: int) -> dict:
        bookshelf = self.db.query(UserBookshelf).filter(
            UserBookshelf.id == bookshelf_id,
            UserBookshelf.user_id == user_id
        ).first()
        
        if not bookshelf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bookshelf entry not found"
            )
        
        self.db.delete(bookshelf)
        self.db.commit()
        
        return {"message": "Book removed from bookshelf successfully"}

    def search_books(self, query: str) -> List[BookSchema]:
        search_query = f"%{query}%"
        books = self.db.query(Book).filter(
            or_(
                Book.name.ilike(search_query),
                Book.subtitle.ilike(search_query),
                Book.category.ilike(search_query),
                Book.isbn13.ilike(search_query),
                Book.isbn10.ilike(search_query)
            )
        ).order_by(Book.name).limit(10).all()
        
        return books or []

    def get_book_details(self, book_id: int, user_id: int) -> dict:
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Livro não encontrado"
            )

        # Get user's bookshelf entry for this book
        bookshelf_entry = self.db.query(UserBookshelf).filter(
            UserBookshelf.book_id == book_id,
            UserBookshelf.user_id == user_id
        ).first()

        return {
            "book": book,
            "bookshelf_entry": bookshelf_entry
        } 