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

    if (!apiKey) {
      console.warn('No API key configured, revenue data unavailable');
      return { universeId, totalRevenue: 0, products: [], message: 'API key required' };
    }

    try {
      const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      };

      // Get developer products for this universe
      let totalRevenue = 0;
      let products = [];

      try {
        // Get developer products using Open Cloud API
        const productsResponse = await axios.get(
          `${this.baseURL}/cloud/v2/universes/${universeId}/developer-products`,
          { headers }
        );

        products = productsResponse.data.developerProducts || [];

        // Calculate estimated revenue from product prices
        totalRevenue = products.reduce((sum, product) => {
          return sum + (product.priceInRobux || 0);
        }, 0);
      } catch (error) {
        console.log(`Developer products API error: ${error.message}`);
      }

      // Try to get game passes as additional revenue source
      try {
        const gamePasses = await this.getGamePasses(universeId);
        products = [...products, ...gamePasses];

        totalRevenue += gamePasses.reduce((sum, pass) => {
          return sum + (pass.price || 0);
        }, 0);
      } catch (error) {
        console.log(`Game passes error: ${error.message}`);
      }

      const revenue = {
        universeId,
        totalRevenue,
        products,
        currency: 'R$'
      };

      cache.set(cacheKey, revenue);
      return revenue;
    } catch (error) {
      console.error(`Error fetching revenue for universe ${universeId}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
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
        `${this.gamesURL}/v1/games/${universeId}/game-passes?limit=100`
      );

      const gamePasses = response.data.data || [];
      cache.set(cacheKey, gamePasses);
      return gamePasses;
    } catch (error) {
      console.error(`Error fetching game passes for ${universeId}:`, error.message);
      return [];
    }
  }

  async getSalesData(universeId) {
    const cacheKey = `sales_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        universeId,
        transactions: [],
        totalSales: 0,
        message: 'API key required for sales data'
      };
    }

    try {
      const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      };

      // Note: Roblox doesn't provide a direct "sales transactions" API in Open Cloud
      // This would need to be implemented with Economy API or Analytics API when available
      // For now, we return the game passes and developer products as "catalog"

      const products = await this.getGamePasses(universeId);

      // Mock transaction data from products (in reality, you'd need webhooks or analytics API)
      const transactions = products.map(product => ({
        id: `tx_${product.id}_${Date.now()}`,
        productName: product.name,
        productId: product.id,
        buyerUsername: 'N/A', // Not available without transaction API
        buyerId: null,
        price: product.price || 0,
        currency: 'R$',
        timestamp: new Date().toISOString(),
        note: 'Transaction history requires webhook integration'
      }));

      const sales = {
        universeId,
        transactions,
        totalSales: transactions.reduce((sum, t) => sum + t.price, 0),
        note: 'Real-time transaction tracking requires webhook setup'
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
}

export default new RobloxAPI();
