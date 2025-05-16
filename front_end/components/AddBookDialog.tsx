import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, BookOpen, Bookmark, Star, BookCheck } from "lucide-react";
import Image from "next/image";

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      console.log('Buscando livros...', searchQuery);
      const searchUrl = `${API_BASE_URL}/bookshelf/search?query=${encodeURIComponent(searchQuery)}`;
      console.log('URL da busca:', searchUrl);

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('Resposta da busca:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        console.error('Erro na busca:', errorData);
        throw new Error(errorData.detail || 'Falha ao buscar livros');
      }
      
      const data = await response.json();
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Token não encontrado. Por favor, faça login novamente.');
      }

      console.log('Adicionando livro...', selectedBook);
      const response = await fetch(`${API_BASE_URL}/bookshelf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          book_id: selectedBook.id,
          status: selectedStatus,
          total_pages: selectedBook.num_pages || 0
        }),
      });

      console.log('Resposta da adição:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        console.error('Erro ao adicionar:', errorData);
        throw new Error(errorData.detail || 'Falha ao adicionar livro');
      }

      const data = await response.json();
      console.log('Livro adicionado:', data);

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

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search" className="text-right text-purple-900 font-medium">
              Buscar
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Digite o título, autor ou ISBN"
                className="border-purple-200 focus:border-purple-500 font-sans"
              />
              <Button 
                onClick={handleSearch}
                className="bg-purple-900 hover:bg-purple-950 text-white font-medium"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}
        {error && (
          <div className="text-red-600 text-sm py-2 font-sans">{error}</div>
        )}
        
        {!selectedBook ? (
          <div className="max-h-[300px] overflow-y-auto">
            {searchResults.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-4 p-4 hover:bg-purple-50 cursor-pointer rounded-lg transition-colors"
                onClick={() => handleAddBook(book)}
              >
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.name}
                    width={50}
                    height={75}
                    className="rounded shadow-md"
                  />
                ) : (
                  <div className="w-[50px] h-[75px] bg-purple-100 rounded flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="card-title truncate">{book.name}</h3>
                  {book.subtitle && (
                    <p className="text-sm text-purple-700 truncate font-sans">{book.subtitle}</p>
                  )}
                  {book.category && (
                    <div className="flex items-center gap-1 mt-1">
                      <Bookmark className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-purple-600 font-sans">{book.category}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
              {selectedBook.cover_url ? (
                <Image
                  src={selectedBook.cover_url}
                  alt={selectedBook.name}
                  width={50}
                  height={75}
                  className="rounded shadow-md"
                />
              ) : (
                <div className="w-[50px] h-[75px] bg-purple-100 rounded flex items-center justify-center shadow-md">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="card-title truncate">{selectedBook.name}</h3>
                {selectedBook.subtitle && (
                  <p className="text-sm text-purple-700 truncate font-sans">{selectedBook.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          {selectedBook ? (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedBook(null)}
                className="text-purple-700 hover:bg-purple-50 font-medium"
              >
                Voltar
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmAdd}
                className="bg-purple-900 hover:bg-purple-950 text-white font-medium"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : 'Confirmar'}
              </Button>
            </>
          ) : (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="text-purple-700 hover:bg-purple-50 font-medium"
            >
              Cancelar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 