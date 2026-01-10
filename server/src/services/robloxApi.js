import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

class RobloxAPI {
  constructor() {
    this.apiKey = process.env.ROBLOX_API_KEY;
    this.baseURL = 'https://apis.roblox.com';
    this.economyURL = 'https://economy.roblox.com';
    this.gamesURL = 'https://games.roblox.com';
  }

  async getUniverseStats(universeId) {
    const cacheKey = `stats_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.gamesURL}/v1/games?universeIds=${universeId}`
      );

      const gameData = response.data.data[0];

      const stats = {
        universeId,
        name: gameData?.name || 'Unknown',
        playing: gameData?.playing || 0,
        visits: gameData?.visits || 0,
        created: gameData?.created,
        updated: gameData?.updated,
        maxPlayers: gameData?.maxPlayers || 0,
        creator: gameData?.creator
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

    try {
      const headers = this.apiKey ? {
        'x-api-key': this.apiKey
      } : {};

      const response = await axios.get(
        `${this.economyURL}/v2/developer-products/list`,
        { headers }
      );

      const revenue = {
        universeId,
        totalRevenue: 0,
        products: response.data.data || []
      };

      cache.set(cacheKey, revenue);
      return revenue;
    } catch (error) {
      console.error(`Error fetching revenue for universe ${universeId}:`, error.message);
      return { universeId, totalRevenue: 0, products: [] };
    }
  }

  async getGamePasses(universeId) {
    try {
      const response = await axios.get(
        `${this.gamesURL}/v1/games/${universeId}/game-passes`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching game passes:`, error.message);
      return [];
    }
  }

  async getSalesData(universeId) {
    const cacheKey = `sales_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const headers = this.apiKey ? {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      } : {};

      const sales = {
        universeId,
        transactions: [],
        totalSales: 0
      };

      cache.set(cacheKey, sales);
      return sales;
    } catch (error) {
      console.error(`Error fetching sales:`, error.message);
      return { universeId, transactions: [], totalSales: 0 };
    }
  }

  async searchPurchases(query) {
    const cacheKey = `search_${query}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const results = {
        query,
        results: []
      };

      cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error(`Error searching purchases:`, error.message);
      return { query, results: [] };
    }
  }
}

export default new RobloxAPI();
