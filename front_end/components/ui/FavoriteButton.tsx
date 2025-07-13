'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { useToast } from './use-toast';
import { api } from '@/config/api';

interface FavoriteButtonProps {
  isFavorite: boolean;
  entryId: number;
  onToggle?: (isFavorite: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FavoriteButton({ 
  isFavorite, 
  entryId, 
  onToggle, 
  size = 'lg' 
}: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const updatedEntry = await api.toggleFavorite(entryId);
      const newFavoriteStatus = updatedEntry.is_favorite;
      
      setFavorite(newFavoriteStatus);
      onToggle?.(newFavoriteStatus);
      
      toast({
        title: newFavoriteStatus ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
        description: newFavoriteStatus 
          ? 'Livro marcado como favorito com sucesso!' 
          : 'Livro removido dos favoritos.',
      });
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao atualizar favorito',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={`${buttonSizeClasses[size]} p-0 hover:bg-red-50 transition-colors`}
    >
      <Heart 
        className={`${sizeClasses[size]} border-2 border-red-400 rounded-full p-1 transition-colors ${favorite ? 'text-red-400 fill-current' : 'text-red-400'}`}
        style={{ width: size === 'xl' ? '40px' : size === 'lg' ? '36px' : size === 'md' ? '32px' : '24px', height: size === 'xl' ? '40px' : size === 'lg' ? '36px' : size === 'md' ? '32px' : '24px' }}
      />
    </Button>
  );
} 