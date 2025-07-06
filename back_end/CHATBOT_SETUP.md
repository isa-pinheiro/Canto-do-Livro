# Configuração do Chatbot

## Problema
O chatbot não está funcionando porque a chave da API do Google não está configurada.

## Solução

### 1. Obter a chave da API do Google
1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar a chave
Crie um arquivo `.env` na pasta `back_end/` com o seguinte conteúdo:

```
GOOGLE_API_KEY=sua_chave_aqui
```

### 3. Instalar dependências
Certifique-se de que as dependências estão instaladas:

```bash
cd back_end
pip install -r requirements.txt
```

### 4. Reiniciar o servidor
Após configurar a chave, reinicie o servidor backend:

```bash
cd back_end
python main.py
```

## Modo Fallback
Se a chave da API não estiver configurada, o chatbot funcionará em modo básico com respostas predefinidas.

## Funcionalidades
- Com a API configurada: Recomendações inteligentes de livros
- Sem a API: Respostas básicas e informativas 