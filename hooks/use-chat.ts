/**
 * Chat Hooks for Applications
 * 
 * Provides both WebSocket (Phase 2) and REST + Polling (MVP) implementations.
 * MVP Stage 1 uses useChatPolling for stability.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { tokenStorage, type ApiError } from '@/lib/api';

// ============================================
// Types for Chat Messages
// ============================================

export interface ChatMessage {
    id: number;
    application: number;
    sender: number;
    sender_id: number;
    sender_email: string;
    sender_name: string;
    sender_role: 'client' | 'agent' | 'partner' | 'admin';
    content: string;
    file?: string;
    file_url?: string | null;
    is_read: boolean;
    created_at: string;
}

// API response type (matches backend serializer)
interface ChatMessageResponse {
    id: number;
    application: number;
    sender: number;
    sender_id: number;
    sender_email: string;
    sender_name: string;
    sender_role: string;
    content: string;
    file: string | null;
    file_url: string | null;
    is_read: boolean;
    created_at: string;
}

// ============================================
// REST + POLLING HOOK (MVP Stage 1)
// ============================================

/**
 * Hook for chat with REST API + Polling (3 second interval).
 * This is the recommended hook for MVP - stable and reliable.
 * 
 * @param applicationId - The application ID to fetch messages for
 * @param pollingInterval - Polling interval in ms (default: 3000)
 */
export function useChatPolling(applicationId: number | string | null, pollingInterval: number = 3000) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageIdRef = useRef<number>(0);

    // Fetch messages from API
    const fetchMessages = useCallback(async (showLoading: boolean = false) => {
        if (!applicationId) return;

        if (showLoading) {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await api.get<ChatMessageResponse[] | { results: ChatMessageResponse[] }>(
                `/applications/${applicationId}/messages/`
            );

            // Handle both array and paginated object responses (DRF pagination)
            const messagesArray: ChatMessageResponse[] = Array.isArray(response)
                ? response
                : (response.results || []);

            // Transform response to ChatMessage format
            const chatMessages: ChatMessage[] = messagesArray.map(msg => ({
                id: msg.id,
                application: msg.application,
                sender: msg.sender,
                sender_id: msg.sender_id,
                sender_email: msg.sender_email,
                sender_name: msg.sender_name || msg.sender_email,
                sender_role: msg.sender_role as ChatMessage['sender_role'],
                content: msg.content,
                file: msg.file || undefined,
                file_url: msg.file_url,
                is_read: msg.is_read ?? false,
                created_at: msg.created_at,
            }));

            setMessages(chatMessages);

            // Track last message for optimistic updates
            if (chatMessages.length > 0) {
                lastMessageIdRef.current = chatMessages[chatMessages.length - 1].id;
            }
        } catch (err) {
            const apiError = err as ApiError;
            console.error('[Chat] Fetch error:', apiError);
            setError(apiError.message || 'Ошибка загрузки сообщений');
        } finally {
            setIsLoading(false);
        }
    }, [applicationId]);

    // Send message with optional file attachment
    const sendMessage = useCallback(async (content: string, file?: File): Promise<boolean> => {
        if (!applicationId) return false;
        if (!content.trim() && !file) return false;

        setIsSending(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('content', content.trim());
            if (file) {
                formData.append('file', file);
            }

            const newMessage = await api.post<ChatMessageResponse>(
                `/applications/${applicationId}/messages/`,
                formData
            );

            // Add new message to state immediately
            setMessages(prev => [...prev, {
                id: newMessage.id,
                application: newMessage.application,
                sender: newMessage.sender,
                sender_id: newMessage.sender_id,
                sender_email: newMessage.sender_email,
                sender_name: newMessage.sender_name || newMessage.sender_email,
                sender_role: newMessage.sender_role as ChatMessage['sender_role'],
                content: newMessage.content,
                file: newMessage.file || undefined,
                file_url: newMessage.file_url,
                is_read: newMessage.is_read ?? false,
                created_at: newMessage.created_at,
            }]);

            return true;
        } catch (err) {
            const apiError = err as ApiError;
            console.error('[Chat] Send error:', apiError.message || err);
            setError(apiError.message || 'Ошибка отправки сообщения');
            return false;
        } finally {
            setIsSending(false);
        }
    }, [applicationId]);

    // Start/stop polling
    const startPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }

        pollingRef.current = setInterval(() => {
            fetchMessages(false);
        }, pollingInterval);
    }, [fetchMessages, pollingInterval]);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Initialize on mount and when applicationId changes
    useEffect(() => {
        if (applicationId) {
            fetchMessages(true);
            startPolling();
        }

        return () => {
            stopPolling();
        };
    }, [applicationId, fetchMessages, startPolling, stopPolling]);

    // Manual refetch
    const refetch = useCallback(() => {
        fetchMessages(true);
    }, [fetchMessages]);

    // Mark all messages as read
    const markAsRead = useCallback(async (): Promise<number> => {
        if (!applicationId) return 0;
        
        try {
            const response = await api.post<{ marked_count: number }>(
                `/applications/${applicationId}/messages/mark_read/`
            );
            
            // Update local state to reflect read status
            setMessages(prev => prev.map(msg => ({
                ...msg,
                is_read: true,
            })));
            
            return response.marked_count;
        } catch (err) {
            const apiError = err as ApiError;
            console.error('[Chat] Mark read error:', apiError);
            return 0;
        }
    }, [applicationId]);

    return {
        messages,
        isLoading,
        isSending,
        error,
        sendMessage,
        refetch,
        markAsRead,
        startPolling,
        stopPolling,
        clearError: () => setError(null),
    };
}

