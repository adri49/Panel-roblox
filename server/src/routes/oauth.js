import express from 'express';
import oauth2Service from '../services/oauth2Service.js';
import configManager from '../services/configManager.js';

const router = express.Router();

/**
 * GET /api/oauth/config
 * Récupère la configuration OAuth (sans secrets)
 */
router.get('/config', (req, res) => {
  try {
    const oauthConfig = configManager.getOAuthConfig();
    const hasTokens = configManager.hasOAuthTokens();
    const tokens = configManager.getOAuthTokens();

    res.json({
      success: true,
      config: {
        clientId: oauthConfig.clientId,
        redirectUri: oauthConfig.redirectUri,
        hasClientSecret: !!oauthConfig.clientSecret,
        isConfigured: oauth2Service.isConfigured(),
        hasTokens: hasTokens,
        tokenExpiry: tokens?.expiresAt || null,
        scopes: tokens?.scope || null
      }
    });
  } catch (error) {
    console.error('Error fetching OAuth config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/oauth/config
 * Configure les credentials OAuth
 */
router.post('/config', (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        success: false,
        error: 'Client ID, Client Secret et Redirect URI sont requis'
      });
    }

    // Valider l'URL de redirection
    try {
      new URL(redirectUri);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Redirect URI invalide'
      });
    }

    // Sauvegarder la configuration
    configManager.setOAuthConfig(clientId, clientSecret, redirectUri);

    // Configurer le service OAuth
    oauth2Service.configure(clientId, clientSecret, redirectUri);

    res.json({
      success: true,
      message: 'Configuration OAuth sauvegardée'
    });
  } catch (error) {
    console.error('Error saving OAuth config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/oauth/authorize
 * Démarre le flow OAuth - génère l'URL d'autorisation
 */
router.post('/authorize', (req, res) => {
  try {
    const { scopes } = req.body;

    // Scopes par défaut pour accéder aux APIs de revenus
    const defaultScopes = [
      'openid',
      'profile',
      'universe-messaging-service:publish',
      'user.read'
    ];

    const requestedScopes = scopes || defaultScopes;

    const { authUrl, state } = oauth2Service.getAuthorizationUrl(requestedScopes);

    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/oauth/callback
 * Callback OAuth - reçoit le code d'autorisation
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Vérifier les erreurs de Roblox
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(`/settings?oauth_error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
      return res.redirect('/settings?oauth_error=Code ou state manquant');
    }

    // Échanger le code contre un token
    const tokenData = await oauth2Service.exchangeCodeForToken(code, state);

    // Rediriger vers le panel avec succès
    res.redirect('/settings?oauth_success=true');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`/settings?oauth_error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * POST /api/oauth/refresh
 * Rafraîchit manuellement l'access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const tokenData = await oauth2Service.refreshAccessToken();

    res.json({
      success: true,
      message: 'Token rafraîchi',
      expiresIn: tokenData.expires_in
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/oauth/revoke
 * Révoque les tokens OAuth (déconnexion)
 */
router.post('/revoke', async (req, res) => {
  try {
    await oauth2Service.revokeToken();

    res.json({
      success: true,
      message: 'Déconnecté avec succès'
    });
  } catch (error) {
    console.error('Error revoking token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/oauth/status
 * Vérifie le statut de l'authentification OAuth
 */
router.get('/status', (req, res) => {
  try {
    const isConfigured = oauth2Service.isConfigured();
    const hasValidToken = oauth2Service.hasValidToken();
    const tokens = configManager.getOAuthTokens();

    res.json({
      success: true,
      status: {
        isConfigured,
        hasValidToken,
        expiresAt: tokens?.expiresAt || null,
        scope: tokens?.scope || null,
        isExpired: tokens?.expiresAt ? Date.now() >= tokens.expiresAt : true
      }
    });
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
