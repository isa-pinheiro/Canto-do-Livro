// Configuração da API
export const API_BASE_URL = 'http://localhost:8000/api';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
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

interface ApiError extends Error {
  status?: number;
}

// Função para fazer requisições à API
async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  requiresAuth: boolean = true
): Promise<T> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Sessão expirada');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.detail || 'Erro na requisição');
    }

    return responseData;
  } catch (error) {
    throw error;
  }
}

export async function getFeed() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Token não encontrado');
  }
  
  console.log('Fetching feed from:', `${API_BASE_URL}/users/feed`);
  
  const res = await fetch(`${API_BASE_URL}/users/feed`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Feed response status:', res.status);
  
  if (!res.ok) {
    let errorMessage = `Erro ao buscar feed: ${res.status}`;
    try {
      const errorData = await res.json();
      console.error('Feed error response:', errorData);
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  const data = await res.json();
  console.log('Feed data received:', data);
  return data;
}

export async function getFeedDebug() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Token não encontrado');
  }
  
  console.log('Fetching feed debug from:', `${API_BASE_URL}/users/feed-debug`);
  
  const res = await fetch(`${API_BASE_URL}/users/feed-debug`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Feed debug response status:', res.status);
  
  if (!res.ok) {
    let errorMessage = `Erro ao buscar feed debug: ${res.status}`;
    try {
      const errorData = await res.json();
      console.error('Feed debug error response:', errorData);
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  const data = await res.json();
  console.log('Feed debug data received:', data);
  return data;
}

export async function getFeedSimple() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Token não encontrado');
  }
  
  console.log('Fetching feed simple from:', `${API_BASE_URL}/users/feed-simple`);
  
  const res = await fetch(`${API_BASE_URL}/users/feed-simple`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Feed simple response status:', res.status);
  
  if (!res.ok) {
    let errorMessage = `Erro ao buscar feed simple: ${res.status}`;
    try {
      const errorData = await res.json();
      console.error('Feed simple error response:', errorData);
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  const data = await res.json();
  console.log('Feed simple data received:', data);
  return data;
}

export async function getFeedRobust() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Token não encontrado');
  }
  
  console.log('Fetching feed robust from:', `${API_BASE_URL}/users/feed-robust`);
  
  const res = await fetch(`${API_BASE_URL}/users/feed-robust`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Feed robust response status:', res.status);
  
  if (!res.ok) {
    let errorMessage = `Erro ao buscar feed robust: ${res.status}`;
    try {
      const errorData = await res.json();
      console.error('Feed robust error response:', errorData);
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || err).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    throw new Error(errorMessage);
  }
  
  const data = await res.json();
  console.log('Feed robust data received:', data);
  return data;
}

export async function getNotifications() {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/users/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Erro ao buscar notificações');
  return res.json();
}

// Funções específicas para cada endpoint
export const api = {
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login_json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Falha no login');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  register: async (userData: { username: string; email: string; password: string; full_name: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Falha no registro');
    }

    return response.json();
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // User
  getCurrentUser: () => apiRequest<UserProfile>('/auth/me'),
  updateUser: (data: any) => apiRequest('/auth/me', 'PATCH', data),
  getUserByUsername: (username: string) => apiRequest<UserProfile>(`/users/username/${username}`),

  // Bookshelf
  getBookshelf: () => apiRequest('/bookshelf'),
  getBookDetails: (bookId: number) => apiRequest(`/bookshelf/books/${bookId}`),
  addToBookshelf: (bookData: any) => apiRequest('/bookshelf', 'POST', bookData),
  updateBookshelfEntry: (entryId: number, data: any) => apiRequest(`/bookshelf/${entryId}`, 'PATCH', data),
  toggleFavorite: (entryId: number) => apiRequest(`/bookshelf/${entryId}/toggle-favorite`, 'PATCH'),
  removeFromBookshelf: (entryId: number) => apiRequest(`/bookshelf/${entryId}`, 'DELETE'),
  getUserAverageRating: () => apiRequest('/bookshelf/average-rating'),
  getUserAverageRatingById: (userId: number) => apiRequest(`/bookshelf/users/${userId}/average-rating`),

  // Search
  searchUsers: (query: string) => apiRequest(`/users/search?query=${encodeURIComponent(query)}`),
  searchBooks: (query: string) => apiRequest(`/bookshelf/search?query=${encodeURIComponent(query)}`),

  async followUser(userId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Falha ao seguir o usuário');
    }

    return response.json();
  },

  async unfollowUser(userId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/unfollow`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Falha ao deixar de seguir o usuário');
    }

    return response.json();
  },

  async getUserFollowers(userId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/followers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Falha ao obter os seguidores do usuário');
    }

    return response.json();
  },

  async getUserFollowing(userId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/following`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Falha ao obter os usuários seguidos pelo usuário');
    }

    return response.json();
  },

  async getUserFollowCounts(userId: number) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/follow-counts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Falha ao obter os contadores de seguidores');
    }

    return response.json();
  },

  // Chatbot
  chatbot: async (message: string) => {
    return apiRequest<{ response: string }>('/chatbot', 'POST', { message }, false);
  },

  getFeed,
  getFeedDebug,
  getFeedSimple,
  getFeedRobust,
  getNotifications,
};