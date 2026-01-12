import { getDatabase } from './database.js';

/**
 * Service de gestion des configurations par équipe
 */
class TeamConfigService {
  /**
   * Récupère la configuration d'une équipe
   */
  getTeamConfig(teamId) {
    const db = getDatabase();
    const config = db.prepare(`
      SELECT * FROM team_configs WHERE team_id = ?
    `).get(teamId);

    if (!config) {
      // Créer une config par défaut
      db.prepare(`
        INSERT INTO team_configs (team_id, universe_ids)
        VALUES (?, ?)
      `).run(teamId, '[]');

      return this.getTeamConfig(teamId);
    }

    // Convertir snake_case vers camelCase et parser JSON
    return {
      id: config.id,
      teamId: config.team_id,
      robloxApiKey: config.roblox_api_key,
      robloxUserApiKey: config.roblox_user_api_key,
      groupId: config.group_id,
      cacheTTL: config.cache_ttl,
      universeIds: JSON.parse(config.universe_ids || '[]'),
      oauthClientId: config.oauth_client_id,
      oauthClientSecret: config.oauth_client_secret,
      oauthRedirectUri: config.oauth_redirect_uri,
      oauthAccessToken: config.oauth_access_token,
      oauthRefreshToken: config.oauth_refresh_token,
      oauthExpiresAt: config.oauth_expires_at,
      oauthScope: config.oauth_scope,
      lastUpdated: config.last_updated
    };
  }

  /**
   * Met à jour la configuration d'une équipe
   */
  updateTeamConfig(teamId, updates) {
    const db = getDatabase();

    const allowedFields = [
      'roblox_api_key',
      'roblox_user_api_key',
      'group_id',
      'cache_ttl',
      'oauth_client_id',
      'oauth_client_secret',
      'oauth_redirect_uri'
    ];

    const setClauses = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      }
    }

    // Handle universeIds separately (JSON)
    if (updates.universeIds) {
      setClauses.push('universe_ids = ?');
      values.push(JSON.stringify(updates.universeIds));
    }

    if (setClauses.length === 0) {
      return this.getTeamConfig(teamId);
    }

    setClauses.push('last_updated = CURRENT_TIMESTAMP');
    values.push(teamId);

    const query = `
      UPDATE team_configs
      SET ${setClauses.join(', ')}
      WHERE team_id = ?
    `;

    db.prepare(query).run(...values);

    console.log(`✅ Team ${teamId} config updated`);

    return this.getTeamConfig(teamId);
  }

  /**
   * Ajoute un Universe ID à la liste d'une équipe
   */
  addUniverseId(teamId, universeId) {
    const config = this.getTeamConfig(teamId);
    const universeIds = config.universeIds;

    if (universeIds.includes(universeId)) {
      throw new Error('Cet Universe ID est déjà ajouté');
    }

    universeIds.push(universeId);

    return this.updateTeamConfig(teamId, { universeIds });
  }

  /**
   * Supprime un Universe ID de la liste d'une équipe
   */
  removeUniverseId(teamId, universeId) {
    const config = this.getTeamConfig(teamId);
    const universeIds = config.universeIds.filter(id => id !== universeId);

    return this.updateTeamConfig(teamId, { universeIds });
  }

  /**
   * Met à jour les tokens OAuth d'une équipe
   */
  setOAuthTokens(teamId, accessToken, refreshToken, expiresAt, scope) {
    const db = getDatabase();

    db.prepare(`
      UPDATE team_configs
      SET
        oauth_access_token = ?,
        oauth_refresh_token = ?,
        oauth_expires_at = ?,
        oauth_scope = ?,
        last_updated = CURRENT_TIMESTAMP
      WHERE team_id = ?
    `).run(accessToken, refreshToken, expiresAt, scope, teamId);

    console.log(`✅ Team ${teamId} OAuth tokens updated`);
  }

  /**
   * Efface les tokens OAuth d'une équipe
   */
  clearOAuthTokens(teamId) {
    const db = getDatabase();

    db.prepare(`
      UPDATE team_configs
      SET
        oauth_access_token = NULL,
        oauth_refresh_token = NULL,
        oauth_expires_at = NULL,
        oauth_scope = NULL,
        last_updated = CURRENT_TIMESTAMP
      WHERE team_id = ?
    `).run(teamId);

    console.log(`✅ Team ${teamId} OAuth tokens cleared`);
  }

  /**
   * Vérifie si une équipe a des tokens OAuth valides
   */
  hasValidOAuthTokens(teamId) {
    const config = this.getTeamConfig(teamId);

    if (!config.oauth_access_token || !config.oauth_expires_at) {
      return false;
    }

    // Vérifier si le token n'est pas expiré (avec marge de 5 min)
    const now = Date.now();
    const expiresAt = config.oauth_expires_at;

    return now < (expiresAt - 5 * 60 * 1000);
  }

  /**
   * Récupère le token OAuth d'une équipe
   */
  getOAuthAccessToken(teamId) {
    const config = this.getTeamConfig(teamId);
    return config.oauth_access_token;
  }

  /**
   * Récupère le refresh token OAuth d'une équipe
   */
  getOAuthRefreshToken(teamId) {
    const config = this.getTeamConfig(teamId);
    return config.oauth_refresh_token;
  }
}

export default new TeamConfigService();
