import apiClient from './apiClient';

export const friendService = {
  // Send a friend request - POST /friends/request
  sendFriendRequest: async (fromId, toId) => {
    try {
      const response = await apiClient.post('/friends/request', {
        fromId: fromId,
        toId: toId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to send friend request' };
    }
  },

  // Accept a friend request - POST /friends/accept
  acceptFriendRequest: async (userId, fromId) => {
    try {
      const response = await apiClient.post('/friends/accept', {
        userId: userId,
        fromId: fromId,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { error: 'Failed to accept friend request' }
      );
    }
  },

  // Reject a friend request - POST /friends/reject
  rejectFriendRequest: async (userId, fromUser) => {
    try {
      const response = await apiClient.post('/friends/reject', {
        userId: userId,
        fromUser: fromUser,
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || { error: 'Failed to reject friend request' }
      );
    }
  },

  // Remove a friend - POST /friends/delete
  removeFriend: async (userA, userB) => {
    try {
      const response = await apiClient.post('/friends/delete', {
        userA: userA,
        userB: userB,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to remove friend' };
    }
  },

  // Get list of friends - GET /friends/list/:userId
  getFriendsList: async (userId) => {
    try {
      const response = await apiClient.get(`/friends/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get friends list' };
    }
  },

  // Get pending friend requests - GET /friends/requests/:userId
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
