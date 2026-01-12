import express from 'express';
import teamConfigService from '../services/teamConfigService.js';
import robloxApi from '../services/robloxApi.js';
import { extractTeamId, requireConfigPermission } from '../middleware/team.js';

const router = express.Router();

// Appliquer le middleware de team ID à toutes les routes
router.use(extractTeamId);

// Get current configuration (sanitized - no API key exposed)
router.get('/', (req, res) => {
  try {
    const config = teamConfigService.getTeamConfig(req.teamId);
    res.json({
      universeIds: config.universeIds || [],
      groupId: config.groupId || '',
      cacheTTL: config.cacheTTL || 300,
      hasApiKey: !!config.robloxApiKey,
      hasUserApiKey: !!config.robloxUserApiKey,
      hasOAuth: !!config.oauthAccessToken,
      oauthClientId: config.oauthClientId || '',
      lastUpdated: config.lastUpdated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update configuration
router.post('/', requireConfigPermission, (req, res) => {
  try {
    const { robloxApiKey, robloxUserApiKey, universeIds, cacheTTL } = req.body;

    const updates = {};

    if (robloxApiKey !== undefined) {
      updates.roblox_api_key = robloxApiKey;  // ✅ snake_case pour la DB
    }

    if (robloxUserApiKey !== undefined) {
      updates.roblox_user_api_key = robloxUserApiKey;  // ✅ snake_case pour la DB
    }

    if (universeIds !== undefined) {
      if (!Array.isArray(universeIds)) {
        return res.status(400).json({ error: 'universeIds must be an array' });
      }
      updates.universe_ids = JSON.stringify(universeIds.map(id => id.toString().trim()).filter(id => id));
    }

    if (cacheTTL !== undefined) {
      updates.cache_ttl = parseInt(cacheTTL) || 300;  // ✅ snake_case pour la DB
    }

    teamConfigService.updateTeamConfig(req.teamId, updates);

    // Clear cache when configuration changes
    robloxApi.clearCache();

    const config = teamConfigService.getTeamConfig(req.teamId);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        universeIds: config.universeIds || [],
        cacheTTL: config.cacheTTL || 300,
        hasApiKey: !!config.robloxApiKey,
        hasUserApiKey: !!config.robloxUserApiKey,
        hasOAuth: !!config.oauthAccessToken,
        lastUpdated: config.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a universe ID
router.post('/universe', requireConfigPermission, (req, res) => {
  try {
    const { universeId } = req.body;

    if (!universeId) {
      return res.status(400).json({ error: 'universeId is required' });
    }

    const trimmedId = universeId.toString().trim();
    const config = teamConfigService.getTeamConfig(req.teamId);
    const currentIds = config.universeIds || [];

    // Check for duplicates
    if (currentIds.includes(trimmedId)) {
      return res.status(400).json({
        error: 'Ce Universe ID est déjà ajouté',
        duplicate: true
      });
    }

    teamConfigService.addUniverseId(req.teamId, trimmedId);
    robloxApi.clearCache();

    const updatedConfig = teamConfigService.getTeamConfig(req.teamId);

    res.json({
      success: true,
      message: 'Universe ID added',
      universeIds: updatedConfig.universeIds || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a universe ID
router.delete('/universe/:universeId', requireConfigPermission, (req, res) => {
  try {
    const { universeId } = req.params;

    teamConfigService.removeUniverseId(req.teamId, universeId);
    robloxApi.clearCache();

    const config = teamConfigService.getTeamConfig(req.teamId);

    res.json({
      success: true,
      message: 'Universe ID removed',
      universeIds: config.universeIds || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cache
router.post('/cache/clear', (req, res) => {
  try {
    robloxApi.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert Place ID to Universe ID
router.get('/convert-place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const universeId = await robloxApi.convertPlaceToUniverse(placeId);

    res.json({
      success: true,
      placeId,
      universeId
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get/Set Group ID
router.get('/group-id', (req, res) => {
  const config = teamConfigService.getTeamConfig(req.teamId);
  res.json({ groupId: config.groupId || '' });
});

router.post('/group-id', requireConfigPermission, (req, res) => {
  try {
    const { groupId } = req.body;
    teamConfigService.updateTeamConfig(req.teamId, { group_id: groupId });  // ✅ snake_case pour la DB

    const config = teamConfigService.getTeamConfig(req.teamId);

    res.json({
      success: true,
      groupId: config.groupId,
      config: {
        groupId: config.groupId || '',
        universeIds: config.universeIds || [],
        hasApiKey: !!config.robloxApiKey,
        hasOAuth: !!config.oauthAccessToken
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test group revenue access
router.get('/test-revenue/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const revenueData = await robloxApi.getGroupRevenue(groupId, 'Day');
    res.json({
      success: true,
      ...revenueData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Test economycreatorstats API
router.get('/test-economy-stats/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    const statsData = await robloxApi.getUniverseEconomyStats(universeId);
    res.json({
      success: true,
      ...statsData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Test engagement payouts API
router.get('/test-engagement-payouts/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    const payoutData = await robloxApi.getEngagementPayouts(universeId);
    res.json({
      success: true,
      ...payoutData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
