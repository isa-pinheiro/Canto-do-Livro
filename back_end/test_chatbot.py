import sys
import os
from pathlib import Path

# Adicionar o diretório pai ao path para importar os módulos
sys.path.append(str(Path(__file__).parent.parent))

from back_end.services.chatbot_service import ChatbotService
from back_end.configs.database import get_db

def test_chatbot():
    # Obter uma sessão do banco de dados
    db = next(get_db())
    
    try:
        # Criar instância do chatbot
        chatbot = ChatbotService(db)
        
        print(f"Chatbot inicializado com API: {chatbot.has_api}")
        print(f"API Key configurada: {chatbot.api_key is not None}")
        
        if chatbot.api_key:
            print(f"Primeiros 10 caracteres da chave: {chatbot.api_key[:10]}...")
        
        # Testar uma mensagem
        test_message = "Olá, pode me recomendar um livro?"
        print(f"\nTestando mensagem: {test_message}")
        
        response = chatbot.chat(test_message)
        print(f"Resposta: {response}")
        
    except Exception as e:
        print(f"Erro ao testar chatbot: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_chatbot() 