"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from '@/config/api';
import { Button } from "@/components/ui/button";

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      // erro
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando notificações...</div>;
  }

  return (
    <div className="min-h-screen bg-[#1d232a] text-white flex flex-col items-center py-8">
      <h1 className="text-4xl font-bold mb-8">Notificações</h1>
      <Button onClick={() => router.push('/dashboard')} className="mb-6 bg-[#8F00FF] hover:bg-[#8F00FF]">Voltar ao Feed</Button>
      <div className="w-full max-w-2xl space-y-4">
        {notifications.length === 0 && <div className="text-center">Nenhuma notificação.</div>}
        {notifications.map(n => (
          <Card key={n.id} className={"bg-white text-black" + (n.is_read ? " opacity-60" : "") }>
            <CardHeader>
              <CardTitle>{n.type === 'follow' ? 'Novo Seguidor' : 'Notificação'}</CardTitle>
              <CardDescription>{new Date(n.created_at).toLocaleString('pt-BR')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>{n.message}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 