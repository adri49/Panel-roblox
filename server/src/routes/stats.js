import express from 'express';
import robloxApi from '../services/robloxApi.js';

const router = express.Router();

router.get('/universe/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    const stats = await robloxApi.getUniverseStats(universeId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/revenue/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    const revenue = await robloxApi.getGameRevenue(universeId);
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const universeIds = process.env.UNIVERSE_IDS?.split(',') || [];

    const allStats = await Promise.all(
      universeIds.map(async (id) => {
        const [stats, revenue] = await Promise.all([
          robloxApi.getUniverseStats(id.trim()),
          robloxApi.getGameRevenue(id.trim())
        ]);

        return {
          ...stats,
          revenue: revenue.totalRevenue
        };
      })
    );

    res.json(allStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
