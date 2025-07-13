from ..configs.settings import settings
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, ForeignKey, String, Boolean, DateTime
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

    # Criar tabela notifications
    notifications = Table(
        'notifications',
        metadata,
        Column('id', Integer, primary_key=True),
        Column('user_id', Integer, ForeignKey('users.id')),
        Column('type', String),
        Column('message', String),
        Column('is_read', Boolean, default=False),
        Column('created_at', DateTime(timezone=True)),
    )

    # Executar migração
    metadata.create_all(engine)
    print("Migração concluída: Tabela user_follows e notifications criadas com sucesso!")

if __name__ == "__main__":
    run_migration() 