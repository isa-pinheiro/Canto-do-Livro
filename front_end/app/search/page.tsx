'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Search, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/config/api';
import { Navbar } from '@/components/Navbar';

interface UserSearchResult {
  id: number;
  username: string;
  full_name: string | null;
  profile_picture: string | null;
  created_at: string;
  bookshelf_stats: {
    total: number;
    want_to_read: number;
    reading: number;
    read: number;
    favorite: number;
  };
  is_following: boolean;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          searchUsers(searchQuery);
        } else {
          setUsers([]);
        }
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    },
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const searchUsers = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchUsers(searchQuery);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setError(error instanceof Error ? error.message : 'Falha ao buscar usuários');
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao buscar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: number, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await api.unfollowUser(userId);
      } else {
        await api.followUser(userId);
      }

      // Atualiza a lista de usuários
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            is_following: !isFollowing
          };
        }
        return user;
      }));

      toast({
        title: "Sucesso",
        description: isFollowing ? "Deixou de seguir o usuário" : "Usuário seguido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar status de seguimento:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar status de seguimento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-purple-50">
      <Navbar />
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4 mb-8">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Button>
            </div>

            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 bg-purple-50 border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>

            {error && (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-purple-700">Buscando usuários...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-purple-50 rounded-lg p-4 hover:bg-purple-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/users/${user.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-purple-200">
                        {user.profile_picture ? (
                          <Image
                            src={user.profile_picture}
                            alt={user.username}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {user.full_name || user.username}
                        </h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        <div className="mt-2 flex gap-2">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium text-purple-600">{user.bookshelf_stats.total}</span> livros
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium text-purple-600">{user.bookshelf_stats.read}</span> lidos
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(user.id, user.is_following);
                        }}
                        className={`${
                          user.is_following 
                            ? 'bg-gray-600 hover:bg-gray-700' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {user.is_following ? 'Deixar de seguir' : 'Seguir'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 