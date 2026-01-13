import express from 'express';
import robloxApi from '../services/robloxApi.js';
import teamConfigService from '../services/teamConfigService.js';
import { extractTeamId } from '../middleware/team.js';

const router = express.Router();

// Appliquer le middleware de team ID à toutes les routes
router.use(extractTeamId);

router.get('/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    robloxApi.setTeamContext(req.teamId);
    const sales = await robloxApi.getSalesData(universeId);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    robloxApi.setTeamContext(req.teamId);
    const results = await robloxApi.searchPurchases(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all/transactions', async (req, res) => {
  try {
    robloxApi.setTeamContext(req.teamId);
    const config = teamConfigService.getTeamConfig(req.teamId);
    const universeIds = config.universeIds || [];

    if (universeIds.length === 0) {
      return res.json({
        transactions: [],
        totalSales: 0
      });
    }

    const allSales = await Promise.all(
      universeIds.map(async (id) => {
        try {
          return await robloxApi.getSalesData(id.trim());
        } catch (error) {
          console.error(`Error fetching sales for ${id}:`, error.message);
          return { universeId: id, transactions: [], totalSales: 0 };
        }
      })
    );

    const combinedTransactions = allSales.flatMap(sale =>
      sale.transactions.map(t => ({
        ...t,
        universeId: sale.universeId
      }))
    );

    res.json({
      transactions: combinedTransactions,
      totalSales: allSales.reduce((sum, s) => sum + s.totalSales, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
