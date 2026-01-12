import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRouter from './routes/stats.js';
import salesRouter from './routes/sales.js';
import configRouter from './routes/config.js';
import oauthRouter from './routes/oauth.js';
import oauth2Service from './services/oauth2Service.js';
import configManager from './services/configManager.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stats', statsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/config', configRouter);
app.use('/api/oauth', oauthRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Roblox Stats API is running' });
});

// Initialize OAuth 2.0 service with saved config
const oauthConfig = configManager.getOAuthConfig();
if (oauthConfig.clientId && oauthConfig.clientSecret && oauthConfig.redirectUri) {
  oauth2Service.configure(oauthConfig.clientId, oauthConfig.clientSecret, oauthConfig.redirectUri);
  console.log('✅ OAuth 2.0 service initialized');
}

// Listen on 0.0.0.0 to accept connections from any network interface
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.1.18:${PORT}`);
});