// ============================================
// LEGACY TYPES (for backward compatibility)
// ============================================

export interface MessageListItem {
    id: number;
    sender_email: string;
    sender_name: string;
    sender_role: string;
    text: string;
    is_read: boolean;
    created_at: string;
}

interface LegacyChatMessage {
    id: number;
    sender: {
        id: number;
        email: string;
        name: string;
        role: string;
    };
    text: string;
    attachment_url?: string;
    is_read: boolean;
    created_at: string;
}

interface WebSocketMessage {
    type: 'message' | 'typing' | 'connection_established' | 'error';
    id?: number;
    sender?: {
        id: number;
        email: string;
        name: string;
        role: string;
    };
    text?: string;
    created_at?: string;
    user_email?: string;
    is_typing?: boolean;
    message?: string;
    application_id?: string;
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

// ============================================
// WEBSOCKET HOOK (Phase 2 - Not for MVP)
// ============================================

/**
 * Hook for chat using WebSockets (Phase 2).
 * DO NOT USE IN MVP - requires Redis/Daphne setup.
 * @deprecated Use useChatPolling for MVP Stage 1
 */
export function useChat(applicationId: number | null) {
    const [messages, setMessages] = useState<LegacyChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load message history via REST
    const loadHistory = useCallback(async () => {
        if (!applicationId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<MessageListItem[]>('/chat/by_application/', {
                application_id: applicationId.toString(),
            });

            const chatMessages: LegacyChatMessage[] = response.map(msg => ({
                id: msg.id,
                sender: {
                    id: 0,
                    email: msg.sender_email,
                    name: msg.sender_name,
                    role: msg.sender_role,
                },
                text: msg.text,
                is_read: msg.is_read,
                created_at: msg.created_at,
            }));

            setMessages(chatMessages);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки сообщений');
        } finally {
            setIsLoading(false);
        }
    }, [applicationId]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!applicationId) return;

        const token = tokenStorage.getAccessToken();
        if (!token) {
            setError('Не авторизован');
            return;
        }

        if (wsRef.current) {
            wsRef.current.close();
        }

        const wsUrl = `${WS_BASE_URL}/ws/chat/application/${applicationId}/?token=${token}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);

                    switch (data.type) {
                        case 'message':
                            if (data.id && data.sender && data.text && data.created_at) {
                                const newMessage: LegacyChatMessage = {
                                    id: data.id,
                                    sender: data.sender,
                                    text: data.text,
                                    is_read: false,
                                    created_at: data.created_at,
                                };
                                setMessages(prev => [...prev, newMessage]);
                            }
                            break;

                        case 'typing':
                            if (data.user_email) {
                                if (data.is_typing) {
                                    setTypingUsers(prev =>
                                        prev.includes(data.user_email!) ? prev : [...prev, data.user_email!]
                                    );
                                } else {
                                    setTypingUsers(prev => prev.filter(email => email !== data.user_email));
                                }
                            }
                            break;

                        case 'error':
                            setError(data.message || 'WebSocket error');
                            break;
                    }
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            ws.onerror = () => {
                setError('Ошибка соединения');
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000);
                }
            };
        } catch (e) {
            setError('Не удалось подключиться к чату');
        }
    }, [applicationId]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected');
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Нет соединения с чатом');
            return false;
        }
        try {
            wsRef.current.send(JSON.stringify({ type: 'message', text: text.trim() }));
            return true;
        } catch (e) {
            setError('Ошибка отправки сообщения');
            return false;
        }
    }, []);

    const sendTyping = useCallback((isTyping: boolean) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        try {
            wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
            if (isTyping) {
                typingTimeoutRef.current = setTimeout(() => sendTyping(false), 3000);
            }
        } catch (e) {
            // Ignore
        }
    }, []);

    const markAsRead = useCallback(async (messageIds: number[]) => {
        if (messageIds.length === 0) return;
        try {
            await api.post('/chat/mark_read/', { message_ids: messageIds });
            setMessages(prev =>
                prev.map(msg =>
                    messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
                )
            );
        } catch (e) {
            // Ignore
        }
    }, []);

    useEffect(() => {
        if (applicationId) {
            loadHistory();
            connect();
        }
        return () => {
            disconnect();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [applicationId, loadHistory, connect, disconnect]);

    return {
        messages,
        isLoading,
        error,
        isConnected,
        typingUsers,
        sendMessage,
        sendTyping,
        markAsRead,
        reconnect: connect,
        refetch: loadHistory,
    };
}
