from ..configs.settings import settings
from sqlalchemy import create_engine, MetaData, Table

# Criar engine do SQLAlchemy
engine = create_engine(settings.DATABASE_URL)

# Função para remover a tabela 'followers'
def run_migration():
    metadata = MetaData()
    metadata.reflect(bind=engine)
    if 'followers' in metadata.tables:
        followers = Table('followers', metadata, autoload_with=engine)
        followers.drop(engine)
        print("Tabela 'followers' removida com sucesso!")
    else:
        print("Tabela 'followers' não existe ou já foi removida.")

if __name__ == "__main__":
    run_migration() 