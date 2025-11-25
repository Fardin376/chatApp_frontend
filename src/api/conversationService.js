import apiClient from './apiClient';

export const conversationService = {
  // Start a private 1-on-1 conversation
  createConversation: async (userA, userB) => {
    const response = await apiClient.post('/conversations', { userA, userB });
    return response.data;
  },

  // Get conversation details
  getConversationById: async (conversationId) => {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data;
  },

  // Get messages in a conversation
  getConversationMessages: async (conversationId) => {
    const response = await apiClient.get(
      `/conversations/${conversationId}/messages`
    );
    return response.data;
  },
};
