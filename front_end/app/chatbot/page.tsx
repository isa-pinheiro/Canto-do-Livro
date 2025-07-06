"use client";

import React, { useState } from 'react';
import { api } from '../../config/api';
import { Navbar } from '@/components/Navbar';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Olá! Como posso ajudar você hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { from: 'user', text: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput('');
    setLoading(true);
    try {
      // Substitua a URL abaixo pela rota real da sua API do bot
      const data = await api.chatbot(userMessage.text);
      setMessages((msgs) => [...msgs, { from: 'bot', text: data.response }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { from: 'bot', text: 'Erro ao conectar ao bot.' }]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 pt-8">
        <h1 className="text-2xl font-bold mb-4">🤖 Bot de Recomendação</h1>
        <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto flex flex-col gap-2 mb-4 border">
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm px-3 py-2 rounded-md w-fit ${msg.from === 'bot' ? 'bg-purple-100 text-purple-900 self-start' : 'bg-purple-600 text-white self-end'}`}>
              {msg.text}
            </div>
          ))}
          {loading && <div className="text-xs text-gray-500">Bot está digitando...</div>}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
} 