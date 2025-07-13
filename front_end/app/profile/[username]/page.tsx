'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User, ArrowLeft, Users } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/config/api';
import FollowersDialog from '@/components/FollowersDialog';

interface UserProfile {
  id: number;
  username: string;
  // email: string; // Removido para não exibir dado sensível
  profile_picture: string | null;
  created_at: string;
  full_name: string;
  is_following?: boolean;
  bookshelf_stats?: {
    total: number;
    want_to_read: number;
    reading: number;
    read: number;
  };
  follow_counts: {
    followers_count: number;
    following_count: number;
  };
}

interface UserAverageRating {
  average_rating: number;
  total_rated_books: number;
  total_read_books: number;
  message: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'followers' | 'following'>('followers');
  const [averageRating, setAverageRating] = useState<UserAverageRating | null>(null);
  const { toast } = useToast();

  // Unwrap the params Promise
  const resolvedParams = React.use(params);
  const username = resolvedParams.username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile?.id) {
      api.getUserAverageRatingById(profile.id)
        .then((data) => setAverageRating(data as UserAverageRating))
        .catch(() => setAverageRating(null));
    }
  }, [profile?.id]);

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
      const data = await api.getUserByUsername(username) as UserProfile;

      
      // Verificar se follow_counts existe e tem os valores corretos
      if (data.follow_counts) {
        console.log('follow_counts existe:', data.follow_counts);
        console.log('followers_count:', data.follow_counts.followers_count);
        console.log('following_count:', data.follow_counts.following_count);
      } else {
        console.log('follow_counts é null ou undefined');
      }
      
      setProfile(data);
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

      
      let response;
      if (profile.is_following) {
        console.log('Executando unfollow...');
        response = await api.unfollowUser(profile.id);
      } else {
        console.log('Executando follow...');
        response = await api.followUser(profile.id);
      }

      console.log('Resposta do backend:', response);
      const newFollowStatus = response.is_following;
      console.log('Novo status de seguimento:', newFollowStatus);

      setProfile(prev => prev ? {
        ...prev,
        is_following: newFollowStatus,
        follow_counts: {
          followers_count: newFollowStatus 
            ? (prev.follow_counts?.followers_count ?? 0) + 1 
            : (prev.follow_counts?.followers_count ?? 0) - 1,
          following_count: prev.follow_counts?.following_count ?? 0
        }
      } : null);

      toast({
        title: "Sucesso",
        description: newFollowStatus ? "Você começou a seguir este usuário" : "Você deixou de seguir este usuário",
      });
    } catch (error) {
      console.error('Erro ao atualizar status de seguimento:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar status de seguimento",
        variant: "destructive",
      });
    }
  };

  const handleShowFollowers = () => {
    setDialogType('followers');
    setShowFollowersDialog(true);
  };

  const handleShowFollowing = () => {
    setDialogType('following');
    setShowFollowingDialog(true);
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
                      src={`http://localhost:8000${profile.profile_picture}`}
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

                <Button
                  onClick={handleFollow}
                  className={`mt-4 ${
                    profile.is_following 
                      ? 'bg-purple-800 hover:bg-red-600 hover:text-white group' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } transition-colors duration-200 relative`}
                >
                  <span className={`${profile.is_following ? 'group-hover:hidden' : ''}`}>
                    {profile.is_following ? 'Seguindo' : 'Seguir'}
                  </span>
                  {profile.is_following && (
                    <span className="hidden group-hover:inline">
                      Deixar de seguir
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Contadores de Seguidores e Seguindo */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-heading text-purple-900 mb-4">Rede Social</h2>
            <div className="flex items-center gap-8 mb-6">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-3 rounded-lg transition-colors"
                onClick={handleShowFollowers}
              >
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Seguidores</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {profile.follow_counts?.followers_count ?? 0}
                  </p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-3 rounded-lg transition-colors"
                onClick={handleShowFollowing}
              >
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Seguindo</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {profile.follow_counts?.following_count ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {profile.bookshelf_stats && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-heading text-purple-900 mb-4">Estatísticas da Estante</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </div>
            </div>
          )}

          {averageRating && (
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-heading text-purple-900 mb-4">Avaliação Média</h2>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Substitua por seu componente de estrelas, se houver */}
                    <span className="text-2xl text-yellow-400">★</span>
                    <span className="text-lg font-medium text-purple-900">
                      {averageRating.average_rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                  <div>
                    <p><strong>Livros avaliados:</strong> {averageRating.total_rated_books}</p>
                    <p><strong>Total de livros lidos:</strong> {averageRating.total_read_books}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">{averageRating.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Seguidores */}
      <FollowersDialog
        isOpen={showFollowersDialog}
        onClose={() => setShowFollowersDialog(false)}
        userId={profile.id}
        type="followers"
        title="Seguidores"
      />

      {/* Modal de Seguindo */}
      <FollowersDialog
        isOpen={showFollowingDialog}
        onClose={() => setShowFollowingDialog(false)}
        userId={profile.id}
        type="following"
        title="Seguindo"
      />
    </div>
  );
} 