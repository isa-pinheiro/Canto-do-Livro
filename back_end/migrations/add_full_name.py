import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from configs.settings import settings

def migrate():
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Add columns
    with engine.connect() as conn:
        try:
            # Add full_name column if it doesn't exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='full_name';
            """))
            
            if not result.fetchone():
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN full_name VARCHAR;
                """))
                print("Coluna full_name adicionada com sucesso!")
            else:
                print("Coluna full_name já existe!")

            # Add disabled column if it doesn't exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='disabled';
            """))
            
            if not result.fetchone():
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN disabled BOOLEAN DEFAULT FALSE;
                """))
                print("Coluna disabled adicionada com sucesso!")
            else:
                print("Coluna disabled já existe!")

            # Add created_at column if it doesn't exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='created_at';
            """))
            
            if not result.fetchone():
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                """))
                print("Coluna created_at adicionada com sucesso!")
            else:
                print("Coluna created_at já existe!")

            # Add updated_at column if it doesn't exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='updated_at';
            """))
            
            if not result.fetchone():
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                """))
                print("Coluna updated_at adicionada com sucesso!")
            else:
                print("Coluna updated_at já existe!")

            conn.commit()
            print("Migração concluída com sucesso!")
                
        except Exception as e:
            print(f"Erro durante a migração: {str(e)}")
            conn.rollback()

if __name__ == "__main__":
    migrate() 