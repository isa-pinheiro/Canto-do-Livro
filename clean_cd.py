import psycopg2
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://usuario1:senha123@localhost:5432/canto_livro"
    class Config:
        env_file = ".env"

settings = Settings()

def check_tables_and_data():
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()

    # Obter nomes das tabelas no schema public
    cur.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public';
    """)
    tabelas = cur.fetchall()

    if not tabelas:
        print("Nenhuma tabela encontrada.")
        return

    for (tabela,) in tabelas:
        print(f"\n📄 Tabela: {tabela}")

        # Contar registros
        cur.execute(f"SELECT COUNT(*) FROM {tabela};")
        count = cur.fetchone()[0]
        print(f"  ➤ Total de registros: {count}")

        # Mostrar até 5 registros
        if count > 0:
            cur.execute(f"SELECT * FROM {tabela} LIMIT 5;")
            colunas = [desc[0] for desc in cur.description]
            dados = cur.fetchall()

            print(f"  ➤ Primeiros 5 registros:")
            print(f"     {colunas}")
            for linha in dados:
                print(f"     {linha}")
        else:
            print("  ➤ Nenhum dado na tabela.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    check_tables_and_data()
