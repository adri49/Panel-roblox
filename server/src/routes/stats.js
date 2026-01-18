import express from 'express';
import robloxApi from '../services/robloxApi.js';
import teamConfigService from '../services/teamConfigService.js';
import { extractTeamId } from '../middleware/team.js';

const router = express.Router();

// Appliquer le middleware de team ID à toutes les routes
router.use(extractTeamId);

router.get('/universe/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    robloxApi.setTeamContext(req.teamId);
    const stats = await robloxApi.getUniverseStats(universeId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed information about a game (stats + monetization)
router.get('/universe/:universeId/details', async (req, res) => {
  try {
    const { universeId } = req.params;
    robloxApi.setTeamContext(req.teamId);
    const details = await robloxApi.getGameDetails(universeId);
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive analytics from all dashboard endpoints
router.get('/universe/:universeId/analytics', async (req, res) => {
  try {
    const { universeId } = req.params;
    robloxApi.setTeamContext(req.teamId);
    const analytics = await robloxApi.getComprehensiveAnalytics(universeId);
    res.json(analytics);
  } catch (error) {
    console.error(`Error fetching comprehensive analytics for ${universeId}:`, error);
    res.status(500).json({
      error: error.message,
      details: 'Impossible de récupérer les analytics. Vérifiez que le cookie de session est configuré correctement.'
    });
  }
});

router.get('/revenue/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    robloxApi.setTeamContext(req.teamId);
    const revenue = await robloxApi.getGameRevenue(universeId);
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    robloxApi.setTeamContext(req.teamId);
    const config = teamConfigService.getTeamConfig(req.teamId);
    const universeIds = config.universeIds || [];

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

// Test API key and check permissions
router.get('/test-api-key', async (req, res) => {
  try {
    robloxApi.setTeamContext(req.teamId);
    const config = teamConfigService.getTeamConfig(req.teamId);
    const apiKey = config.robloxApiKey;

    if (!apiKey) {
      return res.json({
        hasApiKey: false,
        message: 'Aucune clé API configurée pour cette équipe',
        tests: []
      });
    }

    const tests = await robloxApi.testApiKeyPermissions();

    res.json({
      hasApiKey: true,
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.success).length,
        failed: tests.filter(t => !t.success).length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
