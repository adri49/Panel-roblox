import axios from 'axios';
import NodeCache from 'node-cache';
import configManager from './configManager.js';

const cache = new NodeCache({ stdTTL: 300 });

class RobloxAPI {
  constructor() {
    this.baseURL = 'https://apis.roblox.com';
    this.economyURL = 'https://economy.roblox.com';
    this.gamesURL = 'https://games.roblox.com';
  }

  getApiKey() {
    return configManager.getApiKey();
  }

  clearCache() {
    cache.flushAll();
    console.log('Cache cleared');
  }

  async getUniverseStats(universeId) {
    const cacheKey = `stats_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get basic game info
      const response = await axios.get(
        `${this.gamesURL}/v1/games?universeIds=${universeId}`
      );

      const gameData = response.data.data[0];

      if (!gameData) {
        throw new Error(`Universe ${universeId} not found`);
      }

      // Try to get revenue data
      let revenue = 0;
      try {
        const revenueData = await this.getGameRevenue(universeId);
        revenue = revenueData.totalRevenue || 0;
      } catch (error) {
        console.log(`Could not fetch revenue for ${universeId}`);
      }

      const stats = {
        universeId,
        name: gameData.name || 'Unknown',
        playing: gameData.playing || 0,
        visits: gameData.visits || 0,
        created: gameData.created,
        updated: gameData.updated,
        maxPlayers: gameData.maxPlayers || 0,
        creator: gameData.creator,
        revenue: revenue
      };

      cache.set(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error(`Error fetching stats for universe ${universeId}:`, error.message);
      throw error;
    }
  }

  async getGameRevenue(universeId) {
    const cacheKey = `revenue_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();

    try {
      let totalRevenue = 0;
      let products = [];

      // Try to get game passes (public API - no key needed)
      try {
        const gamePasses = await this.getGamePasses(universeId);
        products = [...gamePasses];

        totalRevenue = gamePasses.reduce((sum, pass) => {
          return sum + (pass.price || 0);
        }, 0);

        console.log(`Found ${gamePasses.length} game passes for universe ${universeId}`);
      } catch (error) {
        console.log(`Game passes error for ${universeId}: ${error.message}`);
      }

      // Note: Real revenue/sales data requires Analytics API or webhooks
      // which are not publicly available via Open Cloud yet
      const revenue = {
        universeId,
        totalRevenue,
        products,
        currency: 'R$',
        note: apiKey
          ? 'Showing game pass prices. Real sales data requires Analytics API access.'
          : 'Add API key for additional data access.'
      };

      cache.set(cacheKey, revenue);
      return revenue;
    } catch (error) {
      console.error(`Error fetching revenue for universe ${universeId}:`, error.message);
      return {
        universeId,
        totalRevenue: 0,
        products: [],
        error: error.message
      };
    }
  }

  async getGamePasses(universeId) {
    const cacheKey = `gamepasses_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.gamesURL}/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`
      );

      const gamePasses = response.data.data || [];
      cache.set(cacheKey, gamePasses);
      return gamePasses;
    } catch (error) {
      // If 404, the universe might not have any game passes or the ID is wrong
      if (error.response?.status === 404) {
        console.log(`No game passes found for universe ${universeId} (or invalid ID)`);
        return [];
      }
      console.error(`Error fetching game passes for ${universeId}:`, error.message);
      return [];
    }
  }

  async getSalesData(universeId) {
    const cacheKey = `sales_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();

    try {
      // Get available products (game passes)
      const products = await this.getGamePasses(universeId);

      // Mock transaction data from products
      // Real transaction history requires webhook integration or Analytics API
      const transactions = products.map(product => ({
        id: `product_${product.id}`,
        productName: product.name,
        productId: product.id,
        buyerUsername: 'Webhook required',
        buyerId: null,
        price: product.price || 0,
        currency: 'R$',
        timestamp: new Date().toISOString(),
        note: 'Configure webhooks for real purchase tracking'
      }));

      const sales = {
        universeId,
        transactions,
        totalSales: transactions.reduce((sum, t) => sum + t.price, 0),
        note: 'Real-time sales tracking requires webhook setup. Showing available products only.'
      };

      cache.set(cacheKey, sales);
      return sales;
    } catch (error) {
      console.error(`Error fetching sales for universe ${universeId}:`, error.message);
      return {
        universeId,
        transactions: [],
        totalSales: 0,
        error: error.message
      };
    }
  }

  async searchPurchases(query) {
    const cacheKey = `search_${query}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Get all transactions
      const universeIds = configManager.getUniverseIds();
      const allSales = await Promise.all(
        universeIds.map(id => this.getSalesData(id))
      );

      const allTransactions = allSales.flatMap(sale => sale.transactions);

      // Filter by query
      const filtered = allTransactions.filter(t =>
        t.productName.toLowerCase().includes(query.toLowerCase()) ||
        t.buyerUsername.toLowerCase().includes(query.toLowerCase())
      );

      const results = {
        query,
        transactions: filtered,
        totalSales: filtered.reduce((sum, t) => sum + t.price, 0)
      };

      cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Error searching purchases:`, error.message);
      return { query, transactions: [], totalSales: 0 };
    }
  }

  async convertPlaceToUniverse(placeId) {
    const cacheKey = `place_to_universe_${placeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseURL}/universes/v1/places/${placeId}/universe`
      );

      const universeId = response.data.universeId;

      if (!universeId) {
        throw new Error('Invalid Place ID or Place not found');
      }

      cache.set(cacheKey, universeId, 3600); // Cache for 1 hour
      return universeId;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Place ID not found. Vérifiez que le Place ID est correct.');
      }
      throw new Error(`Erreur lors de la conversion: ${error.message}`);
    }
  }
}

export default new RobloxAPI();
