import axios from 'axios';
import teamConfigService from './teamConfigService.js';

/**
 * Service pour récupérer les analytics depuis les dashboards Roblox
 * Scrape les endpoints internes utilisés par le Creator Dashboard et Group Revenue
 */
class DashboardScraperService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 600000; // 10 minutes
  }

  /**
   * Récupère toutes les analytics pour un univers
   * @param {number} universeId - ID de l'univers
   * @param {number} groupId - ID du groupe (optionnel)
   * @param {number} teamId - ID de l'équipe (pour le cookie)
   */
  async getAllAnalytics(universeId, teamId, groupId = null) {
    const cacheKey = `all_analytics_${universeId}_${groupId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    console.log(`📊 Récupération complète des analytics pour universe ${universeId}...`);

    const sessionCookie = teamConfigService.getSessionCookie(teamId);
    if (!sessionCookie) {
      throw new Error('Cookie de session requis');
    }

    const headers = this.getHeaders(sessionCookie);

    const results = {
      universeId,
      groupId,
      revenue: await this.getRevenue(universeId, groupId, headers),
      sales: await this.getSales(universeId, groupId, headers),
      performance: await this.getPerformance(universeId, headers),
      retention: await this.getRetention(universeId, headers),
      engagement: await this.getEngagement(universeId, headers),
      audience: await this.getAudience(universeId, headers),
      monetization: await this.getMonetization(universeId, headers),
      ads: await this.getAds(universeId, headers),
      creatorRewards: await this.getCreatorRewards(universeId, headers),
      errors: await this.getErrors(universeId, headers),
      fetchedAt: new Date().toISOString()
    };

    this.cache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    return results;
  }

  /**
   * Récupère les données de revenus
   */
  async getRevenue(universeId, groupId, headers) {
    console.log(`💰 Récupération des revenus...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const endpoints = [];

    // Endpoints pour Group Revenue
    if (groupId) {
      endpoints.push(
        { url: `https://economy.roblox.com/v2/groups/${groupId}/revenue/summary?startDate=${startDateStr}&endDate=${endDateStr}`, type: 'group_summary' },
        { url: `https://economy.roblox.com/v2/groups/${groupId}/transactions?startDate=${startDateStr}&endDate=${endDateStr}`, type: 'group_transactions' },
        { url: `https://economy.roblox.com/v1/groups/${groupId}/revenue/summary/month`, type: 'group_monthly' }
      );
    }

    // Endpoints pour Universe Revenue
    endpoints.push(
      { url: `https://develop.roblox.com/v1/universes/${universeId}/revenue/summary?startDate=${startDateStr}&endDate=${endDateStr}`, type: 'universe_summary' },
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/standard-events/revenue?startDate=${startDateStr}&endDate=${endDateStr}`, type: 'analytics_revenue' },
      { url: `https://apis.roblox.com/metrics-api/v1/universes/${universeId}/metrics/revenue?granularity=Daily&startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`, type: 'metrics_revenue' }
    );

    return await this.tryEndpoints(endpoints, headers, 'revenue');
  }

  /**
   * Récupère les données de ventes
   */
  async getSales(universeId, groupId, headers) {
    console.log(`💳 Récupération des ventes...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const endpoints = [];

    if (groupId) {
      endpoints.push(
        { url: `https://economy.roblox.com/v2/groups/${groupId}/transactions?startDate=${startDateStr}&endDate=${endDateStr}&transactionType=Sale`, type: 'group_sales' }
      );
    }

    endpoints.push(
      { url: `https://develop.roblox.com/v1/universes/${universeId}/sales?startDate=${startDateStr}&endDate=${endDateStr}`, type: 'universe_sales' },
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/standard-events/sales?startDate=${startDateStr}&endDate=${endDateStr}`, type: 'analytics_sales' },
      { url: `https://economy.roblox.com/v2/users/universes/${universeId}/transactions?startDate=${startDateStr}&endDate=${endDateStr}`, type: 'user_universe_transactions' }
    );

    return await this.tryEndpoints(endpoints, headers, 'sales');
  }

  /**
   * Récupère les données de performance
   */
  async getPerformance(universeId, headers) {
    console.log(`📈 Récupération des performances...`);

    const endpoints = [
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/performance`, type: 'performance_v1' },
      { url: `https://develop.roblox.com/v1/universes/${universeId}/stats`, type: 'universe_stats' },
      { url: `https://apis.roblox.com/metrics-api/v1/universes/${universeId}/metrics/performance`, type: 'metrics_performance' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'performance');
  }

  /**
   * Récupère les données de rétention
   */
  async getRetention(universeId, headers) {
    console.log(`🔁 Récupération de la rétention...`);

    const endpoints = [
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/retention`, type: 'retention_v1' },
      { url: `https://develop.roblox.com/v1/universes/${universeId}/analytics/retention`, type: 'dev_retention' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'retention');
  }

  /**
   * Récupère les données d'engagement
   */
  async getEngagement(universeId, headers) {
    console.log(`👥 Récupération de l'engagement...`);

    const endpoints = [
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/engagement`, type: 'engagement_v1' },
      { url: `https://develop.roblox.com/v1/universes/${universeId}/analytics/engagement`, type: 'dev_engagement' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'engagement');
  }

  /**
   * Récupère les données d'audience
   */
  async getAudience(universeId, headers) {
    console.log(`🌍 Récupération de l'audience...`);

    const endpoints = [
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/audience`, type: 'audience_v1' },
      { url: `https://develop.roblox.com/v1/universes/${universeId}/analytics/audience`, type: 'dev_audience' },
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/demographic`, type: 'demographic' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'audience');
  }

  /**
   * Récupère les données de monétisation
   */
  async getMonetization(universeId, headers) {
    console.log(`💎 Récupération de la monétisation...`);

    const endpoints = [
      { url: `https://develop.roblox.com/v1/universes/${universeId}/developer-products?limit=100`, type: 'dev_products' },
      { url: `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100`, type: 'game_passes' },
      { url: `https://apis.roblox.com/subscriptions/v1/universes/${universeId}/subscriptions`, type: 'subscriptions' },
      { url: `https://apis.roblox.com/monetization/v1/universes/${universeId}/overview`, type: 'monetization_overview' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'monetization');
  }

  /**
   * Récupère les données des pubs immersives
   */
  async getAds(universeId, headers) {
    console.log(`📺 Récupération des données publicitaires...`);

    const endpoints = [
      { url: `https://apis.roblox.com/ads-api/v1/universes/${universeId}/ad-performance`, type: 'ad_performance' },
      { url: `https://apis.roblox.com/immersive-ads/v1/universes/${universeId}/analytics`, type: 'immersive_ads' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'ads');
  }

  /**
   * Récupère les Creator Rewards
   */
  async getCreatorRewards(universeId, headers) {
    console.log(`🎁 Récupération des Creator Rewards...`);

    const endpoints = [
      { url: `https://apis.roblox.com/creator-rewards/v1/universes/${universeId}/earnings`, type: 'rewards_earnings' },
      { url: `https://create.roblox.com/v1/universes/${universeId}/creator-rewards`, type: 'create_rewards' },
      { url: `https://apis.roblox.com/creator-rewards/v1/universes/${universeId}/analytics`, type: 'rewards_analytics' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'creator_rewards');
  }

  /**
   * Récupère les erreurs
   */
  async getErrors(universeId, headers) {
    console.log(`⚠️  Récupération des erreurs...`);

    const endpoints = [
      { url: `https://apis.roblox.com/analytics/v1/universes/${universeId}/errors`, type: 'errors_v1' },
      { url: `https://develop.roblox.com/v1/universes/${universeId}/errors`, type: 'dev_errors' }
    ];

    return await this.tryEndpoints(endpoints, headers, 'errors');
  }

  /**
   * Essaie plusieurs endpoints jusqu'à ce qu'un fonctionne
   */
  async tryEndpoints(endpoints, headers, category) {
    const results = {
      category,
      data: null,
      source: null,
      attempts: []
    };

    for (const endpoint of endpoints) {
      try {
        console.log(`  🔗 Tentative: ${endpoint.type} - ${endpoint.url}`);

        const response = await axios.get(endpoint.url, {
          headers,
          timeout: 15000,
          validateStatus: (status) => status < 500 // Accepte 4xx pour logging
        });

        results.attempts.push({
          endpoint: endpoint.type,
          status: response.status,
          success: response.status === 200
        });

        if (response.status === 200 && response.data) {
          console.log(`  ✅ Succès avec ${endpoint.type}`);
          results.data = response.data;
          results.source = endpoint.type;
          results.endpoint = endpoint.url;
          return results;
        } else {
          console.log(`  ⚠️  ${endpoint.type}: HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.type}: ${error.message}`);
        results.attempts.push({
          endpoint: endpoint.type,
          error: error.message
        });
      }
    }

    console.log(`  ℹ️  Aucun endpoint fonctionnel pour ${category}`);
    return results;
  }

  /**
   * Génère les headers HTTP avec authentification
   */
  getHeaders(sessionCookie) {
    return {
      'Cookie': `.ROBLOSECURITY=${sessionCookie}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://create.roblox.com/',
      'Origin': 'https://create.roblox.com'
    };
  }

  /**
   * Nettoie le cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache nettoyé');
  }
}

export default new DashboardScraperService();
