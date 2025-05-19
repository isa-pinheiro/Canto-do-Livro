from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Literal
from datetime import datetime
from sqlalchemy import or_

from back_end.models.bookshelf import Book, UserBookshelf
from back_end.models.base import get_db
from back_end.schemas.book import BookCreate, Book as BookSchema
from back_end.schemas.bookshelf import BookshelfEntry, BookshelfEntryUpdate, BookshelfEntryCreate
from back_end.auth.auth import get_current_user

router = APIRouter(prefix="/bookshelf", tags=["bookshelf"])

@router.get("/", response_model=List[BookshelfEntry])
async def get_bookshelf(
    status: Optional[str] = Query(None, pattern='^(to_read|reading|read|favorite)$'),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(UserBookshelf).filter(UserBookshelf.user_id == current_user["id"])
    if status:
        query = query.filter(UserBookshelf.status == status)
    
    bookshelves = query.all()
    return bookshelves

@router.post("/", response_model=BookshelfEntry, status_code=201)
async def add_to_bookshelf(
    book_data: dict,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Não autorizado. Por favor, faça login novamente."
            )

        # Get the book by ID
        book = db.query(Book).filter(Book.id == book_data["book_id"]).first()
        if not book:
            raise HTTPException(
                status_code=404,
                detail="Livro não encontrado"
            )

        # Check if book is already in user's bookshelf
        existing_entry = db.query(UserBookshelf).filter(
            UserBookshelf.user_id == current_user["id"],
            UserBookshelf.book_id == book.id
        ).first()

        if existing_entry:
            raise HTTPException(
                status_code=400,
                detail="Este livro já está na sua estante"
            )

        # Create bookshelf entry with total_pages from book or provided value
        total_pages = book_data.get("total_pages")
        if total_pages is None:
            total_pages = book.num_pages

        bookshelf = UserBookshelf(
            user_id=current_user["id"],
            book_id=book.id,
            status=book_data["status"],
            total_pages=total_pages
        )
        
        db.add(bookshelf)
        db.commit()
        db.refresh(bookshelf)
        
        return bookshelf
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print(f"Error adding book to bookshelf: {str(e)}")  # Add logging
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao adicionar livro à estante: {str(e)}"
        )

@router.patch("/{entry_id}", response_model=BookshelfEntry)
async def update_bookshelf_entry(
    entry_id: int,
    entry_update: BookshelfEntryUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a bookshelf entry
    """
    try:
        print(f"Atualizando entrada {entry_id} para usuário {current_user['id']}")
        print(f"Dados de atualização: {entry_update.dict()}")
        
        # Buscar a entrada na estante
        bookshelf_entry = db.query(UserBookshelf).filter(
            UserBookshelf.id == entry_id,
            UserBookshelf.user_id == current_user["id"]
        ).first()

        if not bookshelf_entry:
            print(f"Entrada não encontrada: {entry_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bookshelf entry not found"
            )

        # Validar o status
        valid_statuses = ['to_read', 'reading', 'read', 'favorite']
        if entry_update.status and entry_update.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Status inválido. Deve ser um dos seguintes: {', '.join(valid_statuses)}"
            )

        # Atualizar campos
        update_data = entry_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            print(f"Atualizando {field} para {value}")
            setattr(bookshelf_entry, field, value)

        # Se estiver atualizando as páginas lidas, verificar se não excede o total
        if 'pages_read' in update_data and bookshelf_entry.total_pages:
            if update_data['pages_read'] > bookshelf_entry.total_pages:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pages read cannot exceed total pages"
                )
            # Se leu todas as páginas, marcar como lido
            if update_data['pages_read'] == bookshelf_entry.total_pages:
                bookshelf_entry.status = 'read'

        db.commit()
        db.refresh(bookshelf_entry)
        
        print(f"Entrada atualizada com sucesso: {bookshelf_entry.status}")
        return bookshelf_entry

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar entrada da estante: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar entrada da estante: {str(e)}"
        )

@router.delete("/{bookshelf_id}")
async def remove_from_bookshelf(
    bookshelf_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookshelf = db.query(UserBookshelf).filter(
        UserBookshelf.id == bookshelf_id,
        UserBookshelf.user_id == current_user["id"]
    ).first()
    
    if not bookshelf:
        raise HTTPException(status_code=404, detail="Bookshelf entry not found")
    
    db.delete(bookshelf)
    db.commit()
    
    return {"message": "Book removed from bookshelf successfully"}

@router.get("/search", response_model=List[BookSchema])
async def search_books(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    try:
        search_query = f"%{query}%"
        books = db.query(Book).filter(
            or_(
                Book.name.ilike(search_query),
                Book.subtitle.ilike(search_query),
                Book.category.ilike(search_query),
                Book.isbn13.ilike(search_query),
                Book.isbn10.ilike(search_query)
            )
        ).order_by(Book.name).limit(10).all()
        
        if not books:
            return []
            
        return books
    except Exception as e:
        print(f"Error searching books: {str(e)}")  # Add logging
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar livros: {str(e)}"
        )

@router.get("/books/{book_id}")
async def get_book_details(
    book_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Busca os detalhes de um livro específico e sua entrada na estante do usuário.
    """
    try:
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(
                status_code=404,
                detail="Livro não encontrado"
            )

        # Busca a entrada na estante do usuário
        bookshelf_entry = db.query(UserBookshelf).filter(
            UserBookshelf.book_id == book_id,
            UserBookshelf.user_id == current_user["id"]
        ).first()

        return {
            "book": book,
            "bookshelf_entry": bookshelf_entry
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar detalhes do livro: {str(e)}"
        ) 