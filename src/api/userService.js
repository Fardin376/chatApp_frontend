import apiClient from './apiClient';

export const userService = {
  // Get all users
  getUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get users' };
    }
  },

  // Get user profile
  getProfile: async (username) => {
    try {
      const response = await apiClient.get(`/users/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get profile' };
    }
  },

  // Update user profile
  updateProfile: async (username, userData) => {
    try {
      const response = await apiClient.put(`/users/${username}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },

  // Delete user
  deleteUser: async (username) => {
    try {
      const response = await apiClient.delete(`/users/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete user' };
    }
  },

  // Check if user exists
  checkUser: async (username) => {
    try {
      const response = await apiClient.get(`/users/check/${username}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to check user' };
    }
  },
};

export default userService;
