import axios from 'axios';
import NodeCache from 'node-cache';
import configManager from './configManager.js';
import teamConfigService from './teamConfigService.js';
import oauth2Service from './oauth2Service.js';

const cache = new NodeCache({ stdTTL: 300 });

class RobloxAPI {
  constructor() {
    this.baseURL = 'https://apis.roblox.com';
    this.economyURL = 'https://economy.roblox.com';
    this.gamesURL = 'https://games.roblox.com';
    this.economyCreatorStatsURL = 'https://economycreatorstats.roblox.com';
    this.engagementPayoutsURL = 'https://engagementpayouts.roblox.com';

    // Team config context (set by routes before API calls)
    this.currentTeamId = null;
  }

  /**
   * Set the current team context for API calls
   * This should be called by routes before making API calls
   */
  setTeamContext(teamId) {
    this.currentTeamId = teamId;
    // Also set it for oauth2Service
    oauth2Service.setTeamContext(teamId);
  }

  /**
   * Get the team config (either from current team context or fall back to global)
   */
  getTeamConfig() {
    if (this.currentTeamId) {
      return teamConfigService.getTeamConfig(this.currentTeamId);
    }
    // Fallback to old global config if no team context
    return configManager.getConfig();
  }

  getApiKey() {
    const config = this.getTeamConfig();
    return config.robloxApiKey || configManager.getApiKey();
  }

