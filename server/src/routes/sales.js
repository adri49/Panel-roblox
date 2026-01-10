import express from 'express';
import robloxApi from '../services/robloxApi.js';

const router = express.Router();

router.get('/:universeId', async (req, res) => {
  try {
    const { universeId } = req.params;
    const sales = await robloxApi.getSalesData(universeId);
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const results = await robloxApi.searchPurchases(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all/transactions', async (req, res) => {
  try {
    const universeIds = process.env.UNIVERSE_IDS?.split(',') || [];

    const allSales = await Promise.all(
      universeIds.map(async (id) => {
        return await robloxApi.getSalesData(id.trim());
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
