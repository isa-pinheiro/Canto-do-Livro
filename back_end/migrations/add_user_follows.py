from ..configs.settings import settings
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, ForeignKey
from sqlalchemy.orm import sessionmaker

# Criar engine do SQLAlchemy
engine = create_engine(settings.DATABASE_URL)

# Criar sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migration():
    metadata = MetaData()

    # Criar tabela user_follows
    user_follows = Table(
        'user_follows',
        metadata,
        Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),
        Column('following_id', Integer, ForeignKey('users.id'), primary_key=True)
    )

    # Executar migração
    metadata.create_all(engine)
    print("Migração concluída: Tabela user_follows criada com sucesso!")

if __name__ == "__main__":
    run_migration() 