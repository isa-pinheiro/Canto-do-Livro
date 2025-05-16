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
    
    # Add profile_picture column
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='profile_picture';
            """))
            
            if not result.fetchone():
                connection.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN profile_picture VARCHAR;
                """))
                print("Coluna profile_picture adicionada com sucesso!")
            else:
                print("Coluna profile_picture já existe!")
            
            connection.commit()
            print("Migração concluída com sucesso!")
                
        except Exception as e:
            print(f"Erro durante a migração: {str(e)}")
            connection.rollback()

if __name__ == "__main__":
    migrate() 