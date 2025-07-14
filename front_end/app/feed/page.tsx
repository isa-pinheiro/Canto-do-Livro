"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { api } from '@/config/api'
import { API_BASE_URL } from '@/config/api'
import { Navbar } from '@/components/Navbar'
import { StarRatingDisplay } from '@/components/ui/StarRating'
import { Book, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeedEntry {
  id: number
  user_id: number
  book_id: number
  status: string
  pages_read: number | null
  total_pages?: number | null
  rating?: number | null
  is_favorite: boolean
  created_at: string
  updated_at: string
  user?: {
    id: number
    username: string
    full_name: string
    profile_picture: string | null
  } | null
  book?: {
    id: number
    name: string | null
    subtitle?: string | null
    cover_url?: string | null
    num_pages?: number | null
    average_rating?: number | null
  } | null
  activity_type?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [debugData, setDebugData] = useState<any>(null)
  const [simpleData, setSimpleData] = useState<any>(null)
  const [robustData, setRobustData] = useState<any>(null)

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR')
    } catch {
      return 'Data desconhecida'
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'to_read': return 'Quer ler'
      case 'reading': return 'Lendo'
      case 'read': return 'Lido'
      default: return status
    }
  }, [])

  const renderFeedMessage = useCallback((entry: FeedEntry) => {
    let msg = ''
    
    switch (entry.activity_type) {
      case 'rating':
        msg = `avaliou`
        break
      case 'favorite':
        msg = `marcou como favorito`
        break
      case 'completed':
        msg = `concluiu a leitura de`
        break
      case 'started_reading':
        msg = `começou a ler`
        break
      case 'progress':
        msg = `atualizou o progresso de`
        break
      case 'added_to_shelf':
        msg = `adicionou à lista de leitura`
        break
      default:
        if (entry.status === 'reading') {
          msg = 'começou a ler'
        } else if (entry.status === 'read') {
          msg = 'concluiu a leitura de'
        } else {
          msg = 'atualizou'
        }
    }
    
    if (entry.book?.name) {
      msg += ` "${entry.book.name}"`
    } else if (entry.book_id) {
      msg += ` o livro #${entry.book_id}`
    } else {
      msg += ' um livro'
    }
    
    return msg
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/login")
    } else {
      fetchFeed()
    }
  }, [router])

  const fetchFeed = async () => {
    setLoading(true)
    try {
      const data = await api.getFeed()
      if (Array.isArray(data)) {
        setFeed(data)
      } else {
        console.error('Feed data is not an array:', data)
        setFeed([])
      }
    } catch (error) {
      console.error('Erro ao carregar feed:', error)
      setFeed([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Carregando feed...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="section-title mb-8">Feed de Leituras</h1>
          
          <div className="mb-4">
          </div>
          
          <div className="w-full max-w-2xl space-y-4">
            {feed.length === 0 ? (
              <div className="text-left">Nenhuma movimentação recente dos usuários que você segue.</div>
            ) : (
              feed.map(entry => (
                <FeedEntryCard 
                  key={`${entry.id}-${entry.updated_at}`}
                  entry={entry}
                  formatDate={formatDate}
                  getStatusText={getStatusText}
                  renderFeedMessage={renderFeedMessage}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface FeedEntryCardProps {
  entry: FeedEntry
  formatDate: (dateString: string) => string
  getStatusText: (status: string) => string
  renderFeedMessage: (entry: FeedEntry) => string
}

function FeedEntryCard({ entry, formatDate, getStatusText, renderFeedMessage }: FeedEntryCardProps) {
  const BACKEND_URL = "http://localhost:8000";
  return (
    <Card className="bg-card text-card-foreground flex flex-row items-start gap-4 p-4">
      {/* Foto do usuário */}
      <div className="flex-shrink-0">
        {entry.user?.profile_picture ? (
          <img 
            src={
              entry.user.profile_picture.startsWith('/api/')
                ? BACKEND_URL + entry.user.profile_picture
                : entry.user.profile_picture
            }
            alt={entry.user.username} 
            className="w-12 h-12 rounded-full object-cover border-2 border-purple-300" 
          />
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
        
        {/* Informações do livro */}
        {entry.book && (
          <div className="mt-2 flex items-center gap-3">
            {entry.book.cover_url ? (
              <img 
                src={entry.book.cover_url} 
                alt={entry.book.name || `Capa do livro`}
                className="w-12 h-16 object-cover rounded border"
              />
            ) : (
              <div className="w-12 h-16 bg-gray-100 border rounded flex items-center justify-center">
                <Book className="text-gray-400 w-6 h-6" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="font-medium text-sm">{entry.book.name}</div>
              {entry.book.subtitle && (
                <div className="text-xs text-gray-500">{entry.book.subtitle}</div>
              )}
              
              {/* Avaliação do usuário */}
              {typeof entry.rating === 'number' && entry.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-600">Avaliação:</span>
                  <StarRatingDisplay rating={entry.rating} size="sm" />
                </div>
              )}
              
              {/* Progresso */}
              {typeof entry.pages_read === 'number' && typeof entry.total_pages === 'number' && entry.pages_read > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Progresso: {entry.pages_read}/{entry.total_pages} páginas
                </div>
              )}
              
              {/* Status do livro */}
              <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <span>Status: {getStatusText(entry.status)}</span>
                {entry.is_favorite && (
                  <Heart className="w-3 h-3 text-red-500 fill-current" />
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          {formatDate(entry.updated_at)}
        </div>
      </div>
    </Card>
  )
}