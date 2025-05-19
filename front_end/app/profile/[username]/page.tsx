'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User, ArrowLeft, Users } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/config/api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_picture: string | null;
  created_at: string;
  full_name: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  bookshelf_stats?: {
    total: number;
    want_to_read: number;
    reading: number;
    read: number;
    favorite: number;
  };
}

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [params.username]);

  const handleAuthError = () => {
    api.logout();
    toast({
      title: "Sessão expirada",
      description: "Por favor, faça login novamente",
      variant: "destructive",
    });
    router.push('/login');
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getUserByUsername(params.username);
      const followers = await api.getUserFollowers(data.id);
      const following = await api.getUserFollowing(data.id);
      
      setProfile({
        ...data,
        followers_count: followers.length,
        following_count: following.length,
        is_following: followers.some((f: any) => f.id === data.id)
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Token não encontrado') || error.message.includes('Sessão expirada')) {
          handleAuthError();
          return;
        }
        
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }
      
      router.push('/search');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      if (profile.is_following) {
        await api.unfollowUser(profile.id);
        setProfile(prev => prev ? {
          ...prev,
          is_following: false,
          followers_count: (prev.followers_count || 0) - 1
        } : null);
        toast({
          title: "Sucesso",
          description: "Você deixou de seguir este usuário",
        });
      } else {
        await api.followUser(profile.id);
        setProfile(prev => prev ? {
          ...prev,
          is_following: true,
          followers_count: (prev.followers_count || 0) + 1
        } : null);
        toast({
          title: "Sucesso",
          description: "Você começou a seguir este usuário",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status de seguimento:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar status de seguimento",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading text-purple-900 mb-4">Perfil não encontrado</h1>
          <Button
            onClick={() => router.push('/search')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para busca
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-heading text-purple-900">Perfil de {profile.username}</h1>
            <Button
              onClick={() => router.push('/search')}
              variant="ghost"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-purple-200">
                {profile.profile_picture ? (
                  <Image
                    src={profile.profile_picture}
                    alt={profile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-purple-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Nome de usuário</h2>
                  <p className="text-gray-700">{profile.username}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Nome completo</h2>
                  <p className="text-gray-700">{profile.full_name || 'Não definido'}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Membro desde</h2>
                  <p className="text-gray-700">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Seguidores</p>
                      <p className="text-lg font-semibold text-purple-900">{profile.followers_count || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Seguindo</p>
                      <p className="text-lg font-semibold text-purple-900">{profile.following_count || 0}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFollow}
                  variant={profile.is_following ? "outline" : "default"}
                  className={`mt-4 ${profile.is_following ? 'text-purple-600 border-purple-600 hover:bg-purple-50' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {profile.is_following ? 'Deixar de Seguir' : 'Seguir'}
                </Button>
              </div>
            </div>
          </div>

          {profile.bookshelf_stats && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-heading text-purple-900 mb-4">Estatísticas da Estante</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">Total</p>
                  <p className="text-2xl font-bold text-purple-900">{profile.bookshelf_stats.total}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">Quero ler</p>
                  <p className="text-2xl font-bold text-purple-900">{profile.bookshelf_stats.want_to_read}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">Lendo</p>
                  <p className="text-2xl font-bold text-purple-900">{profile.bookshelf_stats.reading}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">Lidos</p>
                  <p className="text-2xl font-bold text-purple-900">{profile.bookshelf_stats.read}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">Favoritos</p>
                  <p className="text-2xl font-bold text-purple-900">{profile.bookshelf_stats.favorite}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 