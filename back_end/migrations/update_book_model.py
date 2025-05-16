import os
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from configs.settings import settings

def run_migration():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Start transaction
        with connection.begin():
            # Add new columns if they don't exist
            connection.execute(text("""
                DO $$ 
                BEGIN
                    -- Add publication_year if it doesn't exist
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                 WHERE table_name = 'books' AND column_name = 'publication_year') THEN
                        ALTER TABLE books ADD COLUMN publication_year INTEGER;
                    END IF;

                    -- Add num_pages if it doesn't exist
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                 WHERE table_name = 'books' AND column_name = 'num_pages') THEN
                        ALTER TABLE books ADD COLUMN num_pages INTEGER;
                    END IF;

                    -- Add created_at if it doesn't exist
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                 WHERE table_name = 'books' AND column_name = 'created_at') THEN
                        ALTER TABLE books ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                    END IF;

                    -- Add updated_at if it doesn't exist
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                 WHERE table_name = 'books' AND column_name = 'updated_at') THEN
                        ALTER TABLE books ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                    END IF;

                    -- Modify column types if needed
                    ALTER TABLE books 
                        ALTER COLUMN name TYPE VARCHAR(512),
                        ALTER COLUMN subtitle TYPE VARCHAR(512),
                        ALTER COLUMN category TYPE VARCHAR(255),
                        ALTER COLUMN cover_url TYPE VARCHAR(1024);

                    -- Drop publication_date if it exists
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'books' AND column_name = 'publication_date') THEN
                        ALTER TABLE books DROP COLUMN publication_date;
                    END IF;
                END $$;
            """))

if __name__ == "__main__":
    run_migration()
    print("Migration completed successfully!") 