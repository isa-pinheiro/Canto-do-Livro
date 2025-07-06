# Importar do módulo de database para evitar importação circular
from back_end.configs.database import engine, Base, get_db, SessionLocal

# Re-exportar para manter compatibilidade
__all__ = ['engine', 'Base', 'get_db', 'SessionLocal'] 