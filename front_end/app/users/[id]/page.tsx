'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { User, Users, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { StarRatingDisplay } from '@/components/ui/StarRating';
import { api } from '@/config/api';

interface UserProfile {
  id: number;
  username: string;
  full_name: string | null;
  profile_picture: string | null;
  created_at: string;
  is_following?: boolean;
  bookshelf_stats: {
    total: number;
    want_to_read: number;
    reading: number;
    read: number;
    favorite: number;
  };
}

interface Follower {
  id: number;
  username: string;
  full_name: string | null;
  profile_picture: string | null;
}

interface UserAverageRating {
  average_rating: number;
  total_rated_books: number;
  total_read_books: number;
  message: string;
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Log quando o estado muda
  useEffect(() => {
    console.log('=== ESTADO ISFOLLOWING MUDOU ===');
    console.log('Novo valor:', isFollowing);
    console.log('Tipo:', typeof isFollowing);
  }, [isFollowing]);
  
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [averageRating, setAverageRating] = useState<UserAverageRating | null>(null);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    fetchUserProfile(userId);
    fetchFollowers(userId);
    fetchFollowing(userId);
    fetchAverageRating(userId);
  }, [userId]);

  const fetchUserProfile = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Falha ao buscar perfil do usuário');
      }

      const data = await response.json();
      console.log('=== DADOS DO PERFIL CARREGADOS ===');
      console.log('Dados completos:', data);
      console.log('is_following do backend:', data.is_following);
      console.log('Tipo de is_following:', typeof data.is_following);
      setProfile(data);
      // Set the follow status from the response
      const initialFollowStatus = Boolean(data.is_following);
      console.log('Definindo isFollowing inicial como:', initialFollowStatus);
      setIsFollowing(initialFollowStatus);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar perfil do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const fetchFollowers = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/users/${id}/followers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      setFollowers(data);
    } catch (error) {
      console.error('Erro ao buscar seguidores:', error);
    }
  };

  const fetchFollowing = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/users/${id}/following`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      setFollowing(data);
    } catch (error) {
      console.error('Erro ao buscar seguindo:', error);
    }
  };

  const fetchAverageRating = async (id: string) => {
    try {
      const data = await api.getUserAverageRatingById(Number(id)) as UserAverageRating;
      setAverageRating(data);
    } catch (error) {
      console.error('Erro ao carregar rating médio:', error);
      // Não mostrar toast de erro para não poluir a interface
    }
  };

  const handleFollow = async () => {
    try {
      if (!userId) return;
      
      console.log('=== HANDLE FOLLOW USER PROFILE ===');
      console.log('userId:', userId);
      console.log('Estado atual isFollowing:', isFollowing);
      console.log('Tipo de isFollowing:', typeof isFollowing);
      
      let response;
      if (isFollowing) {
        // Unfollow
        console.log('Executando unfollow...');
        response = await fetch(`http://localhost:8000/api/users/${userId}/unfollow`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
      } else {
        // Follow
        console.log('Executando follow...');
        response = await fetch(`http://localhost:8000/api/users/${userId}/follow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('=== ERRO NA RESPOSTA ===');
        console.error('Status:', response.status);
        console.error('Dados do erro:', errorData);
        throw new Error(errorData.detail || 'Falha ao atualizar status de seguimento');
      }
      
      const updatedUser = await response.json();
      console.log('Resposta do backend:', updatedUser);
      
      // Atualiza o estado com base no backend
      const newFollowStatus = updatedUser.is_following;
      console.log('Novo status de seguimento:', newFollowStatus);
      setIsFollowing(newFollowStatus);
      
      fetchFollowers(userId);
      toast({
        title: "Sucesso",
        description: newFollowStatus ? "Usuário seguido com sucesso" : "Deixou de seguir o usuário",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-700">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <p className="text-purple-700">Usuário não encontrado</p>
          <Button 
            onClick={() => router.back()}
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 py-12">
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
                  <p className="text-gray-900 text-lg font-medium">{profile.username}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Nome completo</h2>
                  <p className="text-gray-900">{profile.full_name || 'Não definido'}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Membro desde</h2>
                  <p className="text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div className="pt-4">
                  {console.log('=== RENDER DO BOTÃO ===')}
                  {console.log('isFollowing no render:', isFollowing)}
                  {console.log('Tipo no render:', typeof isFollowing)}
                  <Button
                    onClick={handleFollow}
                    className={`${
                      isFollowing 
                        ? 'bg-purple-800 hover:bg-red-600 hover:text-white group' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    } transition-colors duration-200 relative`}
                  >
                    <span className={`${isFollowing ? 'group-hover:hidden' : ''}`}>
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </span>
                    {isFollowing && (
                      <span className="hidden group-hover:inline">
                        Deixar de seguir
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Seção Rede Social */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-heading text-purple-900 mb-4">Rede Social</h2>
            <div className="flex items-center gap-8 mb-6">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-3 rounded-lg transition-colors"
                onClick={() => setShowFollowers(true)}
              >
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Seguidores</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {followers.length}
                  </p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-purple-50 p-3 rounded-lg transition-colors"
                onClick={() => setShowFollowing(true)}
              >
                <Users className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Seguindo</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {following.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas da Estante</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-purple-600">{profile.bookshelf_stats.total}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Quero ler</p>
                <p className="text-2xl font-semibold text-purple-600">{profile.bookshelf_stats.want_to_read}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Lendo</p>
                <p className="text-2xl font-semibold text-purple-600">{profile.bookshelf_stats.reading}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Lidos</p>
                <p className="text-2xl font-semibold text-purple-600">{profile.bookshelf_stats.read}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Favoritos</p>
                <p className="text-2xl font-semibold text-purple-600">{profile.bookshelf_stats.favorite}</p>
              </div>
            </div>
          </div>

          {averageRating && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Avaliação Média</h3>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StarRatingDisplay rating={averageRating.average_rating} size="lg" showValue={true} />
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
      {showFollowers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={e => { if (e.target === e.currentTarget) setShowFollowers(false); }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-bold mb-4 text-purple-900">Seguidores</h2>
            <button className="absolute top-4 right-6 text-purple-700 hover:text-purple-900 text-2xl" onClick={() => setShowFollowers(false)}>&times;</button>
            {followers.length === 0 ? (
              <p className="text-gray-500">Nenhum seguidor ainda.</p>
            ) : (
              <ul className="space-y-4 mb-6">
                {followers.map(f => (
                  <li key={f.id} className="flex items-center gap-3">
                    {f.profile_picture ? (
                      <img src={`http://localhost:8000${f.profile_picture}`} alt={f.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-purple-400" />
                    )}
                    <div>
                      <div className="font-semibold text-purple-900">{f.username}</div>
                      <div className="text-sm text-gray-500">{f.full_name || 'Não definido'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Modal de Seguindo */}
      {showFollowing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={e => { if (e.target === e.currentTarget) setShowFollowing(false); }}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-bold mb-4 text-purple-900">Seguindo</h2>
            <button className="absolute top-4 right-6 text-purple-700 hover:text-purple-900 text-2xl" onClick={() => setShowFollowing(false)}>&times;</button>
            {following.length === 0 ? (
              <p className="text-gray-500">Não está seguindo ninguém ainda.</p>
            ) : (
              <ul className="space-y-4 mb-6">
                {following.map(f => (
                  <li key={f.id} className="flex items-center gap-3">
                    {f.profile_picture ? (
                      <img src={`http://localhost:8000${f.profile_picture}`} alt={f.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-purple-400" />
                    )}
                    <div>
                      <div className="font-semibold text-purple-900">{f.username}</div>
                      <div className="text-sm text-gray-500">{f.full_name || 'Não definido'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 