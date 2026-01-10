import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRouter from './routes/stats.js';
import salesRouter from './routes/sales.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stats', statsRouter);
app.use('/api/sales', salesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Roblox Stats API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
