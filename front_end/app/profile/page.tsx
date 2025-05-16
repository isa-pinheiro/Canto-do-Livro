'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { User, LogOut, Save, X, Camera } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_picture: string | null;
  created_at: string;
  full_name: string;
  bookshelf_stats?: {
    total: number;
    want_to_read: number;
    reading: number;
    read: number;
    favorite: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const { toast } = useToast();
  const [userData, setUserData] = useState<{
    username: string;
    email: string;
    full_name: string;
    profile_picture?: string;
    bookshelf_stats?: {
      total: number;
      want_to_read: number;
      reading: number;
      read: number;
      favorite: number;
    };
  }>({
    username: '',
    email: '',
    full_name: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchUserData();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('Token não encontrado');
        router.push('/login');
        return;
      }

      console.log('Iniciando busca do perfil...');
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });

      console.log('Resposta da API:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Token inválido ou expirado');
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        console.error('Erro na resposta:', errorData);
        throw new Error(errorData.detail || 'Falha ao carregar perfil');
      }

      const data = await response.json();
      console.log('Dados do perfil recebidos:', data);
      setProfile(data);
      setFormData({
        username: data.username,
        email: data.email,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Erro completo:', error);
      let errorMessage = 'Falha ao carregar perfil';
      
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

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('Token não encontrado');
        router.push('/login');
        return;
      }

      console.log('Buscando dados do usuário...');
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });

      console.log('Resposta da API:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Token inválido ou expirado');
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }
        
        let errorMessage = 'Erro ao carregar dados do usuário';
        try {
          const errorData = await response.json();
          console.error('Erro na resposta:', errorData);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Erro ao processar resposta:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Dados do usuário recebidos:', data);
      
      // Ensure bookshelf_stats has default values if not present
      const userDataWithDefaults = {
        ...data,
        bookshelf_stats: {
          total: 0,
          want_to_read: 0,
          reading: 0,
          read: 0,
          favorite: 0,
          ...data.bookshelf_stats
        }
      };
      
      setUserData(userDataWithDefaults);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar os dados do usuário",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Validar senha se estiver alterando
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem",
            variant: "destructive",
          });
          return;
        }
        if (!formData.current_password) {
          toast({
            title: "Erro",
            description: "Digite sua senha atual para alterar a senha",
            variant: "destructive",
          });
          return;
        }
      }

      console.log('Enviando dados para atualização:', {
        username: formData.username,
        email: formData.email,
        current_password: formData.current_password,
        password: formData.new_password
      });

      const response = await fetch('http://localhost:8000/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          current_password: formData.current_password,
          password: formData.new_password
        })
      });

      console.log('Resposta da API:', response.status);

      if (!response.ok) {
        let errorMessage = 'Falha ao atualizar perfil';
        try {
          const errorData = await response.json();
          console.error('Erro na resposta:', errorData);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Erro ao processar resposta:', e);
        }
        throw new Error(errorMessage);
      }

      const updatedData = await response.json();
      console.log('Dados atualizados:', updatedData);

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });

      setEditing(false);
      // Limpar campos de senha após atualização
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      await fetchProfile();
      await fetchUserData();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar perfil",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "O arquivo deve ser uma imagem",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/auth/me/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Falha ao fazer upload da imagem');
      }

      const data = await response.json();
      setProfile(data);
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Falha ao fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-700">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-heading text-purple-900">Meu Perfil</h1>
            <div className="flex gap-4">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        username: profile?.username || '',
                        email: profile?.email || '',
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      });
                    }}
                    className="text-purple-700 hover:bg-purple-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-purple-900 hover:bg-purple-950 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="text-purple-700 hover:bg-purple-50"
                >
                  <User className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-purple-100">
                {profile?.profile_picture ? (
                  <Image
                    src={`http://localhost:8000${profile.profile_picture}`}
                    alt="Foto de perfil"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-purple-300" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-purple-700 hover:bg-purple-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? 'Enviando...' : 'Alterar foto'}
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-purple-900">Nome de usuário</Label>
                {editing ? (
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="border-purple-200 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-purple-700">{profile?.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-900">Email</Label>
                {editing ? (
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-purple-200 focus:border-purple-500"
                  />
                ) : (
                  <p className="text-purple-700">{profile?.email}</p>
                )}
              </div>

              {editing && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-purple-900">Senha atual</Label>
                    <Input
                      id="current_password"
                      name="current_password"
                      type="password"
                      value={formData.current_password}
                      onChange={handleInputChange}
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-purple-900">Nova senha</Label>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      value={formData.new_password}
                      onChange={handleInputChange}
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-purple-900">Confirmar nova senha</Label>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-purple-900">Data de registro</Label>
                <p className="text-purple-700">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : '-'}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-purple-900">Minha Estante</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                  <h4 className="text-sm font-medium text-purple-600">Total de Livros</h4>
                  <p className="mt-2 text-3xl font-semibold text-purple-900">
                    {userData.bookshelf_stats?.total ?? 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                  <h4 className="text-sm font-medium text-purple-600">Quero Ler</h4>
                  <p className="mt-2 text-3xl font-semibold text-purple-900">
                    {userData.bookshelf_stats?.want_to_read ?? 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                  <h4 className="text-sm font-medium text-purple-600">Lendo</h4>
                  <p className="mt-2 text-3xl font-semibold text-purple-900">
                    {userData.bookshelf_stats?.reading ?? 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                  <h4 className="text-sm font-medium text-purple-600">Lidos</h4>
                  <p className="mt-2 text-3xl font-semibold text-purple-900">
                    {userData.bookshelf_stats?.read ?? 0}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                  <h4 className="text-sm font-medium text-purple-600">Favoritos</h4>
                  <p className="mt-2 text-3xl font-semibold text-purple-900">
                    {userData.bookshelf_stats?.favorite ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-purple-100">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 