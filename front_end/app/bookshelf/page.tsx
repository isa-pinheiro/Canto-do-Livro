'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { AddBookDialog } from "@/components/AddBookDialog";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { BookOpen, Star, Calendar } from 'lucide-react';
import { api } from '@/config/api';
import { Navbar } from '@/components/Navbar';

interface Book {
  id: number;
  name: string;
  subtitle?: string;
  cover_url?: string;
  publication_year?: number;
  average_rating: number;
  status: 'to_read' | 'reading' | 'read' | 'favorite';
  current_page?: number;
  total_pages?: number;
}

interface BookshelfEntry {
  id: number;
  book: Book;
  status: 'to_read' | 'reading' | 'read' | 'favorite';
  current_page: number;
  total_pages?: number;
}

export default function BookshelfPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookshelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('to_read');
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchBookshelf();
  }, [router]);

  const fetchBookshelf = async () => {
    try {
      console.log('Iniciando busca da estante...');
      const data = await api.getBookshelf();
      console.log('Dados da estante recebidos:', data);
      setBooks(data);
    } catch (error) {
      console.error('Erro completo:', error);
      let errorMessage = 'Falha ao carregar estante';
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAdded = () => {
    fetchBookshelf();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-700">Carregando sua estante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end mb-6">
            <AddBookDialog onBookAdded={handleBookAdded} />
          </div>

          <Tabs defaultValue="to_read" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="to_read" className="text-purple-700 data-[state=active]:bg-purple-100">
                Quero Ler
              </TabsTrigger>
              <TabsTrigger value="reading" className="text-purple-700 data-[state=active]:bg-purple-100">
                Lendo
              </TabsTrigger>
              <TabsTrigger value="read" className="text-purple-700 data-[state=active]:bg-purple-100">
                Lidos
              </TabsTrigger>
              <TabsTrigger value="favorite" className="text-purple-700 data-[state=active]:bg-purple-100">
                Favoritos
              </TabsTrigger>
            </TabsList>

            {['to_read', 'reading', 'read', 'favorite'].map((status) => (
              <TabsContent key={status} value={status}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {books
                    .filter(entry => entry.status === status)
                    .map(entry => (
                      <div
                        key={entry.id}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/bookshelf/book/${entry.book.id}`)}
                      >
                        <div className="relative w-[150px] h-[225px] mx-auto">
                          {entry.book.cover_url ? (
                            <Image
                              src={entry.book.cover_url}
                              alt={entry.book.name}
                              fill
                              className="object-cover"
                              sizes="150px"
                            />
                          ) : (
                            <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-purple-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-heading text-lg text-purple-900 mb-1 line-clamp-2">
                            {entry.book.name}
                          </h3>
                          {entry.book.subtitle && (
                            <p className="text-sm text-purple-700 mb-2 line-clamp-2">
                              {entry.book.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-purple-600">
                            {entry.book.publication_year && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {entry.book.publication_year}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              {entry.book.average_rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
} 