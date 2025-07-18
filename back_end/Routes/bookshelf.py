from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from back_end.models.base import get_db
from back_end.schemas.book import Book as BookSchema
from back_end.schemas.bookshelf import BookshelfEntry, BookshelfEntryUpdate, UserAverageRating
from back_end.auth.auth import get_current_user
from back_end.services.bookshelf_service import BookshelfService

router = APIRouter(prefix="/bookshelf", tags=["bookshelf"])

@router.get("/", response_model=List[BookshelfEntry])
async def get_bookshelf(
    status: Optional[str] = Query(None, pattern='^(to_read|reading|read)$'),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.get_user_bookshelf(current_user["id"], status)

@router.post("/", response_model=BookshelfEntry, status_code=201)
async def add_to_bookshelf(
    book_data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.add_to_bookshelf(current_user["id"], book_data)

@router.patch("/{entry_id}", response_model=BookshelfEntry)
async def update_bookshelf_entry(
    entry_id: int,
    entry_update: BookshelfEntryUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.update_bookshelf_entry(entry_id, current_user["id"], entry_update)

@router.patch("/{entry_id}/toggle-favorite", response_model=BookshelfEntry)
async def toggle_favorite(
    entry_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.toggle_favorite(entry_id, current_user["id"])

@router.delete("/{bookshelf_id}")
async def remove_from_bookshelf(
    bookshelf_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.remove_from_bookshelf(bookshelf_id, current_user["id"])

@router.get("/search", response_model=List[BookSchema])
async def search_books(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.search_books(query)

@router.get("/books/{book_id}")
async def get_book_details(
    book_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.get_book_details(book_id, current_user["id"])

@router.get("/average-rating", response_model=UserAverageRating)
async def get_user_average_rating(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna a média de estrelas que o usuário deu aos livros que já leu.
    Considera apenas livros marcados como 'read' e que possuem avaliação.
    """
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.get_user_average_rating(current_user["id"])

@router.get("/users/{user_id}/average-rating", response_model=UserAverageRating)
async def get_user_average_rating_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna a média de estrelas que um usuário específico deu aos livros que já leu.
    Considera apenas livros marcados como 'read' e que possuem avaliação.
    """
    bookshelf_service = BookshelfService(db)
    return bookshelf_service.get_user_average_rating_by_id(user_id) 