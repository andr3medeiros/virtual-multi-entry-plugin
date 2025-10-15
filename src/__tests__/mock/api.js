// Mock API functions for testing
const API_BASE_URL = 'https://api.example.com';

export class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token) {
    this.headers.Authorization = `Bearer ${token}`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Mock data
export const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
];

export const mockPosts = [
  { id: 1, title: 'First Post', content: 'This is the first post', userId: 1 },
  { id: 2, title: 'Second Post', content: 'This is the second post', userId: 2 },
  { id: 3, title: 'Third Post', content: 'This is the third post', userId: 1 },
];

// Mock API functions
export const getUsers = () => Promise.resolve(mockUsers);
export const getUserById = (id) => Promise.resolve(mockUsers.find(user => user.id === id));
export const getPosts = () => Promise.resolve(mockPosts);
export const getPostById = (id) => Promise.resolve(mockPosts.find(post => post.id === id));
export const createUser = (userData) => Promise.resolve({ id: Date.now(), ...userData });
export const updateUser = (id, userData) => Promise.resolve({ id, ...userData });
export const deleteUser = (id) => Promise.resolve({ success: true, id });
