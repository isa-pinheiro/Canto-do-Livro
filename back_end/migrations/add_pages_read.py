import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from configs.settings import settings

def migrate():
    # Create engine with explicit encoding
    engine = create_engine(
        settings.DATABASE_URL,
        client_encoding='utf8'
    )
    
    # Add pages_read and total_pages columns
    with engine.connect() as connection:
        try:
            # Check if columns exist
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user_bookshelves' 
                AND column_name IN ('pages_read', 'total_pages');
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Add pages_read if it doesn't exist
            if 'pages_read' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE user_bookshelves 
                    ADD COLUMN pages_read INTEGER DEFAULT 0;
                """))
                print("Coluna pages_read adicionada com sucesso!")
            else:
                print("Coluna pages_read já existe!")
            
            # Add total_pages if it doesn't exist
            if 'total_pages' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE user_bookshelves 
                    ADD COLUMN total_pages INTEGER;
                """))
                print("Coluna total_pages adicionada com sucesso!")
            else:
                print("Coluna total_pages já existe!")
            
            connection.commit()
            print("Migração concluída com sucesso!")
                
        except Exception as e:
            print(f"Erro durante a migração: {str(e)}")
            connection.rollback()

if __name__ == "__main__":
    migrate() 