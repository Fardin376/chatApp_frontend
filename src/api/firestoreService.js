import { db, ensureAuth } from '../config/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

class FirestoreService {
  constructor() {
    this.unsubscribers = new Map();
  }

  // Subscribe to messages in a room
  async subscribeToRoomMessages(roomId, callback, errorCallback) {
    try {
      // Ensure user is authenticated first
      await ensureAuth();

      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('roomId', '==', roomId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            messages.push({ messageId: doc.id, ...doc.data() });
          });
          callback(messages);
        },
        (error) => {
          console.error('Error listening to room messages:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`room_${roomId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to room messages:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to messages in a conversation
  async subscribeToConversationMessages(
    conversationId,
    callback,
    errorCallback
  ) {
    try {
      // Ensure user is authenticated first
      await ensureAuth();

      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            messages.push({ messageId: doc.id, ...doc.data() });
          });
          callback(messages);
        },
        (error) => {
          console.error('Error listening to conversation messages:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`conversation_${conversationId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to conversation messages:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to typing indicators in a room
  async subscribeToRoomTyping(roomId, currentUserId, callback) {
    try {
      // Ensure user is authenticated first
      await ensureAuth();

      const typingRef = collection(db, 'typing');
      const q = query(
        typingRef,
        where('roomId', '==', roomId),
        where('isTyping', '==', true)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const typingUsers = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Exclude current user and check if typing status is recent (within last 5 seconds)
          const now = Date.now();
          if (
            data.userId !== currentUserId &&
            data.timestamp &&
            now - data.timestamp < 5000
          ) {
            typingUsers.push(data.userId);
          }
        });
        callback(typingUsers);
      });

      this.unsubscribers.set(`typing_room_${roomId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to room typing:', error);
    }
  }

  // Subscribe to typing indicators in a conversation
  async subscribeToConversationTyping(conversationId, currentUserId, callback) {
    try {
      // Ensure user is authenticated first
      await ensureAuth();

      const typingRef = collection(db, 'typing');
      const q = query(
        typingRef,
        where('conversationId', '==', conversationId),
        where('isTyping', '==', true)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const typingUsers = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Exclude current user and check if typing status is recent (within last 5 seconds)
          const now = Date.now();
          if (
            data.userId !== currentUserId &&
            data.timestamp &&
            now - data.timestamp < 5000
          ) {
            typingUsers.push(data.userId);
          }
        });
        callback(typingUsers);
      });

      this.unsubscribers.set(
        `typing_conversation_${conversationId}`,
        unsubscribe
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to conversation typing:', error);
    }
  }

  // Unsubscribe from specific listener
  unsubscribe(key) {
    const unsubscribe = this.unsubscribers.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(key);
    }
  }

  // Subscribe to rooms list
  async subscribeToRooms(userId, callback, errorCallback) {
    try {
      await ensureAuth();

      const roomsRef = collection(db, 'rooms');
      const q = query(roomsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const rooms = [];
          snapshot.forEach((doc) => {
            const roomData = { roomId: doc.id, ...doc.data() };
            // Filter rooms where user is a member
            if (roomData.members && roomData.members.includes(userId)) {
              rooms.push(roomData);
            }
          });
          callback(rooms);
        },
        (error) => {
          console.error('Error listening to rooms:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`rooms_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to rooms:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to conversations list
  async subscribeToConversations(userId, callback, errorCallback) {
    try {
      await ensureAuth();

      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const conversations = [];
          snapshot.forEach((doc) => {
            const convData = { conversationId: doc.id, ...doc.data() };
            // Filter conversations where user is a participant
            if (
              convData.participants &&
              convData.participants.includes(userId)
            ) {
              conversations.push(convData);
            }
          });
          callback(conversations);
        },
        (error) => {
          console.error('Error listening to conversations:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`conversations_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to conversations:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to friend requests
  async subscribeToFriendRequests(userId, callback, errorCallback) {
    try {
      await ensureAuth();

      const friendsRef = collection(db, 'friends');
      const q = query(
        friendsRef,
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const requests = [];
          snapshot.forEach((doc) => {
            requests.push({ requestId: doc.id, ...doc.data() });
          });
          callback(requests);
        },
        (error) => {
          console.error('Error listening to friend requests:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`friend_requests_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to friend requests:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to friends list
  async subscribeToFriends(userId, callback, errorCallback) {
    try {
      await ensureAuth();

      const friendsRef = collection(db, 'friends');
      const q = query(friendsRef, where('status', '==', 'accepted'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const friends = [];
          snapshot.forEach((doc) => {
            const friendData = doc.data();
            // Filter friends where user is sender or receiver
            if (
              friendData.senderId === userId ||
              friendData.receiverId === userId
            ) {
              friends.push({ friendId: doc.id, ...friendData });
            }
          });
          callback(friends);
        },
        (error) => {
          console.error('Error listening to friends:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`friends_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to friends:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Subscribe to unread message counts for a user
  async subscribeToUnreadCounts(userId, callback, errorCallback) {
    try {
      await ensureAuth();

      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('read', '==', false),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const unreadCounts = {
            rooms: {},
            conversations: {},
            total: 0,
          };

          snapshot.forEach((doc) => {
            const msg = doc.data();
            // Only count messages not sent by current user
            if (msg.senderId !== userId) {
              if (msg.roomId) {
                unreadCounts.rooms[msg.roomId] =
                  (unreadCounts.rooms[msg.roomId] || 0) + 1;
              } else if (msg.conversationId) {
                unreadCounts.conversations[msg.conversationId] =
                  (unreadCounts.conversations[msg.conversationId] || 0) + 1;
              }
              unreadCounts.total++;
            }
          });

          callback(unreadCounts);
        },
        (error) => {
          console.error('Error listening to unread counts:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.unsubscribers.set(`unread_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to unread counts:', error);
      if (errorCallback) errorCallback(error);
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribers.clear();
  }
}

export default new FirestoreService();
