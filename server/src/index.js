import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './services/database.js';
import authRouter from './routes/auth.js';
import statsRouter from './routes/stats.js';
import salesRouter from './routes/sales.js';
import configRouter from './routes/config.js';
import oauthRouter from './routes/oauth.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

// Initialize database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public routes (pas besoin d'authentification)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Roblox Stats API is running' });
});

// Auth routes (pas protégées - pour s'inscrire/se connecter)
app.use('/api/auth', authRouter);

// Middleware conditionnel pour OAuth : skip auth pour le callback
const conditionalOAuthAuth = (req, res, next) => {
  // Le callback OAuth est public (l'utilisateur revient de Roblox sans JWT)
  if (req.path === '/callback') {
    return next();
  }
  // Toutes les autres routes OAuth nécessitent l'authentification
  return authenticateToken(req, res, next);
};

// OAuth routes (callback public, le reste protégé)
app.use('/api/oauth', conditionalOAuthAuth, oauthRouter);

// Protected routes (besoin du token JWT)
app.use('/api/stats', authenticateToken, statsRouter);
app.use('/api/sales', authenticateToken, salesRouter);
app.use('/api/config', authenticateToken, configRouter);

// Listen on 0.0.0.0 to accept connections from any network interface
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.1.18:${PORT}`);
  console.log('🔒 Authentication enabled - All API routes are now protected');
});
