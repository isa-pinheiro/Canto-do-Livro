import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, BookOpen, Bookmark, Star, BookCheck } from "lucide-react";
import Image from "next/image";
import { api } from '@/config/api';

interface AddBookDialogProps {
  onBookAdded: () => void;
}

interface Book {
  id: number;
  name: string;
  subtitle: string | null;
  category: string | null;
  cover_url: string | null;
  description: string | null;
  publication_year: number;
  num_pages: number;
  average_rating: number;
}

export function AddBookDialog({ onBookAdded }: AddBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('to_read');
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      console.log('Buscando livros...', searchQuery);
      const data = await api.searchBooks(searchQuery);
      console.log('Livros encontrados:', data);
      setSearchResults(data);
    } catch (error) {
      console.error('Erro completo:', error);
      let errorMessage = 'Falha ao buscar livros';
      
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
      setIsSearching(false);
    }
  };

  const handleAddBook = async (book: Book) => {
    setSelectedBook(book);
  };

  const handleConfirmAdd = async () => {
    if (!selectedBook) return;
    
    setLoading(true);
    try {
      console.log('Adicionando livro...', selectedBook);
      await api.addToBookshelf({
        book_id: selectedBook.id,
        status: selectedStatus,
        total_pages: selectedBook.num_pages || 0
      });

      toast({
        title: "Sucesso",
        description: "Livro adicionado à sua estante!",
      });

      setOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedBook(null);
      onBookAdded();
    } catch (error) {
      console.error('Erro ao adicionar livro:', error);
      let errorMessage = 'Falha ao adicionar livro';
      
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-900 hover:bg-purple-950 text-white font-medium">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Livro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="book-title">Adicionar Livro</DialogTitle>
          <DialogDescription className="book-subtitle">
            Busque um livro pelo título, autor ou ISBN.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-purple-900 font-medium">
              Adicionar à estante
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a estante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_read">Quero Ler</SelectItem>
                <SelectItem value="reading">Lendo</SelectItem>
                <SelectItem value="read">Lidos</SelectItem>
                <SelectItem value="favorite">Favoritos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search" className="text-purple-900 font-medium">
              Buscar livro
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o título, autor ou ISBN"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-purple-900 hover:bg-purple-950"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-purple-700">Buscando livros...</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedBook?.id === book.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-400'
                  }`}
                  onClick={() => handleAddBook(book)}
                >
                  <div className="flex gap-4">
                    <div className="relative w-[80px] h-[120px] flex-shrink-0">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.name}
                          fill
                          className="object-cover rounded"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-100 rounded flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-purple-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-purple-900 mb-1 line-clamp-2">
                        {book.name}
                      </h3>
                      {book.subtitle && (
                        <p className="text-sm text-purple-700 mb-2 line-clamp-2">
                          {book.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        {book.publication_year && (
                          <span className="flex items-center gap-1">
                            <Bookmark className="w-4 h-4" />
                            {book.publication_year}
                          </span>
                        )}
                        {book.num_pages > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {book.num_pages} páginas
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {book.average_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="text-center py-4 text-purple-700">
              Nenhum livro encontrado.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAdd}
            disabled={!selectedBook || loading}
            className="bg-purple-900 hover:bg-purple-950"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 