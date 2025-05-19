'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { User, Users, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
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
}

interface Follower {
  id: number;
  username: string;
  full_name: string | null;
  profile_picture: string | null;
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
    fetchFollowStatus();
    fetchFollowers();
    fetchFollowing();
  }, [params.id]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${params.id}`, {
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
      setProfile(data);
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

  const fetchFollowStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/users/${params.id}/followers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const followers = await response.json();
      const currentUserId = localStorage.getItem('user_id');
      setIsFollowing(followers.some((f: Follower) => f.id === Number(currentUserId)));
    } catch (error) {
      console.error('Erro ao verificar status de seguimento:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/users/${params.id}/followers`, {
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

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/users/${params.id}/following`, {
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

  const handleFollow = async () => {
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:8000/api/users/${params.id}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status de seguimento');
      }

      setIsFollowing(!isFollowing);
      fetchFollowers();
      toast({
        title: "Sucesso",
        description: isFollowing ? "Deixou de seguir o usuário" : "Usuário seguido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar status de seguimento:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status de seguimento",
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
                  <Button
                    onClick={handleFollow}
                    className={`${
                      isFollowing 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {isFollowing ? 'Deixar de seguir' : 'Seguir'}
                  </Button>
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
        </div>
      </div>
    </div>
  );
} 