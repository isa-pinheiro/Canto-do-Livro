// Configuração da API
const API_BASE_URL = 'http://localhost:8000/api';

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
      console.log('Token sendo usado:', token);
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Fazendo requisição para:', `${API_BASE_URL}${endpoint}`);
    console.log('Método:', method);
    console.log('Dados:', data);
    console.log('Headers:', headers);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('Dados da resposta:', responseData);

    if (!response.ok) {
      console.log('Erro na resposta:', responseData);
      throw new Error(responseData.detail || 'Erro na requisição');
    }

    return responseData;
  } catch (error) {
    console.log('Erro na requisição:', error);
    throw error;
  }
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
  getUserByUsername: (username: string) => apiRequest(`/users/${username}`),

  // Bookshelf
  getBookshelf: () => apiRequest('/bookshelf'),
  getBookDetails: (bookId: number) => apiRequest(`/bookshelf/books/${bookId}`),
  addToBookshelf: (bookData: any) => apiRequest('/bookshelf', 'POST', bookData),
  updateBookshelfEntry: (entryId: number, data: any) => apiRequest(`/bookshelf/${entryId}`, 'PATCH', data),
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
}; 