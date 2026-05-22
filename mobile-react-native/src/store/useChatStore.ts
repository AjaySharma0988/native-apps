/**
 * React Native Chat Store
 */
import { create } from 'zustand';
import { apiClient, useAuthStore } from './useAuthStore';
import type { Message, ChatUser } from '@chatty/shared-core';

interface ChatState {
  messages: Message[];
  users: ChatUser[];
  selectedUser: ChatUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  hasMore: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (data: { text?: string; image?: string; type?: string }) => Promise<void>;
  setSelectedUser: (user: ChatUser | null) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  hasMore: true,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await apiClient.get('/messages/users');
      set({ users: res.data });
    } catch { } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ messages: [], isMessagesLoading: true });
    try {
      const res = await apiClient.get(`/messages/${userId}?limit=30`);
      set({ messages: res.data });
      await apiClient.put(`/messages/mark-read/${userId}`);
      set((state) => ({
        users: state.users.map((u) => u._id === userId ? { ...u, unreadCount: 0 } : u),
      }));
    } catch { } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, isSendingMessage } = get();
    if (!selectedUser || isSendingMessage) return;
    set({ isSendingMessage: true });

    const me = useAuthStore.getState().authUser;
    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = {
      _id: tempId,
      senderId: me!._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      type: (messageData.type as any) || 'text',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, optimistic] }));

    try {
      const res = await apiClient.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMsg = res.data as Message;
      set((state) => ({
        messages: state.messages.map((m) => m._id === tempId ? newMsg : m),
        users: state.users
          .map((u) => u._id === selectedUser._id ? { ...u, lastMessage: newMsg } : u)
          .sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime()),
      }));
    } catch {
      set((state) => ({
        messages: state.messages.map((m) => m._id === tempId ? { ...m, status: 'failed' } : m),
      }));
    } finally {
      set({ isSendingMessage: false });
    }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user });
    if (user) get().getMessages(user._id);
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on('newMessage', (msg: Message) => {
      const { selectedUser } = get();
      const me = useAuthStore.getState().authUser?._id;

      if (selectedUser && msg.senderId === selectedUser._id) {
        set((state) => ({
          messages: state.messages.some((m) => m._id === msg._id)
            ? state.messages
            : [...state.messages, msg],
        }));
        apiClient.put(`/messages/mark-read/${msg.senderId}`).catch(() => { });
      }

      if (msg.receiverId === me && msg.senderId !== selectedUser?._id) {
        socket.emit('mark-delivered', { messageId: msg._id, senderId: msg.senderId });
      }

      set((state) => ({
        users: state.users.map((u) => {
          if (u._id === msg.senderId || u._id === msg.receiverId) {
            const unread = msg.senderId === selectedUser?._id ? 0 : (u.unreadCount || 0) + 1;
            return { ...u, lastMessage: msg, unreadCount: u._id === msg.senderId ? unread : u.unreadCount };
          }
          return u;
        }).sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime()),
      }));
    });

    socket.on('messagesSeen', ({ receiverId }: { receiverId: string }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.receiverId === receiverId ? { ...m, status: 'seen' } : m
        ),
      }));
    });

    socket.on('messageDelivered', ({ messageId }: { messageId: string }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId && m.status === 'sent' ? { ...m, status: 'delivered' } : m
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    ['newMessage', 'messagesSeen', 'messageDelivered'].forEach((e) => socket.off(e));
  },
}));
