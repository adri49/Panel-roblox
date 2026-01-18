import axios from 'axios';
import teamConfigService from './teamConfigService.js';

/**
 * Service pour scraper les données du Creator Hub Roblox
 * Utilise le cookie de session pour récupérer les vraies analytics/revenus
 */
class CreatorHubScraperService {
  constructor() {
    this.creatorHubURL = 'https://create.roblox.com';
    this.analyticsAPIURL = 'https://apis.roblox.com/analytics';

    // Cache des données récupérées
    this.cache = new Map();
    this.cacheTTL = 3600000; // 1 heure
  }

  /**
   * Récupère les analytics d'un univers depuis le Creator Hub
   * @param {number} universeId - ID de l'univers
   * @param {number} teamId - ID de l'équipe (pour récupérer le cookie)
   * @returns {Promise<Object>} Données d'analytics
   */
  async getUniverseAnalytics(universeId, teamId) {
    const cacheKey = `analytics_${universeId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📊 Using cached analytics for universe ${universeId}`);
      return cached.data;
    }

    console.log(`🔍 Fetching Creator Hub analytics for universe ${universeId}...`);

    const sessionCookie = teamConfigService.getSessionCookie(teamId);
    if (!sessionCookie) {
      throw new Error('No session cookie configured for this team');
    }

    try {
      // Le Creator Hub utilise des endpoints internes pour charger les analytics
      // Essayons de récupérer les données via ces endpoints

      const headers = {
        'Cookie': `.ROBLOSECURITY=${sessionCookie}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      };

      // Endpoint 1: Revenue Summary
      const revenueSummary = await this.getRevenueSummary(universeId, headers);

      // Endpoint 2: Sales by Product
      const salesByProduct = await this.getSalesByProduct(universeId, headers);

      // Endpoint 3: Creator Rewards (si disponible)
      const creatorRewards = await this.getCreatorRewards(universeId, headers);

      const analytics = {
        universeId,
        revenue: revenueSummary,
        sales: salesByProduct,
        rewards: creatorRewards,
        fetchedAt: new Date().toISOString(),
        source: 'Creator Hub Scraper'
      };

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      console.log(`✅ Analytics retrieved for universe ${universeId}`);
      return analytics;

    } catch (error) {
      console.error(`❌ Error fetching Creator Hub analytics for ${universeId}:`, error.message);
      throw error;
    }
  }

  /**
   * Récupère le résumé des revenus
   */
  async getRevenueSummary(universeId, headers) {
    try {
      // Période: derniers 30 jours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        granularity: 'Daily'
      };

      // Endpoint pour les revenus (peut varier selon la version de l'API)
      const endpoints = [
        `https://economy.roblox.com/v2/users/universes/${universeId}/transaction-totals`,
        `https://apis.roblox.com/legacy/v1/universes/${universeId}/stats/revenue`,
        `https://develop.roblox.com/v1/universes/${universeId}/stats`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`  🔗 Trying endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            headers,
            params,
            timeout: 10000
          });

          if (response.data && Object.keys(response.data).length > 0) {
            console.log(`  ✅ Success with ${endpoint}`);
            return {
              totalRevenue: this.calculateTotalRevenue(response.data),
              details: response.data,
              source: endpoint
            };
          }
        } catch (error) {
          console.log(`  ❌ Failed: ${endpoint} - ${error.response?.status || error.message}`);
        }
      }

      return { totalRevenue: 0, details: null, source: 'none' };
    } catch (error) {
      console.error('Error getting revenue summary:', error.message);
      return { totalRevenue: 0, details: null, error: error.message };
    }
  }

  /**
   * Récupère les ventes par produit
   */
  async getSalesByProduct(universeId, headers) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      const endpoints = [
        `https://economy.roblox.com/v2/users/universes/${universeId}/sales`,
        `https://apis.roblox.com/legacy/v1/universes/${universeId}/sales`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`  🔗 Trying sales endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            headers,
            params,
            timeout: 10000
          });

          if (response.data) {
            console.log(`  ✅ Sales data retrieved from ${endpoint}`);
            return {
              transactions: this.parseSalesData(response.data),
              source: endpoint
            };
          }
        } catch (error) {
          console.log(`  ❌ Failed: ${endpoint} - ${error.response?.status || error.message}`);
        }
      }

      return { transactions: [], source: 'none' };
    } catch (error) {
      console.error('Error getting sales by product:', error.message);
      return { transactions: [], error: error.message };
    }
  }

  /**
   * Récupère les Creator Rewards (nouveau système)
   */
  async getCreatorRewards(universeId, headers) {
    try {
      // Les Creator Rewards sont peut-être disponibles sur un endpoint différent
      const endpoints = [
        `https://create.roblox.com/v1/universes/${universeId}/creator-rewards`,
        `https://apis.roblox.com/creator-rewards/v1/universes/${universeId}/earnings`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`  🔗 Trying Creator Rewards endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            headers,
            timeout: 10000
          });

          if (response.data) {
            console.log(`  ✅ Creator Rewards data retrieved`);
            return {
              earnings: response.data,
              source: endpoint
            };
          }
        } catch (error) {
          console.log(`  ❌ Failed: ${endpoint} - ${error.response?.status || error.message}`);
        }
      }

      return { earnings: null, source: 'none' };
    } catch (error) {
      console.error('Error getting creator rewards:', error.message);
      return { earnings: null, error: error.message };
    }
  }

  /**
   * Calcule le revenu total depuis les données
   */
  calculateTotalRevenue(data) {
    try {
      // Différents formats possibles selon l'endpoint
      if (data.total) return data.total;
      if (data.totalRobux) return data.totalRobux;
      if (data.revenue) return data.revenue;

      // Somme des transactions
      if (Array.isArray(data.transactions)) {
        return data.transactions.reduce((sum, t) => sum + (t.amount || t.robux || 0), 0);
      }

      // Somme des datapoints
      if (data.datapoints && Array.isArray(data.datapoints)) {
        return data.datapoints.reduce((sum, dp) => sum + (dp.value || 0), 0);
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Parse les données de ventes
   */
  parseSalesData(data) {
    try {
      if (!data) return [];

      // Format 1: Tableau de transactions
      if (Array.isArray(data)) {
        return data.map((sale, index) => ({
          id: sale.id || `sale_${index}`,
          productName: sale.productName || sale.name,
          amount: sale.amount || sale.robux || sale.price || 0,
          timestamp: sale.timestamp || sale.date || sale.created,
          type: sale.type || 'Unknown'
        }));
      }

      // Format 2: Objet avec transactions
      if (data.transactions && Array.isArray(data.transactions)) {
        return this.parseSalesData(data.transactions);
      }

      // Format 3: Objet avec sales
      if (data.sales && Array.isArray(data.sales)) {
        return this.parseSalesData(data.sales);
      }

      return [];
    } catch (error) {
      console.error('Error parsing sales data:', error.message);
      return [];
    }
  }

  /**
   * Nettoie le cache
   */
  clearCache(universeId = null) {
    if (universeId) {
      this.cache.delete(`analytics_${universeId}`);
    } else {
      this.cache.clear();
    }
  }
}

export default new CreatorHubScraperService();
