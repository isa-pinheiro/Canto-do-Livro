from sqlalchemy import create_engine, MetaData, Table, inspect
from sqlalchemy.orm import sessionmaker
from Configs.database import engine, Base
from Configs.models import User

# Criar uma sessão
Session = sessionmaker(bind=engine)
session = Session()

def check_database():
    # Verificar se a tabela existe
    inspector = inspect(engine)
    if 'users' not in inspector.get_table_names():
        print("A tabela 'users' não existe no banco de dados!")
        return

    # Selecionar todos os usuários
    users = session.query(User).all()
    
    if not users:
        print("Nenhum usuário encontrado no banco de dados!")
        return

    print("\nUsuários no banco de dados:")
    print("-" * 50)
    for user in users:
        print(f"ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Full Name: {user.full_name}")
        print(f"Disabled: {user.disabled}")
        print("-" * 50)

if __name__ == "__main__":
    check_database() 