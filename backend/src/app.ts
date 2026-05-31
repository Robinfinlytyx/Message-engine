import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import whatsappRoutes from './routes/whatsapp.routes';
import projectRoutes from './routes/project.routes';
import { campaignRoutes } from './routes/campaign.routes';
import { adminRoutes } from './routes/admin.routes';
import { emailRoutes } from './routes/email.routes';
import { projectConfigRoutes } from './routes/project-config.routes';
import { authRoutes } from './routes/auth.routes';
import { superadminRoutes } from './routes/superadmin.routes';
import { teamRoutes } from './routes/team.routes';
import { logger } from './utils/logger';

const app = express();

// CORS - allow frontend access
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5005',
    'https://finx-frontend.vercel.app',
    'https://recov.finlytyx.com',
    'https://message-engine-qrzx.vercel.app',
    // Allow any custom domain from env var
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        // Allow any *.vercel.app domain
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        // Allow explicitly listed origins
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-tenant-id'],
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
        query: req.query,
        body: req.method === 'POST' ? req.body : undefined,
        apiKey: req.headers['x-api-key'],
    });
    next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/org/team', teamRoutes);

app.use(projectRoutes);
app.use(projectConfigRoutes);
app.use('/api/admin', adminRoutes);
app.use(whatsappRoutes);
app.use('/api/whatsapp', campaignRoutes);
app.use('/api/email', emailRoutes);


// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

export default app;
