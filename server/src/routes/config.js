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

    configManager.addUniverseId(universeId.toString().trim());
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

export default router;
