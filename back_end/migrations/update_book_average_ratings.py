import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adiciona o diretório raiz do projeto ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from back_end.configs.settings import settings
from back_end.models.bookshelf import Book, UserBookshelf
from back_end.models.user import User  # Importação extra para resolver dependência

def update_all_books_average_rating():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        books = session.query(Book).all()
        for book in books:
            ratings = session.query(UserBookshelf.rating).filter(
                UserBookshelf.book_id == book.id,
                UserBookshelf.rating.isnot(None),
                UserBookshelf.rating > 0
            ).all()
            if ratings:
                avg = round(sum(r[0] for r in ratings) / len(ratings), 2)
            else:
                avg = 0.0
            if book.average_rating != avg:
                print(f"Atualizando livro {book.id} - '{book.name}': {book.average_rating} -> {avg}")
                book.average_rating = avg
        session.commit()
        print("Médias corrigidas com sucesso!")
    except Exception as e:
        print(f"Erro ao atualizar médias: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    update_all_books_average_rating() 