/**
 * WebSocket Chat Hook
 * 
 * Real-time chat for application messages using WebSockets.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { tokenStorage, type ApiError } from '@/lib/api';

// Types
export interface ChatMessage {
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

export interface MessageListItem {
    id: number;
    sender_email: string;
    sender_name: string;
    sender_role: string;
    text: string;
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

// Hook for chat
export function useChat(applicationId: number | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
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

            // Transform to ChatMessage format
            const chatMessages: ChatMessage[] = response.map(msg => ({
                id: msg.id,
                sender: {
                    id: 0, // Not available in list response
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

        // Close existing connection
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
                console.log('WebSocket connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);

                    switch (data.type) {
                        case 'connection_established':
                            console.log('Chat connected for application:', data.application_id);
                            break;

                        case 'message':
                            if (data.id && data.sender && data.text && data.created_at) {
                                const newMessage: ChatMessage = {
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

            ws.onerror = (event) => {
                console.error('WebSocket error:', event);
                setError('Ошибка соединения');
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                console.log('WebSocket closed:', event.code, event.reason);

                // Reconnect after 3 seconds if not intentionally closed
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 3000);
                }
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
            setError('Не удалось подключиться к чату');
        }
    }, [applicationId]);

    // Disconnect
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

    // Send message
    const sendMessage = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Нет соединения с чатом');
            return false;
        }

        try {
            wsRef.current.send(JSON.stringify({
                type: 'message',
                text: text.trim(),
            }));
            return true;
        } catch (e) {
            setError('Ошибка отправки сообщения');
            return false;
        }
    }, []);

    // Send typing indicator
    const sendTyping = useCallback((isTyping: boolean) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        try {
            wsRef.current.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping,
            }));

            // Auto-stop typing after 3 seconds
            if (isTyping) {
                typingTimeoutRef.current = setTimeout(() => {
                    sendTyping(false);
                }, 3000);
            }
        } catch (e) {
            // Ignore typing errors
        }
    }, []);

    // Mark messages as read
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
            // Ignore read errors
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        if (applicationId) {
            loadHistory();
            connect();
        }

        return () => {
            disconnect();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
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

// Hook for sending messages via REST (fallback)
export function useChatRest(applicationId: number | null) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (text: string, attachment?: File): Promise<boolean> => {
        if (!applicationId) return false;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('application', applicationId.toString());
            formData.append('text', text);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            await api.post('/chat/', formData);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка отправки сообщения');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [applicationId]);

    return {
        isLoading,
        error,
        sendMessage,
        clearError: () => setError(null),
    };
}
