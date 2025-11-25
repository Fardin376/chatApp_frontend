import apiClient from './apiClient';

export const messageService = {
  // Send a message to a room or conversation
  sendMessage: async (
    senderId,
    message,
    roomId = null,
    conversationId = null,
    document = null
  ) => {
    const payload = {
      senderId,
      message,
      roomId,
      conversationId,
      document,
    };

    const response = await apiClient.post('/messages', payload);
    return response.data;
  },
};
