import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import { logger } from './utils/logger';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001', // Allow port 3001 as well
  ],
  credentials: true,
}));
// Increase body parser limit for scan results (can be large with many issues)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Routes
import repositoriesRoutes from './routes/repositories';
import scansRoutes from './routes/scans';
import exorcismsRoutes from './routes/exorcisms';
app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoriesRoutes);
app.use('/api/scans', scansRoutes);
app.use('/api/issues', exorcismsRoutes);
app.use('/api/exorcisms', exorcismsRoutes);

// Error handling
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
