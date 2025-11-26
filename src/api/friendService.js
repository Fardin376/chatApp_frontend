import apiClient from './apiClient';

export const friendService = {
  // Get user's friend list
  getFriends: async (userId) => {
    try {
      const response = await apiClient.get(`/users/${userId}/friends`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get friends' };
    }
  },

  // Add a friend
  addFriend: async (userId, friendId) => {
    try {
      const response = await apiClient.post(`/users/${userId}/friends`, {
        friendId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to add friend' };
    }
  },

  // Remove a friend
  removeFriend: async (userId, friendId) => {
    try {
      const response = await apiClient.delete(
        `/users/${userId}/friends/${friendId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to remove friend' };
    }
  },

  // Search for users
  searchUsers: async (query) => {
    try {
      const response = await apiClient.get(`/users/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to search users' };
    }
  },

  // Send a friend request
  sendFriendRequest: async (fromId, toId) => {
    try {
      const response = await apiClient.post('/friends/request', {
        fromUser: fromId,
        toUser: toId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to send friend request' };
    }
  },

  // Accept a friend request
  acceptFriendRequest: async (userId, fromId) => {
    try {
      const response = await apiClient.post('/friends/accept', {
        userId: userId,
        fromUser: fromId,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { error: 'Failed to accept friend request' }
      );
    }
  },

  // Get list of friends (new endpoint)
  getFriendsList: async (userId) => {
    try {
      const response = await apiClient.get(`/friends/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get friends list' };
    }
  },

  // Get pending friend requests
  getFriendRequests: async (userId) => {
    try {
      const response = await apiClient.get(`/friends/${userId}/incoming`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get friend requests' };
    }
  },
};

export default friendService;
