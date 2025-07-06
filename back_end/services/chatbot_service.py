from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session
from back_end.models.bookshelf import Book
import os
from dotenv import load_dotenv
from pathlib import Path

# Carregar variáveis de ambiente do arquivo .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

class ChatbotService:
    def __init__(self, db: Session):
        self.db = db
        # Verificar se a chave da API está disponível
        self.api_key = os.getenv('GOOGLE_API_KEY')
        if self.api_key:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash",
                    temperature=0.7,
                )
                self.has_api = True
            except Exception as e:
                print(f"Erro ao inicializar o modelo: {e}")
                self.has_api = False
        else:
            self.has_api = False
            print("GOOGLE_API_KEY não configurada. Usando modo de fallback.")

    def get_all_books(self):
        return self.db.query(Book).all()

    def chat(self, user_message: str) -> str:
        if not self.has_api:
            # Resposta de fallback quando a API não está disponível
            return self._fallback_response(user_message)
        
        try:
            books = self.get_all_books()
            books_context = "\n".join([
                f"{book.name} ({book.category or 'Sem categoria'}) - {book.description or ''}" for book in books
            ])
            system_prompt = (
                "Você é um assistente de recomendação de livros. Sempre que o usuário pedir sugestão, recomende livros da lista abaixo.\n"
                f"Livros disponíveis:\n{books_context}\n"
                "Se o usuário pedir outra coisa, responda normalmente."
            )
            # Gemini não suporta SystemMessage, então inclua o prompt no início da mensagem humana
            messages = [
                HumanMessage(content=system_prompt + "\nUsuário: " + user_message)
            ]
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            print(f"Erro ao processar mensagem: {e}")
            return self._fallback_response(user_message)
    
    def _fallback_response(self, user_message: str) -> str:
        """Resposta de fallback quando a API do Google não está disponível"""
        user_message_lower = user_message.lower()
        
        if any(word in user_message_lower for word in ['oi', 'olá', 'hello', 'hi']):
            return "Olá! Sou o assistente do Canto do Livro. Como posso ajudar você hoje?"
        
        elif any(word in user_message_lower for word in ['recomenda', 'sugestão', 'livro', 'ler']):
            return "Desculpe, no momento não posso fazer recomendações específicas de livros. Para usar o chatbot com recomendações inteligentes, é necessário configurar a chave da API do Google. Por enquanto, você pode explorar os livros na sua estante!"
        
        elif any(word in user_message_lower for word in ['ajuda', 'help', 'como']):
            return "Posso ajudar você com informações sobre o Canto do Livro. Para usar o chatbot com recomendações inteligentes, é necessário configurar a chave da API do Google."
        
        else:
            return "Obrigado pela sua mensagem! No momento, o chatbot está em modo básico. Para usar funcionalidades avançadas como recomendações de livros, é necessário configurar a chave da API do Google." 