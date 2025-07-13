import sys
import os

# Caminho absoluto para a raiz do projeto (dois níveis acima)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from back_end.configs.settings import settings
from sqlalchemy import create_engine, text
def upgrade():
    """Adiciona o campo is_favorite à tabela user_bookshelves"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Adiciona a coluna is_favorite com valor padrão False
        conn.execute(text("""
            ALTER TABLE user_bookshelves 
            ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE
        """))
        conn.commit()
    
    print("Campo is_favorite adicionado com sucesso à tabela user_bookshelves")

def downgrade():
    """Remove o campo is_favorite da tabela user_bookshelves"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE user_bookshelves 
            DROP COLUMN is_favorite
        """))
        conn.commit()
    
    print("Campo is_favorite removido com sucesso da tabela user_bookshelves")

if __name__ == "__main__":
    upgrade() 