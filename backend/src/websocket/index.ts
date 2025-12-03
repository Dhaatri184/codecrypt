import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info('WebSocket client connected', { socketId: socket.id });

    // Join repository room
    socket.on('join-repository', (repositoryId: string) => {
      socket.join(`repository:${repositoryId}`);
      logger.info('Client joined repository room', { socketId: socket.id, repositoryId });
    });

    // Leave repository room
    socket.on('leave-repository', (repositoryId: string) => {
      socket.leave(`repository:${repositoryId}`);
      logger.info('Client left repository room', { socketId: socket.id, repositoryId });
    });

    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { socketId: socket.id });
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return io;
}

// Broadcast scan update to all clients watching a repository
export function broadcastScanUpdate(repositoryId: string, data: any): void {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket not initialized');
    return;
  }

  io.to(`repository:${repositoryId}`).emit('scan_update', {
    type: 'scan_update',
    payload: data,
    timestamp: new Date(),
  });

  logger.info('Broadcasted scan update', { repositoryId });
}

// Broadcast scan completion
export function broadcastScanComplete(repositoryId: string, scanId: string, results: any): void {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket not initialized');
    return;
  }

  io.to(`repository:${repositoryId}`).emit('scan_complete', {
    type: 'scan_complete',
    payload: { scanId, results },
    timestamp: new Date(),
  });

  logger.info('Broadcasted scan complete', { repositoryId, scanId });
}

// Broadcast scan error
export function broadcastScanError(repositoryId: string, scanId: string, error: string): void {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket not initialized');
    return;
  }

  io.to(`repository:${repositoryId}`).emit('scan_error', {
    type: 'scan_error',
    payload: { scanId, error },
    timestamp: new Date(),
  });

  logger.info('Broadcasted scan error', { repositoryId, scanId });
}

// Broadcast issue update
export function broadcastIssueUpdate(repositoryId: string, issueId: string, update: any): void {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket not initialized');
    return;
  }

  io.to(`repository:${repositoryId}`).emit('issue_update', {
    type: 'issue_update',
    payload: { issueId, update },
    timestamp: new Date(),
  });

  logger.info('Broadcasted issue update', { repositoryId, issueId });
}

// Broadcast scan progress update with throttling
const progressBroadcastCache = new Map<string, number>();
const PROGRESS_BROADCAST_THROTTLE_MS = 500; // 2 updates per second max

export function broadcastScanProgress(
  repositoryId: string,
  scanId: string,
  progress: {
    progressPercentage: number;
    filesProcessed: number;
    totalFiles: number;
    statusMessage: string;
  }
): void {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket not initialized');
    return;
  }

  // Throttle progress broadcasts
  const now = Date.now();
  const cacheKey = `${repositoryId}:${scanId}`;
  const lastBroadcast = progressBroadcastCache.get(cacheKey) || 0;

  if (now - lastBroadcast < PROGRESS_BROADCAST_THROTTLE_MS) {
    return; // Skip this broadcast
  }

  progressBroadcastCache.set(cacheKey, now);

  io.to(`repository:${repositoryId}`).emit('scan_progress', {
    type: 'scan_progress',
    payload: {
      scanId,
      ...progress,
    },
    timestamp: new Date(),
  });

  logger.debug('Broadcasted scan progress', { repositoryId, scanId, progress: progress.progressPercentage });
}

// Broadcast scan cancellation
export function broadcastScanCancelled(
  repositoryId: string,
  scanId: string,
  partialResults: {
    filesProcessed: number;
    issuesFound: number;
  }
): void {
  if (!io) {
    logger.warn('Cannot broadcast: WebSocket not initialized');
    return;
  }

  io.to(`repository:${repositoryId}`).emit('scan_cancelled', {
    type: 'scan_cancelled',
    payload: {
      scanId,
      partialResults,
    },
    timestamp: new Date(),
  });

  logger.info('Broadcasted scan cancellation', { repositoryId, scanId });
}
