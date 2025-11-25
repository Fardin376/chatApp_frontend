import apiClient from './apiClient';

export const authService = {
  // Sign up a new user
  signup: async (userData) => {
    try {
      const response = await apiClient.post('/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Signup failed' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/login', credentials);
      // Backend doesn't return token/user, so we create a mock token
      // and fetch user data separately
      if (response.data.message === 'Login successful') {
        // Store a simple flag for authentication
        localStorage.setItem('authToken', 'authenticated');

        // Fetch all users to find current user's ID
        const usersResponse = await apiClient.get('/users');
        const currentUser = usersResponse.data.find(
          (u) => u.email === credentials.email
        );

        if (currentUser) {
          localStorage.setItem(
            'user',
            JSON.stringify({
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name,
            })
          );
        }
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getUserList: () => {
    const userStr = localStorage.getItem('userList');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export default authService;
