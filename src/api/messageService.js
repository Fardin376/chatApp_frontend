import apiClient from './apiClient';

export const messageService = {
  // Send a message to a room or conversation
  // document should be an object with { filename, data } where data is base64 encoded
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
    };

    // Add document field only if provided
    // Backend expects document as object: { filename: 'file.jpg', data: 'base64string' }
    if (document) {
      payload.document = document;
    }

    const response = await apiClient.post('/messages', payload);
    return response.data;
  },
};
