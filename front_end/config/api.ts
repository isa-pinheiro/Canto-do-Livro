// Configuração da API
const API_BASE_URL = 'http://localhost:8000/api';

interface ApiError extends Error {
  status?: number;
}

// Função para fazer requisições à API
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`Response status: ${response.status}`);

    if (response.status === 401) {
      // Tenta renovar o token
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('Refresh token não encontrado');
        }

        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error('Falha ao renovar token');
        }

        const data = await refreshResponse.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Repete a requisição original com o novo token
        return apiRequest(endpoint, options, retryCount + 1);
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
        // Se não conseguiu renovar o token, limpa os tokens e redireciona para login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Sessão expirada');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || 'Erro na requisição';
      const error = new Error(errorMessage) as ApiError;
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch' && retryCount < 3) {
        console.log(`Retrying request (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return apiRequest(endpoint, options, retryCount + 1);
      }
      throw error;
    }
    throw new Error('Erro desconhecido');
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

  register: async (userData: { username: string; email: string; password: string }) => {
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
  updateUser: (data: any) => apiRequest('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getUserByUsername: (username: string) => apiRequest(`/users/${username}`),

  // Bookshelf
  getBookshelf: () => apiRequest('/bookshelf'),
  getBookDetails: (bookId: number) => apiRequest(`/bookshelf/books/${bookId}`),
  addToBookshelf: (bookData: any) => apiRequest('/bookshelf', {
    method: 'POST',
    body: JSON.stringify(bookData),
  }),
  updateBookshelfEntry: (entryId: number, data: any) => apiRequest(`/bookshelf/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  removeFromBookshelf: (entryId: number) => apiRequest(`/bookshelf/${entryId}`, {
    method: 'DELETE',
  }),

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