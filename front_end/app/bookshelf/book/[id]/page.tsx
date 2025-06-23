'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, BookOpen, Star, Calendar, Bookmark } from 'lucide-react';
import { use } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { api } from '@/config/api';
import { StarRating } from '@/components/ui/StarRating';

interface Book {
  id: number;
  name: string;
  subtitle: string | null;
  category: string | null;
  cover_url: string | null;
  description: string | null;
  publication_year: number;
  average_rating: number;
  num_pages: number;
}

interface BookshelfEntry {
  id: number;
  status: 'to_read' | 'reading' | 'read' | 'favorite';
  pages_read: number;
  total_pages: number;
  rating: number | null;
}

export default function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [bookshelfEntry, setBookshelfEntry] = useState<BookshelfEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const resolvedParams = use(params);

  const [formData, setFormData] = useState({
    status: '',
    pages_read: 0,
    total_pages: 0,
    rating: null as number | null,
  });

  useEffect(() => {
    fetchBookDetails();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (bookshelfEntry) {
      console.log('BookshelfEntry atualizado:', bookshelfEntry);
      setFormData({
        status: bookshelfEntry.status,
        pages_read: bookshelfEntry.pages_read || 0,
        total_pages: bookshelfEntry.total_pages || book?.num_pages || 0,
        rating: bookshelfEntry.rating,
      });
    }
  }, [bookshelfEntry, book]);

  const fetchBookDetails = async () => {
    try {
      console.log('Buscando detalhes do livro...');
      const data = await api.getBookDetails(parseInt(resolvedParams.id));
      console.log('Dados recebidos:', data);
      setBook(data.book);
      setBookshelfEntry(data.bookshelf_entry);
    } catch (error) {
      console.error('Erro ao buscar detalhes do livro:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar detalhes do livro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (value: string) => {
    try {
      if (!bookshelfEntry) {
        console.error('Entrada da estante não encontrada');
        return;
      }

      console.log('Atualizando status para:', value);
      console.log('Dados sendo enviados:', {
        status: value,
        pages_read: value === 'reading' ? 0 : formData.pages_read,
        total_pages: formData.total_pages
      });

      const updatedEntry = await api.updateBookshelfEntry(bookshelfEntry.id, {
        status: value,
        pages_read: value === 'reading' ? 0 : formData.pages_read,
        total_pages: formData.total_pages
      });

      console.log('Entrada atualizada:', updatedEntry);
      setBookshelfEntry(updatedEntry);
      setFormData(prev => ({
        ...prev,
        status: value,
        pages_read: value === 'reading' ? 0 : updatedEntry.pages_read || 0,
        total_pages: updatedEntry.total_pages || 0
      }));

      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });

      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handlePagesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Se o valor for vazio, apenas atualiza o estado
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        pages_read: 0
      }));
      return;
    }

    // Converte para número
    const numValue = parseInt(value);

    // Se não for um número válido, ignora
    if (isNaN(numValue)) {
      return;
    }

    // Se for maior que o total, mostra erro
    if (numValue > formData.total_pages) {
      toast({
        title: "Atenção",
        description: "O número de páginas lidas não pode ser maior que o total de páginas",
        variant: "destructive",
      });
      return;
    }

    // Apenas atualiza o estado local
    setFormData(prev => ({
      ...prev,
      pages_read: numValue
    }));
  };

  const handlePagesUpdate = async () => {
    try {
      if (!bookshelfEntry) {
        console.error('Entrada da estante não encontrada');
        return;
      }

      console.log('Atualizando páginas lidas:', formData.pages_read);
      const updatedEntry = await api.updateBookshelfEntry(bookshelfEntry.id, {
        pages_read: formData.pages_read,
        total_pages: formData.total_pages
      });

      console.log('Entrada atualizada:', updatedEntry);
      setBookshelfEntry(updatedEntry);
      
      toast({
        title: "Sucesso",
        description: "Progresso atualizado com sucesso",
      });

      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar páginas lidas:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar páginas lidas",
        variant: "destructive",
      });
    }
  };

  const handleRemoveBook = async () => {
    try {
      console.log('Iniciando remoção do livro...');
      if (!bookshelfEntry) {
        console.log('BookshelfEntry não encontrado');
        toast({
          title: "Erro",
          description: "Livro não encontrado na estante",
          variant: "destructive",
        });
        return;
      }

      console.log('Dados para remoção:', {
        bookshelfId: bookshelfEntry.id
      });

      await api.removeFromBookshelf(bookshelfEntry.id);

      toast({
        title: "Sucesso",
        description: "Livro removido da estante com sucesso",
      });

      // Força o redirecionamento
      window.location.href = '/bookshelf';
    } catch (error) {
      console.error('Erro ao remover livro:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao remover livro da estante",
        variant: "destructive",
      });
    }
  };

  const handleRatingChange = async (newRating: number) => {
    if (!bookshelfEntry) return;

    try {
      const updatedEntry = await api.updateBookshelfEntry(bookshelfEntry.id, {
        rating: newRating,
      });
      setBookshelfEntry(updatedEntry);
      toast({
        title: 'Avaliação atualizada',
        description: `Sua avaliação de ${newRating} estrelas foi salva.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error);
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Falha ao atualizar a avaliação',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-700">Carregando detalhes do livro...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <p className="text-purple-700">Livro não encontrado</p>
          <Button 
            onClick={() => router.back()}
            className="mt-4 bg-purple-600 hover:bg-purple-700"
            variant="outline"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-heading text-purple-900">{book?.name}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coluna da Esquerda - Capa do Livro */}
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-[300px] aspect-[2/3] mb-4">
                {book?.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.name}
                    fill
                    className="object-cover rounded-lg shadow-md"
                    sizes="300px"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-purple-400" />
                  </div>
                )}
              </div>
              {book?.subtitle && (
                <p className="text-lg text-purple-700 text-center font-sans">{book.subtitle}</p>
              )}
            </div>

            {/* Coluna da Direita - Detalhes do Livro */}
            <div className="md:col-span-2">
              <div className="space-y-6">
                {/* Status de Leitura */}
                <div className="flex items-center gap-4">
                  <Bookmark className="w-5 h-5 text-purple-500" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Select
                        defaultValue={bookshelfEntry?.status || 'to_read'}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to_read">Quero Ler</SelectItem>
                          <SelectItem value="reading">Lendo</SelectItem>
                          <SelectItem value="read">Lido</SelectItem>
                          <SelectItem value="favorite">Favorito</SelectItem>
                        </SelectContent>
                      </Select>

                      {bookshelfEntry?.status === 'reading' && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max={formData.total_pages}
                              value={formData.pages_read || ''}
                              onChange={handlePagesInputChange}
                              className="w-24"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-500">de {formData.total_pages} páginas</span>
                          </div>
                          <Button 
                            onClick={handlePagesUpdate}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Atualizar Progresso
                          </Button>
                        </div>
                      )}
                    </div>

                    {bookshelfEntry?.status === 'reading' && formData.total_pages > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Progresso</span>
                          <span>{Math.round((formData.pages_read / formData.total_pages) * 100)}%</span>
                        </div>
                        <Progress value={(formData.pages_read / formData.total_pages) * 100} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {book.description && (
                  <p className="text-sm text-purple-700 mb-4">{book.description}</p>
                )}

                {bookshelfEntry?.status === 'read' && (
                  <div className="my-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Sua Avaliação</h3>
                    <StarRating
                      rating={formData.rating || 0}
                      onRatingChange={handleRatingChange}
                    />
                  </div>
                )}

                {/* Detalhes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-purple-100">
                  {book?.publication_year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      <span className="text-purple-700">Publicado em {book.publication_year}</span>
                    </div>
                  )}
                  {book?.num_pages && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      <span className="text-purple-700">{book.num_pages} páginas</span>
                    </div>
                  )}
                  {book?.average_rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-500" />
                      <span className="text-purple-700">Avaliação média: {book.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {book?.category && (
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-purple-500" />
                      <span className="text-purple-700">{book.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Remover no Rodapé */}
          <div className="mt-8 pt-6 border-t border-purple-100 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/bookshelf')}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Voltar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover da Estante
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita. Isso removerá permanentemente o livro da sua estante.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveBook}>Remover</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
} 