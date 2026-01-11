import express from 'express';
import robloxApi from '../services/robloxApi.js';
import configManager from '../services/configManager.js';

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
    const universeIds = configManager.getUniverseIds();

    if (universeIds.length === 0) {
      return res.json([]);
    }

    const allStats = await Promise.all(
      universeIds.map(async (id) => {
        try {
          const stats = await robloxApi.getUniverseStats(id.trim());
          return stats;
        } catch (error) {
          console.error(`Error fetching stats for ${id}:`, error.message);
          return null;
        }
      })
    );

    // Filter out failed requests
    const validStats = allStats.filter(stat => stat !== null);

    res.json(validStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
