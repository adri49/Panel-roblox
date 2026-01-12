import crypto from 'crypto';
import axios from 'axios';
import configManager from './configManager.js';
import teamConfigService from './teamConfigService.js';

/**
 * Service OAuth 2.0 pour Roblox Open Cloud
 * Implémente le flow Authorization Code avec PKCE
 * Documentation: https://create.roblox.com/docs/cloud/auth/oauth2-overview
 */
class OAuth2Service {
  constructor() {
    this.authURL = 'https://apis.roblox.com/oauth/v1';
    this.redirectUri = null; // Sera configuré dynamiquement
    this.clientId = null;
    this.clientSecret = null;

    // Stockage temporaire des sessions OAuth (code_verifier)
    // En production, utiliser Redis ou une DB
    this.pendingSessions = new Map();

    // Team config context
    this.currentTeamId = null;
  }

  /**
   * Set the current team context for OAuth operations
   */
  setTeamContext(teamId) {
    this.currentTeamId = teamId;
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

  /**
   * Configure le client OAuth
   */
  configure(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;

    console.log('✅ OAuth 2.0 configured');
    console.log('   Client ID:', clientId);
    console.log('   Redirect URI:', redirectUri);
  }

  /**
   * Génère un code verifier aléatoire pour PKCE
   */
  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Génère le code challenge à partir du verifier
   */
  generateCodeChallenge(verifier) {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Génère un state aléatoire pour prévenir CSRF
   */
  generateState() {
    return crypto.randomBytes(16).toString('base64url');
  }

  /**
   * Démarre le flow OAuth - Génère l'URL d'autorisation
   * @param {string[]} scopes - Liste des scopes requis
   * @param {number} teamId - ID de l'équipe (optionnel)
   * @returns {object} { authUrl, state }
   */
  getAuthorizationUrl(scopes = ['openid', 'profile'], teamId = null) {
    if (!this.clientId || !this.redirectUri) {
      throw new Error('OAuth non configuré. Configurez Client ID et Redirect URI.');
    }

    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // Stocker le verifier ET le teamId pour l'utiliser lors du callback
    this.pendingSessions.set(state, {
      codeVerifier,
      teamId: teamId || this.currentTeamId,
      timestamp: Date.now()
    });

    // Nettoyer les sessions expirées (> 10 minutes)
    this.cleanupExpiredSessions();

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `${this.authURL}/authorize?${params.toString()}`;

    console.log('🔐 OAuth Authorization URL generated');
    console.log('   State:', state);
    console.log('   Team ID:', teamId || this.currentTeamId);
    console.log('   Scopes:', scopes.join(', '));

    return { authUrl, state };
  }

  /**
   * Nettoie les sessions expirées
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    const expirationTime = 10 * 60 * 1000; // 10 minutes

    for (const [state, session] of this.pendingSessions.entries()) {
      if (now - session.timestamp > expirationTime) {
        this.pendingSessions.delete(state);
      }
    }
  }

  /**
   * Échange le code d'autorisation contre un access token
   * @param {string} code - Code d'autorisation reçu
   * @param {string} state - State pour vérifier la session
   * @returns {object} { access_token, refresh_token, expires_in, scope, teamId }
   */
  async exchangeCodeForToken(code, state) {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('OAuth non configuré');
    }

    // Vérifier que le state correspond à une session en attente
    const session = this.pendingSessions.get(state);
    if (!session) {
      throw new Error('State invalide ou session expirée');
    }

    const codeVerifier = session.codeVerifier;
    const teamId = session.teamId;
    this.pendingSessions.delete(state); // Nettoyer la session

    try {
      console.log('🔄 Exchanging authorization code for token...');
      console.log('   Team ID:', teamId);

      const response = await axios.post(
        `${this.authURL}/token`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData = response.data;

      console.log('✅ Access token received');
      console.log('   Expires in:', tokenData.expires_in, 'seconds');
      console.log('   Scopes:', tokenData.scope);

      // Sauvegarder les tokens dans la team config
      if (teamId) {
        const expiresAt = Date.now() + (tokenData.expires_in * 1000);
        teamConfigService.setOAuthTokens(
          teamId,
          tokenData.access_token,
          tokenData.refresh_token,
          expiresAt,
          tokenData.scope
        );
        console.log('✅ Tokens saved to team config');
      } else {
        // Fallback to global config if no teamId
        configManager.updateConfig({
          oauth: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            scope: tokenData.scope,
            tokenType: tokenData.token_type
          }
        });
      }

      return { ...tokenData, teamId };
    } catch (error) {
      console.error('❌ Token exchange failed:', error.response?.data || error.message);
      throw new Error(`Échec de l'échange de token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Rafraîchit l'access token avec le refresh token
   * @returns {object} Nouveau token data
   */
  async refreshAccessToken() {
    const config = configManager.getConfig();
    const oauth = config.oauth;

    if (!oauth || !oauth.refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('OAuth non configuré');
    }

    try {
      console.log('🔄 Refreshing access token...');

      const response = await axios.post(
        `${this.authURL}/token`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: oauth.refreshToken
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData = response.data;

      console.log('✅ Access token refreshed');
      console.log('   New expires in:', tokenData.expires_in, 'seconds');

      // Mettre à jour les tokens dans la config
      configManager.updateConfig({
        oauth: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || oauth.refreshToken, // Conserver l'ancien si pas de nouveau
          expiresAt: Date.now() + (tokenData.expires_in * 1000),
          scope: tokenData.scope,
          tokenType: tokenData.token_type
        }
      });

      return tokenData;
    } catch (error) {
      console.error('❌ Token refresh failed:', error.response?.data || error.message);
      throw new Error(`Échec du rafraîchissement: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Récupère un access token valide (rafraîchit si expiré)
   * @returns {string} Access token valide
   */
  async getValidAccessToken() {
    const config = this.getTeamConfig();

    // Check team-based OAuth tokens first
    if (this.currentTeamId && config.oauthAccessToken) {
      // Vérifier si le token est expiré (avec marge de 5 minutes)
      const expiresAt = config.oauthExpiresAt || 0;
      const isExpired = Date.now() >= (expiresAt - 5 * 60 * 1000);

      if (isExpired && config.oauthRefreshToken) {
        console.log('⚠️ Access token expiré, rafraîchissement automatique...');
        const newToken = await this.refreshAccessToken();
        return newToken.access_token;
      }

      return config.oauthAccessToken;
    }

    // Fallback to old OAuth structure
    const oauth = config.oauth;
    if (!oauth || !oauth.accessToken) {
      throw new Error('Pas de token OAuth configuré. Veuillez vous authentifier.');
    }

    // Vérifier si le token est expiré (avec marge de 5 minutes)
    const isExpired = Date.now() >= (oauth.expiresAt - 5 * 60 * 1000);

    if (isExpired) {
      console.log('⚠️ Access token expiré, rafraîchissement automatique...');
      const newToken = await this.refreshAccessToken();
      return newToken.access_token;
    }

    return oauth.accessToken;
  }

  /**
   * Vérifie si OAuth est configuré et actif
   */
  isConfigured() {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  /**
   * Vérifie si on a un access token valide
   */
  hasValidToken() {
    const config = this.getTeamConfig();

    // Check team-based OAuth tokens first
    if (this.currentTeamId && config.oauthAccessToken) {
      const expiresAt = config.oauthExpiresAt || 0;
      return expiresAt > Date.now();
    }

    // Fallback to old OAuth structure
    const oauth = config.oauth;
    return !!(oauth && oauth.accessToken && oauth.expiresAt > Date.now());
  }

  /**
   * Révoque les tokens (déconnexion)
   */
  async revokeToken() {
    const config = configManager.getConfig();
    const oauth = config.oauth;

    if (!oauth || !oauth.accessToken) {
      return;
    }

    try {
      console.log('🔒 Revoking OAuth token...');

      await axios.post(
        `${this.authURL}/token/revoke`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          token: oauth.accessToken
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('✅ Token revoked');

      // Supprimer les tokens de la config
      configManager.updateConfig({
        oauth: null
      });
    } catch (error) {
      console.error('❌ Token revocation failed:', error.response?.data || error.message);
      // Supprimer quand même les tokens localement
      configManager.updateConfig({
        oauth: null
      });
    }
  }
}

// Export singleton
export default new OAuth2Service();
