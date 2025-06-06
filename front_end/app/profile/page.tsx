'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { User, LogOut, Save, X, Camera } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/config/api';

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
    full_name: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [router]);

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
      const data = await api.getCurrentUser();
      if (data) {
        setUserData(data);
        setFormData({
          username: data.username,
          email: data.email,
          full_name: data.full_name,
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        throw new Error('Dados do usuário não encontrados');
      }
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
    } finally {
      setLoading(false);
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
      if (formData.new_password && formData.new_password !== formData.confirm_password) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }

      const updateData: any = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
      };

      if (formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.password = formData.new_password;
      }

      const updatedUser = await api.updateUser(updateData) as UserProfile;
      
      setUserData(updatedUser);
      setFormData({
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso",
      });
      
      setEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Sessão expirada')) {
          handleAuthError();
          return;
        }
        
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push('/login');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await fetch('http://localhost:8000/api/users/me/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError();
          return;
        }
        throw new Error('Falha ao fazer upload da imagem');
      }

      const data = await response.json();
      setUserData(prev => prev ? {
        ...prev,
        profile_picture: data.profile_picture
      } : null);

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-heading text-purple-900">Meu Perfil</h1>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-purple-200">
                {userData?.profile_picture ? (
                  <Image
                    src={userData.profile_picture}
                    alt="Foto de perfil"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-purple-400" />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white py-1 text-sm flex items-center justify-center hover:bg-opacity-60 transition-opacity"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-1" />
                      Alterar foto
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-grow">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Nome de usuário</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Nome completo</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_password">Senha atual</Label>
                    <Input
                      id="current_password"
                      name="current_password"
                      type="password"
                      value={formData.current_password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_password">Nova senha</Label>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      value={formData.new_password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">Confirmar nova senha</Label>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Nome de usuário</Label>
                    <p className="text-gray-700">{userData?.username}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-gray-700">{userData?.email}</p>
                  </div>
                  <div>
                    <Label>Nome completo</Label>
                    <p className="text-gray-700">{userData?.full_name}</p>
                  </div>
                  <Button onClick={() => setEditing(true)}>
                    Editar perfil
                  </Button>
                </div>
              )}
            </div>
          </div>

          {userData?.bookshelf_stats && (
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-heading text-purple-900 mb-4">Estatísticas da Estante</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-900">{userData.bookshelf_stats.total}</p>
                  <p className="text-sm text-purple-700">Total</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-900">{userData.bookshelf_stats.want_to_read}</p>
                  <p className="text-sm text-purple-700">Quero ler</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-900">{userData.bookshelf_stats.reading}</p>
                  <p className="text-sm text-purple-700">Lendo</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-900">{userData.bookshelf_stats.read}</p>
                  <p className="text-sm text-purple-700">Lidos</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-900">{userData.bookshelf_stats.favorite}</p>
                  <p className="text-sm text-purple-700">Favoritos</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}