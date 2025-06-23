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
    
    # Add rating column
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user_bookshelves' 
                AND column_name = 'rating';
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Add rating if it doesn't exist
            if 'rating' not in existing_columns:
                connection.execute(text("""
                    ALTER TABLE user_bookshelves 
                    ADD COLUMN rating FLOAT;
                """))
                print("Coluna rating adicionada com sucesso!")
            else:
                print("Coluna rating já existe!")
            
            connection.commit()
            print("Migração concluída com sucesso!")
                
        except Exception as e:
            print(f"Erro durante a migração: {str(e)}")
            connection.rollback()

if __name__ == "__main__":
    migrate() 