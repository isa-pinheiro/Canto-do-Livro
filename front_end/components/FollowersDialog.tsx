'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users, X } from 'lucide-react';
import { api } from '@/config/api';
import { useToast } from '@/components/ui/use-toast';

interface User {
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
  };
  follow_counts: {
    followers_count: number;
    following_count: number;
  };
  is_following?: boolean;
}

interface FollowersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: 'followers' | 'following';
  title: string;
}

export default function FollowersDialog({ isOpen, onClose, userId, type, title }: FollowersDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let data;
      if (type === 'followers') {
        data = await api.getUserFollowers(userId);
      } else {
        data = await api.getUserFollowing(userId);
      }
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (user: User) => {
    try {
      let response;
      if (user.is_following) {
        response = await api.unfollowUser(user.id);
      } else {
        response = await api.followUser(user.id);
      }

      // Atualizar o estado local
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, is_following: response.is_following }
          : u
      ));

      toast({
        title: "Sucesso",
        description: response.is_following 
          ? "Você começou a seguir este usuário" 
          : "Você deixou de seguir este usuário",
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

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum {type === 'followers' ? 'seguidor' : 'usuário seguido'} encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserClick(user.username)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage 
                        src={user.profile_picture ? `http://localhost:8000${user.profile_picture}` : undefined} 
                        alt={user.username} 
                      />
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{user.username}
                      </p>
                      {user.follow_counts && (
                        <p className="text-xs text-gray-400">
                          {user.follow_counts.followers_count} seguidores • {user.follow_counts.following_count} seguindo
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={user.is_following ? "outline" : "default"}
                    className={`ml-2 ${
                      user.is_following 
                        ? 'border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowToggle(user);
                    }}
                  >
                    {user.is_following ? 'Seguindo' : 'Seguir'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 