  /**
   * Obtient les headers d'authentification (OAuth prioritaire, sinon API Key)
   * @param {string} fallbackApiKey - Clé API de fallback si OAuth non disponible
   * @returns {Promise<object>} Headers d'authentification
   */
  async getAuthHeaders(fallbackApiKey = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Essayer OAuth en priorité
    try {
      if (oauth2Service.hasValidToken()) {
        const accessToken = await oauth2Service.getValidAccessToken();
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔐 Using OAuth 2.0 token for authentication');
        return headers;
      }
    } catch (error) {
      console.log('⚠️  OAuth token unavailable, falling back to API key:', error.message);
    }

    // Fallback sur API Key
    const apiKey = fallbackApiKey || this.getApiKey();
    if (apiKey) {
      headers['x-api-key'] = apiKey;
      console.log('🔑 Using API Key for authentication');
      return headers;
    }

    throw new Error('Aucune méthode d\'authentification disponible (OAuth ou API Key requise)');
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

  async getDeveloperProducts(universeId) {
    const cacheKey = `devproducts_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.log('No API key configured for Developer Products');
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/cloud/v2/universes/${universeId}/developer-products?maxPageSize=100`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      const products = response.data.developerProducts || [];
      cache.set(cacheKey, products);
      console.log(`Found ${products.length} developer products for universe ${universeId}`);
      return products;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`No developer products found for universe ${universeId}`);
        return [];
      }
      if (error.response?.status === 403) {
        console.log(`Permission denied for developer products - check scope: developer-product:read`);
        return [];
      }
      console.error(`Error fetching developer products for ${universeId}:`, error.message);
      return [];
    }
  }

  async getSubscriptions(universeId) {
    const cacheKey = `subscriptions_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.log('No API key configured for Subscriptions');
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/cloud/v2/universes/${universeId}/subscriptions?maxPageSize=100`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      const subscriptions = response.data.subscriptions || [];
      cache.set(cacheKey, subscriptions);
      console.log(`Found ${subscriptions.length} subscriptions for universe ${universeId}`);
      return subscriptions;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`No subscriptions found for universe ${universeId}`);
        return [];
      }
      if (error.response?.status === 403) {
        console.log(`Permission denied for subscriptions - check scope: subscription:read`);
        return [];
      }
      console.error(`Error fetching subscriptions for ${universeId}:`, error.message);
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

  async getGameDetails(universeId) {
    const cacheKey = `details_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Fetch all data in parallel for better performance
      const [stats, gamePasses, devProducts, subscriptions] = await Promise.all([
        this.getUniverseStats(universeId),
        this.getGamePasses(universeId),
        this.getDeveloperProducts(universeId),
        this.getSubscriptions(universeId)
      ]);

      const details = {
        universeId,
        ...stats,
        monetization: {
          gamePasses: gamePasses.map(gp => ({
            id: gp.id,
            name: gp.name,
            displayName: gp.displayName,
            price: gp.price || 0,
            isForSale: gp.price !== null,
            description: gp.description,
            iconImageId: gp.iconImageId
          })),
          developerProducts: devProducts.map(dp => ({
            id: dp.id || dp.path?.split('/').pop(),
            name: dp.displayName || dp.name,
            description: dp.description,
            price: dp.priceInRobux || 0,
            iconImageId: dp.iconImageAssetId
          })),
          subscriptions: subscriptions.map(sub => ({
            id: sub.id || sub.path?.split('/').pop(),
            name: sub.displayName || sub.name,
            description: sub.description,
            price: sub.priceInRobux || 0,
            period: sub.subscriptionPeriod
          }))
        },
        summary: {
          totalGamePasses: gamePasses.length,
          totalDeveloperProducts: devProducts.length,
          totalSubscriptions: subscriptions.length,
          totalMonetizationItems: gamePasses.length + devProducts.length + subscriptions.length
        }
      };

      cache.set(cacheKey, details);
      return details;
    } catch (error) {
      console.error(`Error fetching details for universe ${universeId}:`, error.message);
      throw error;
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

  async getUniverseEconomyStats(universeId) {
    const cacheKey = `economy_stats_${universeId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    console.log(`🔍 Fetching economycreatorstats API for universe ${universeId}...`);
    const url = `${this.economyCreatorStatsURL}/v1/universes/${universeId}/stats`;

    // Méthode 1: Essayer Cookie de Session (PRIORITÉ pour cette API legacy)
    if (this.currentTeamId) {
      const sessionCookie = teamConfigService.getSessionCookie(this.currentTeamId);
      if (sessionCookie) {
        try {
          console.log('  🍪 Trying with Session Cookie...');
          const response = await axios.get(url, {
            headers: {
              'Cookie': `.ROBLOSECURITY=${sessionCookie}`
            }
          });

          const statsData = {
            universeId,
            data: response.data,
            source: 'economycreatorstats API',
            authMethod: 'Session Cookie',
            fetchedAt: new Date().toISOString()
          };

          cache.set(cacheKey, statsData, 300);
          console.log('  ✅ Success with Session Cookie!');
          console.log(`  📊 Data:`, JSON.stringify(response.data, null, 2));
          return statsData;
        } catch (error) {
          console.log(`  ❌ Session Cookie failed: ${error.response?.status} ${error.response?.statusText}`);
          if (error.response?.data) {
            console.log(`  📋 Details:`, JSON.stringify(error.response.data, null, 2));
          }
        }
      }
    }

    // Méthode 2: Essayer OAuth 2.0 (peu probable de fonctionner)
    try {
      if (oauth2Service.hasValidToken()) {
        const headers = await this.getAuthHeaders();
        console.log('  🔐 Trying with OAuth 2.0...');

        const response = await axios.get(url, { headers });

        const statsData = {
          universeId,
          data: response.data,
          source: 'economycreatorstats API',
          authMethod: 'OAuth 2.0',
          fetchedAt: new Date().toISOString()
        };

        cache.set(cacheKey, statsData, 300);
        console.log('  ✅ Success with OAuth 2.0!');
        console.log(`  📊 Data:`, JSON.stringify(response.data, null, 2));
        return statsData;
      }
    } catch (error) {
      console.log(`  ❌ OAuth 2.0 failed: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`  📋 Details:`, JSON.stringify(error.response.data, null, 2));
      }
    }

    // Méthode 3: Fallback sur API Keys (peu probable de fonctionner)
    const groupApiKey = this.getApiKey();
    const userApiKey = configManager.getUserApiKey();

    const apiKeys = [
      { key: userApiKey, type: 'Utilisateur' },
      { key: groupApiKey, type: 'Groupe' }
    ].filter(k => k.key);

    for (const { key, type } of apiKeys) {
      try {
        console.log(`  🔑 Trying with ${type} API Key (${key.substring(0, 10)}...)`);
        const response = await axios.get(url, {
          headers: { 'x-api-key': key }
        });

        const statsData = {
          universeId,
          data: response.data,
          source: 'economycreatorstats API',
          authMethod: `API Key (${type})`,
          fetchedAt: new Date().toISOString()
        };

        cache.set(cacheKey, statsData, 300);
        console.log(`  ✅ Success with ${type} API Key!`);
        console.log(`  📊 Data:`, JSON.stringify(response.data, null, 2));
        return statsData;
      } catch (error) {
        console.log(`  ❌ ${type} API Key failed: ${error.response?.status} ${error.response?.statusText}`);
        if (error.response?.data) {
          console.log(`  📋 Details:`, JSON.stringify(error.response.data, null, 2));
        }
      }
    }

    throw new Error('economycreatorstats API failed with all authentication methods (Cookie, OAuth, API Keys)');
  }

  async getEngagementPayouts(universeId, startDate = null, endDate = null) {
    // Par défaut: derniers 30 jours
    if (!startDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }

    if (!endDate) {
      endDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }

    const cacheKey = `engagement_payouts_${universeId}_${startDate}_${endDate}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    console.log(`🔍 Fetching engagementpayouts API for universe ${universeId}...`);
    console.log(`   📅 Period: ${startDate} → ${endDate}`);

    // Endpoint correct avec paramètres
    const url = `${this.engagementPayoutsURL}/v1/universe-payout-history`;
    const params = {
      universeId: universeId,
      startDate: startDate,
      endDate: endDate
    };

    // Méthode 1: Essayer Cookie de Session (PRIORITÉ pour cette API legacy)
    if (this.currentTeamId) {
      const sessionCookie = teamConfigService.getSessionCookie(this.currentTeamId);
      if (sessionCookie) {
        try {
          console.log('  🍪 Trying with Session Cookie...');
          const response = await axios.get(url, {
            headers: {
              'Cookie': `.ROBLOSECURITY=${sessionCookie}`
            },
            params
          });

          const payoutData = {
            universeId,
            startDate,
            endDate,
            data: response.data,
            source: 'engagementpayouts API',
            authMethod: 'Session Cookie',
            fetchedAt: new Date().toISOString()
          };

          cache.set(cacheKey, payoutData, 300);
          console.log('  ✅ Success with Session Cookie!');
          console.log(`  📊 Data:`, JSON.stringify(response.data, null, 2));
          return payoutData;
        } catch (error) {
          console.log(`  ❌ Session Cookie failed: ${error.response?.status} ${error.response?.statusText}`);
          if (error.response?.data) {
            console.log(`  📋 Details:`, JSON.stringify(error.response.data, null, 2));
          }
        }
      }
    }

    // Méthode 2: Essayer OAuth 2.0 (peu probable de fonctionner)
    try {
      if (oauth2Service.hasValidToken()) {
        const headers = await this.getAuthHeaders();
        console.log('  🔐 Trying with OAuth 2.0...');

        const response = await axios.get(url, { headers, params });

        const payoutData = {
          universeId,
          startDate,
          endDate,
          data: response.data,
          source: 'engagementpayouts API',
          authMethod: 'OAuth 2.0',
          fetchedAt: new Date().toISOString()
        };

        cache.set(cacheKey, payoutData, 300);
        console.log('  ✅ Success with OAuth 2.0!');
        console.log(`  📊 Data:`, JSON.stringify(response.data, null, 2));
        return payoutData;
      }
    } catch (error) {
      console.log(`  ❌ OAuth 2.0 failed: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log(`  📋 Details:`, JSON.stringify(error.response.data, null, 2));
      }
    }

    // Méthode 3: Fallback sur API Keys (peu probable de fonctionner)
    const groupApiKey = this.getApiKey();
    const userApiKey = configManager.getUserApiKey();

    const apiKeys = [
      { key: userApiKey, type: 'Utilisateur' },
      { key: groupApiKey, type: 'Groupe' }
    ].filter(k => k.key);

    for (const { key, type } of apiKeys) {
      try {
        console.log(`  🔑 Trying with ${type} API Key (${key.substring(0, 10)}...)`);
        const response = await axios.get(url, {
          headers: { 'x-api-key': key },
          params
        });

        const payoutData = {
          universeId,
          startDate,
          endDate,
          data: response.data,
          source: 'engagementpayouts API',
          authMethod: `API Key (${type})`,
          fetchedAt: new Date().toISOString()
        };

        cache.set(cacheKey, payoutData, 300);
        console.log(`  ✅ Success with ${type} API Key!`);
        console.log(`  📊 Data:`, JSON.stringify(response.data, null, 2));
        return payoutData;
      } catch (error) {
        console.log(`  ❌ ${type} API Key failed: ${error.response?.status} ${error.response?.statusText}`);
        if (error.response?.data) {
          console.log(`  📋 Details:`, JSON.stringify(error.response.data, null, 2));
        }
      }
    }

    throw new Error('engagementpayouts API failed with all authentication methods (Cookie, OAuth, API Keys)');
  }

  async getGroupRevenue(groupId, timeFrame = 'Day') {
    const cacheKey = `group_revenue_${groupId}_${timeFrame}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key required for group revenue data');
    }

    const headers = {
      'x-api-key': apiKey
    };

    // Try both APIs to see which one works
    const endpoints = [
      {
        name: 'Transaction Records API (New)',
        url: `https://apis.roblox.com/transaction-records/v1/groups/${groupId}/revenue/summary/${timeFrame.toLowerCase()}`
      },
      {
        name: 'Economy API (Legacy)',
        url: `${this.economyURL}/v1/groups/${groupId}/revenue/summary/${timeFrame}`
      }
    ];

    console.log(`🔍 Attempting to fetch group ${groupId} revenue...`);

    for (const endpoint of endpoints) {
      try {
        console.log(`  Trying ${endpoint.name}: ${endpoint.url}`);
        const response = await axios.get(endpoint.url, { headers });

        const revenueData = {
          groupId,
          timeFrame,
          data: response.data,
          source: endpoint.name,
          fetchedAt: new Date().toISOString()
        };

        cache.set(cacheKey, revenueData, 300); // Cache for 5 minutes
        console.log(`  ✅ Success with ${endpoint.name}!`);
        return revenueData;
      } catch (error) {
        console.log(`  ❌ Failed with ${endpoint.name}: ${error.response?.status} ${error.response?.statusText}`);
        if (error.response?.data) {
          console.log(`  📋 Error details:`, error.response.data);
        }
      }
    }

    throw new Error('Unable to fetch group revenue from any endpoint. This might require cookie authentication (.ROBLOSECURITY) instead of API key.');
  }

  async testApiKeyPermissions() {
    const apiKey = this.getApiKey();
    const universeIds = configManager.getUniverseIds();
    const testUniverseId = universeIds.length > 0 ? universeIds[0] : '53346239'; // Bloxburg as fallback

    console.log('🔍 Testing API Key Permissions...');
    console.log('🔑 API Key present:', !!apiKey);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    console.log('🔑 API Key first 10 chars:', apiKey?.substring(0, 10) || 'N/A');
    console.log('🎮 Test Universe ID:', testUniverseId);

    if (!apiKey) {
      return [{
        name: 'Clé API',
        endpoint: 'N/A',
        success: false,
        message: 'Aucune clé API configurée',
        scope: 'N/A'
      }];
    }

    const tests = [];
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    };

    console.log('📤 Headers being sent:', { 'x-api-key': apiKey.substring(0, 20) + '...', 'Content-Type': 'application/json' });

    // Test 1: Basic Games API (no auth needed, but good sanity check)
    try {
      await axios.get(`${this.gamesURL}/v1/games?universeIds=${testUniverseId}`);
      tests.push({
        name: 'API Statistiques de base',
        endpoint: '/v1/games',
        success: true,
        message: 'Accès aux statistiques publiques OK',
        scope: 'Public (pas besoin de scope)'
      });
    } catch (error) {
      tests.push({
        name: 'API Statistiques de base',
        endpoint: '/v1/games',
        success: false,
        message: `Erreur: ${error.response?.status || error.message}`,
        scope: 'Public'
      });
    }

    // Test 2: Game Passes API (public)
    try {
      await axios.get(`${this.gamesURL}/v1/games/${testUniverseId}/game-passes?limit=10`);
      tests.push({
        name: 'API Game Passes',
        endpoint: `/v1/games/${testUniverseId}/game-passes`,
        success: true,
        message: 'Accès aux game passes OK',
        scope: 'Public (pas besoin de scope)'
      });
    } catch (error) {
      tests.push({
        name: 'API Game Passes',
        endpoint: `/v1/games/${testUniverseId}/game-passes`,
        success: false,
        message: `Erreur: ${error.response?.status || error.message}`,
        scope: 'Public'
      });
    }

    // Test 3: Open Cloud - Universe info (requires auth)
    try {
      const response = await axios.get(
        `${this.baseURL}/cloud/v2/universes/${testUniverseId}`,
        { headers }
      );
      tests.push({
        name: 'Open Cloud - Universe Info',
        endpoint: `/cloud/v2/universes/${testUniverseId}`,
        success: true,
        message: 'Accès Open Cloud OK',
        scope: 'universe.read ou similaire',
        details: response.data
      });
    } catch (error) {
      const status = error.response?.status;
      let message = '';
      let scope = 'universe.read';

      if (status === 401) {
        message = 'Clé API invalide ou expirée';
      } else if (status === 403) {
        message = 'Permission refusée - scope manquant';
        scope = '❌ MANQUANT: universe.read';
      } else if (status === 404) {
        message = 'Endpoint non trouvé ou Universe ID invalide';
      } else {
        message = `Erreur ${status}: ${error.response?.data?.message || error.message}`;
      }

      tests.push({
        name: 'Open Cloud - Universe Info',
        endpoint: `/cloud/v2/universes/${testUniverseId}`,
        success: false,
        message,
        scope
      });
    }

    // Test 4: Open Cloud - Developer Products (requires specific scope)
    try {
      const response = await axios.get(
        `${this.baseURL}/cloud/v2/universes/${testUniverseId}/developer-products`,
        { headers }
      );
      tests.push({
        name: 'Open Cloud - Developer Products',
        endpoint: `/cloud/v2/universes/${testUniverseId}/developer-products`,
        success: true,
        message: 'Accès aux produits développeur OK',
        scope: 'developer-products:read',
        productCount: response.data?.developerProducts?.length || 0
      });
    } catch (error) {
      const status = error.response?.status;
      let message = '';
      let scope = 'developer-products:read';

      if (status === 401) {
        message = 'Clé API invalide';
      } else if (status === 403) {
        message = 'Permission refusée - scope manquant';
        scope = '❌ MANQUANT: developer-products:read';
      } else if (status === 404) {
        message = 'Endpoint non trouvé (peut-être pas de produits)';
      } else {
        message = `Erreur ${status}: ${error.response?.data?.message || error.message}`;
      }

      tests.push({
        name: 'Open Cloud - Developer Products',
        endpoint: `/cloud/v2/universes/${testUniverseId}/developer-products`,
        success: false,
        message,
        scope
      });
    }

    // Test 5: Analytics API (if available)
    try {
      const response = await axios.get(
        `${this.baseURL}/cloud/v2/universes/${testUniverseId}/analytics`,
        { headers }
      );
      tests.push({
        name: 'Open Cloud - Analytics',
        endpoint: `/cloud/v2/universes/${testUniverseId}/analytics`,
        success: true,
        message: 'Accès aux analytics OK',
        scope: 'analytics:read'
      });
    } catch (error) {
      const status = error.response?.status;
      let message = '';
      let scope = 'analytics:read';

      if (status === 403) {
        message = 'Permission refusée - scope manquant ou non disponible';
        scope = '❌ MANQUANT: analytics:read (peut ne pas être disponible)';
      } else if (status === 404) {
        message = 'Analytics API pas encore disponible';
        scope = '⚠️ Analytics API pas encore publié par Roblox';
      } else {
        message = `Erreur ${status}`;
      }

      tests.push({
        name: 'Open Cloud - Analytics',
        endpoint: `/cloud/v2/universes/${testUniverseId}/analytics`,
        success: false,
        message,
        scope
      });
    }

    return tests;
  }
}

export default new RobloxAPI();
