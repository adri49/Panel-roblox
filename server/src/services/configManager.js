import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, '../../config.json');

const defaultConfig = {
  robloxApiKey: '', // Clé API Groupe
  robloxUserApiKey: '', // Clé API Utilisateur (pour economycreatorstats/engagementpayouts)
  universeIds: [],
  groupId: '', // Group ID for revenue/transaction data
  cacheTTL: 300,
  lastUpdated: null,
  // Configuration OAuth 2.0
  oauthClientId: '',
  oauthClientSecret: '',
  oauthRedirectUri: '',
  oauth: null // Stockage des tokens OAuth { accessToken, refreshToken, expiresAt, scope, tokenType }
};

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return { ...defaultConfig, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    // Fallback to environment variables
    return {
      ...defaultConfig,
      robloxApiKey: process.env.ROBLOX_API_KEY || '',
      universeIds: process.env.UNIVERSE_IDS ? process.env.UNIVERSE_IDS.split(',').map(id => id.trim()) : [],
      cacheTTL: parseInt(process.env.CACHE_TTL) || 300
    };
  }

  saveConfig(newConfig) {
    try {
      this.config = {
        ...this.config,
        ...newConfig,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('✅ Configuration saved successfully to:', CONFIG_FILE);
      console.log('✅ API Key present:', !!this.config.robloxApiKey);
      console.log('✅ API Key length:', this.config.robloxApiKey?.length || 0);
      console.log('✅ Universe IDs:', this.config.universeIds);
      return true;
    } catch (error) {
      console.error('❌ Error saving config:', error);
      return false;
    }
  }

  getConfig() {
    return this.config;
  }

  getApiKey() {
    return this.config.robloxApiKey;
  }

  getUserApiKey() {
    return this.config.robloxUserApiKey;
  }

  getUniverseIds() {
    return this.config.universeIds;
  }

  getCacheTTL() {
    return this.config.cacheTTL || 300;
  }

  getGroupId() {
    return this.config.groupId;
  }

  setGroupId(groupId) {
    this.config.groupId = groupId;
    this.saveConfig(this.config);
  }

  addUniverseId(universeId) {
    if (!this.config.universeIds.includes(universeId)) {
      this.config.universeIds.push(universeId);
      this.saveConfig(this.config);
    }
  }

  removeUniverseId(universeId) {
    this.config.universeIds = this.config.universeIds.filter(id => id !== universeId);
    this.saveConfig(this.config);
  }

  // Méthodes OAuth 2.0
  getOAuthConfig() {
    return {
      clientId: this.config.oauthClientId,
      clientSecret: this.config.oauthClientSecret,
      redirectUri: this.config.oauthRedirectUri
    };
  }

  setOAuthConfig(clientId, clientSecret, redirectUri) {
    this.config.oauthClientId = clientId;
    this.config.oauthClientSecret = clientSecret;
    this.config.oauthRedirectUri = redirectUri;
    this.saveConfig(this.config);
  }

  getOAuthTokens() {
    return this.config.oauth;
  }

  setOAuthTokens(oauth) {
    this.config.oauth = oauth;
    this.saveConfig(this.config);
  }

  hasOAuthTokens() {
    return !!(this.config.oauth && this.config.oauth.accessToken);
  }

  clearOAuthTokens() {
    this.config.oauth = null;
    this.saveConfig(this.config);
  }

  // Méthode générique pour mettre à jour n'importe quelle partie de la config
  updateConfig(updates) {
    this.config = {
      ...this.config,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    this.saveConfig(this.config);
    return this.config;
  }
}

export default new ConfigManager();
