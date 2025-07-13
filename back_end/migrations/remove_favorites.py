# back_end/migrations/remove_favorites.py

import sys
import os

# Caminho absoluto para a raiz do projeto (dois níveis acima)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from back_end.configs.settings import settings
from sqlalchemy import create_engine, text

def remove_favorites():
    """
    Migração para remover todos os registros com status 'favorite' da tabela user_bookshelves.
    """
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as connection:
        # Contar registros antes da remoção
        result = connection.execute(text("SELECT COUNT(*) FROM user_bookshelves WHERE status = 'favorite'"))
        count_before = result.scalar()
        print(f"Encontrados {count_before} registros com status 'favorite'")

        if count_before > 0:
            # Remover todos os registros com status 'favorite'
            connection.execute(text("DELETE FROM user_bookshelves WHERE status = 'favorite'"))
            connection.commit()
            print(f"Removidos {count_before} registros com status 'favorite'")
        else:
            print("Nenhum registro com status 'favorite' encontrado")

        # Verificar se a remoção foi bem-sucedida
        result = connection.execute(text("SELECT COUNT(*) FROM user_bookshelves WHERE status = 'favorite'"))
        count_after = result.scalar()
        print(f"Registros restantes com status 'favorite': {count_after}")

if __name__ == "__main__":
    print("Iniciando migração para remover favoritos...")
    remove_favorites()
    print("Migração concluída!")
