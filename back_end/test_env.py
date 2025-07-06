import os
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis de ambiente do arquivo .env
env_path = Path(__file__).parent / '.env'
print(f"Procurando arquivo .env em: {env_path}")
print(f"Arquivo existe: {env_path.exists()}")

load_dotenv(env_path)

# Verificar se a variável foi carregada
api_key = os.getenv('GOOGLE_API_KEY')
print(f"GOOGLE_API_KEY encontrada: {api_key is not None}")
if api_key:
    print(f"Primeiros 10 caracteres da chave: {api_key[:10]}...")
else:
    print("GOOGLE_API_KEY não encontrada!") 