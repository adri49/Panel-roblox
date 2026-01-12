import express from 'express';
import configManager from '../services/configManager.js';
import robloxApi from '../services/robloxApi.js';

const router = express.Router();

// Get current configuration (sanitized - no API key exposed)
router.get('/', (req, res) => {
  try {
    const config = configManager.getConfig();
    res.json({
      universeIds: config.universeIds,
      groupId: config.groupId || '',
      cacheTTL: config.cacheTTL,
      hasApiKey: !!config.robloxApiKey,
      lastUpdated: config.lastUpdated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update configuration
router.post('/', (req, res) => {
  try {
    const { robloxApiKey, universeIds, cacheTTL } = req.body;

    const newConfig = {};

    if (robloxApiKey !== undefined) {
      newConfig.robloxApiKey = robloxApiKey;
    }

    if (universeIds !== undefined) {
      if (!Array.isArray(universeIds)) {
        return res.status(400).json({ error: 'universeIds must be an array' });
      }
      newConfig.universeIds = universeIds.map(id => id.toString().trim()).filter(id => id);
    }

    if (cacheTTL !== undefined) {
      newConfig.cacheTTL = parseInt(cacheTTL) || 300;
    }

    const success = configManager.saveConfig(newConfig);

    if (success) {
      // Clear cache when configuration changes
      robloxApi.clearCache();

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        config: {
          universeIds: configManager.getUniverseIds(),
          cacheTTL: configManager.getCacheTTL(),
          hasApiKey: !!configManager.getApiKey(),
          lastUpdated: configManager.getConfig().lastUpdated
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a universe ID
router.post('/universe', (req, res) => {
  try {
    const { universeId } = req.body;

    if (!universeId) {
      return res.status(400).json({ error: 'universeId is required' });
    }

    const trimmedId = universeId.toString().trim();
    const currentIds = configManager.getUniverseIds();

    // Check for duplicates
    if (currentIds.includes(trimmedId)) {
      return res.status(400).json({
        error: 'Ce Universe ID est déjà ajouté',
        duplicate: true
      });
    }

    configManager.addUniverseId(trimmedId);
    robloxApi.clearCache();

    res.json({
      success: true,
      message: 'Universe ID added',
      universeIds: configManager.getUniverseIds()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a universe ID
router.delete('/universe/:universeId', (req, res) => {
  try {
    const { universeId } = req.params;

    configManager.removeUniverseId(universeId);
    robloxApi.clearCache();

    res.json({
      success: true,
      message: 'Universe ID removed',
      universeIds: configManager.getUniverseIds()
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
  const groupId = configManager.getGroupId();
  res.json({ groupId: groupId || '' });
});

router.post('/group-id', (req, res) => {
  try {
    const { groupId } = req.body;
    configManager.setGroupId(groupId);
    res.json({
      success: true,
      groupId,
      config: {
        groupId: configManager.getGroupId(),
        universeIds: configManager.getUniverseIds(),
        hasApiKey: !!configManager.getApiKey()
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
