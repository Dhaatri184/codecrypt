import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface WebSocketMessage {
  type: 'scan_update' | 'scan_progress' | 'scan_complete' | 'scan_cancelled' | 'scan_error' | 'issue_update';
  repositoryId: string;
  scanId?: string;
  issueId?: string;
  payload: any;
  timestamp: Date;
}

interface UseWebSocketOptions {
  repositoryId?: string;
  onScanUpdate?: (data: any) => void;
  onScanProgress?: (data: any) => void;
  onScanComplete?: (data: any) => void;
  onScanCancelled?: (data: any) => void;
  onScanError?: (data: any) => void;
  onIssueUpdate?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    repositoryId,
    onScanUpdate,
    onScanProgress,
    onScanComplete,
    onScanCancelled,
    onScanError,
    onIssueUpdate,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const token = localStorage.getItem('codecrypt_token');

    if (!token) {
      console.warn('No auth token found, skipping WebSocket connection');
      return;
    }

    // Create socket connection
    const socket = io(WS_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');

      // Subscribe to repository updates if repositoryId is provided
      if (repositoryId) {
        socket.emit('subscribe:repository', repositoryId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Message events
    socket.on('scan_update', (message: any) => {
      console.log('Received scan update:', message);
      if (onScanUpdate) {
        onScanUpdate(message);
      }
    });

    socket.on('scan_progress', (message: any) => {
      console.log('Received scan progress:', message);
      if (onScanProgress) {
        onScanProgress(message);
      }
    });

    socket.on('scan_complete', (message: any) => {
      console.log('Received scan complete:', message);
      if (onScanComplete) {
        onScanComplete(message);
      }
    });

    socket.on('scan_cancelled', (message: any) => {
      console.log('Received scan cancelled:', message);
      if (onScanCancelled) {
        onScanCancelled(message);
      }
    });

    socket.on('scan_error', (message: any) => {
      console.error('Received scan error:', message);
      if (onScanError) {
        onScanError(message);
      }
    });

    socket.on('issue_update', (message: any) => {
      console.log('Received issue update:', message);
      if (onIssueUpdate) {
        onIssueUpdate(message);
      }
    });

    return socket;
  }, [repositoryId, onScanUpdate, onScanProgress, onScanComplete, onScanCancelled, onScanError, onIssueUpdate]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Unsubscribe from repository if subscribed
      if (repositoryId) {
        socketRef.current.emit('unsubscribe:repository', repositoryId);
      }

      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [repositoryId]);

  const subscribeToRepository = useCallback((repoId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe:repository', repoId);
    }
  }, []);

  const unsubscribeFromRepository = useCallback((repoId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('unsubscribe:repository', repoId);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update subscription when repositoryId changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && repositoryId) {
      socketRef.current.emit('subscribe:repository', repositoryId);

      return () => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('unsubscribe:repository', repositoryId);
        }
      };
    }
  }, [repositoryId]);

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    subscribeToRepository,
    unsubscribeFromRepository,
  };
}
