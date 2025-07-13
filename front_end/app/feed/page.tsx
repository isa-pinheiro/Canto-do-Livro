// app/dashboard/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { api } from '@/config/api';

interface FeedEntry {
  id: number;
  user_id: number;
  book_id: number;
  status: string;
  pages_read: number;
  total_pages: number;
  rating?: number;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    profile_picture: string | null;
  };
}

export default function Dashboard() {
  const router = useRouter()
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/login")
    } else {
      fetchFeed();
    }
  }, [])

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await api.getFeed();
      setFeed(data);
    } catch (e) {
      // erro
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Carregando feed...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-start py-8 px-4">
      <h1 className="section-title mb-8">Feed de Leituras</h1>
      <div className="w-full max-w-2xl space-y-4">
        {feed.length === 0 && <div className="text-left">Nenhuma movimentação recente dos usuários que você segue.</div>}
        {feed.map(entry => (
          <Card key={entry.id} className="bg-card text-card-foreground flex flex-row items-center gap-4 p-4">
            {/* Foto do usuário */}
            <div className="flex-shrink-0">
              {entry.user?.profile_picture ? (
                <img src={entry.user.profile_picture} alt={entry.user.username} className="w-12 h-12 rounded-full object-cover border-2 border-purple-300" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-lg font-bold text-purple-700">
                  {entry.user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            {/* Conteúdo do feed */}
            <div className="flex-1">
              <div className="font-semibold text-purple-900">
                {entry.user?.username || `Usuário #${entry.user_id}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {renderFeedMessage(entry)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(entry.updated_at).toLocaleString('pt-BR')}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function renderStatus(status: string) {
  if (status === 'reading') return ' começou a ler um livro';
  if (status === 'read') return ' concluiu a leitura de um livro';
  if (status === 'favorite') return ' favoritou um livro';
  return '';
}

// Nova função para mensagem do feed
function renderFeedMessage(entry: FeedEntry) {
  let msg = '';
  if (entry.status === 'reading') {
    msg = 'começou a ler';
  } else if (entry.status === 'read') {
    msg = 'concluiu a leitura de';
  } else if (entry.status === 'favorite') {
    msg = 'favoritou';
  }
  // Exibe progresso se houver
  if (entry.pages_read && entry.total_pages) {
    msg += ` (progresso: ${entry.pages_read}/${entry.total_pages} páginas)`;
  }
  // Exibe avaliação se houver
  if (entry.rating) {
    msg += ` e avaliou com ${entry.rating} estrela${entry.rating > 1 ? 's' : ''}`;
  }
  // Nome do livro (se disponível)
  if ((entry as any).book?.title) {
    msg += ` o livro "${(entry as any).book.title}"`;
  } else {
    msg += ` o livro #${entry.book_id}`;
  }
  return msg;
}