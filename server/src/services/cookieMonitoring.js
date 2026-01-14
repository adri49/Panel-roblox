import teamConfigService from './teamConfigService.js';
import robloxApi from './robloxApi.js';
import axios from 'axios';

/**
 * Service de monitoring des cookies de session Roblox
 * Détecte automatiquement les cookies expirés et notifie les admins
 */
class CookieMonitoringService {
  constructor() {
    this.checkInterval = 60 * 60 * 1000; // Vérifier toutes les heures
    this.isRunning = false;
    this.monitoringTimer = null;

    // Tracking des erreurs pour éviter le spam
    this.lastNotificationTime = {};
    this.minNotificationInterval = 24 * 60 * 60 * 1000; // 1 notification max par 24h
  }

  /**
   * Démarre le monitoring automatique
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Cookie monitoring already running');
      return;
    }

    console.log('🔍 Starting cookie monitoring service...');
    console.log(`   ⏱️  Check interval: ${this.checkInterval / 1000 / 60} minutes`);

    this.isRunning = true;

    // Première vérification immédiate
    this.checkAllCookies();

    // Puis vérifications périodiques
    this.monitoringTimer = setInterval(() => {
      this.checkAllCookies();
    }, this.checkInterval);
  }

  /**
   * Arrête le monitoring
   */
  stop() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    this.isRunning = false;
    console.log('🛑 Cookie monitoring service stopped');
  }

  /**
   * Vérifie tous les cookies configurés
   */
  async checkAllCookies() {
    const { getDatabase } = await import('./database.js');
    const db = getDatabase();

    try {
      // Récupérer toutes les équipes avec un cookie configuré
      const teams = db.prepare(`
        SELECT tc.team_id, tc.roblox_session_cookie, t.name as team_name
        FROM team_configs tc
        JOIN teams t ON tc.team_id = t.id
        WHERE tc.roblox_session_cookie IS NOT NULL
      `).all();

      if (teams.length === 0) {
        console.log('ℹ️  No teams with session cookies configured');
        return;
      }

      console.log(`🔍 Checking ${teams.length} team cookie(s)...`);

      for (const team of teams) {
        await this.checkTeamCookie(team.team_id, team.team_name);
      }
    } catch (error) {
      console.error('❌ Error checking cookies:', error.message);
    }
  }

  /**
   * Vérifie le cookie d'une équipe spécifique
   */
  async checkTeamCookie(teamId, teamName) {
    try {
      const sessionCookie = teamConfigService.getSessionCookie(teamId);

      if (!sessionCookie) {
        console.log(`⚠️  Team ${teamName}: No cookie found`);
        return;
      }

      // Test simple : vérifier si le cookie est valide
      // On teste sur l'API userinfo qui est rapide et simple
      const response = await axios.get('https://users.roblox.com/v1/users/authenticated', {
        headers: {
          'Cookie': `.ROBLOSECURITY=${sessionCookie}`
        },
        timeout: 10000
      });

      if (response.status === 200 && response.data.id) {
        console.log(`✅ Team ${teamName}: Cookie is valid (User ID: ${response.data.id})`);
        return true;
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;

        if (status === 401 || status === 403) {
          console.log(`❌ Team ${teamName}: Cookie is INVALID or EXPIRED`);

          // Envoyer une notification
          await this.notifyCookieExpired(teamId, teamName);
          return false;
        }
      }

      console.log(`⚠️  Team ${teamName}: Error checking cookie (${error.message})`);
    }

    return null; // État inconnu
  }

  /**
   * Notifie qu'un cookie est expiré
   */
  async notifyCookieExpired(teamId, teamName) {
    // Vérifier si on a déjà notifié récemment (éviter le spam)
    const now = Date.now();
    const lastNotification = this.lastNotificationTime[teamId] || 0;

    if (now - lastNotification < this.minNotificationInterval) {
      console.log(`ℹ️  Team ${teamName}: Notification already sent recently (< 24h)`);
      return;
    }

    this.lastNotificationTime[teamId] = now;

    // Récupérer les webhooks configurés pour cette équipe
    const webhooks = teamConfigService.getWebhooks(teamId);

    if (!webhooks.discordWebhookUrl && !webhooks.slackWebhookUrl && !webhooks.notificationEmail) {
      console.log(`⚠️  Team ${teamName}: Aucun webhook configuré, notification ignorée`);
      return;
    }

    const message = `
🔔 **Cookie Roblox Expiré**

⚠️  Le cookie de session pour l'équipe **${teamName}** (ID: ${teamId}) est **expiré ou invalide**.

📊 Les statistiques économiques (economycreatorstats, engagementpayouts) ne peuvent plus être récupérées.

✅ **Action Requise** :
1. Connectez-vous au compte Roblox dédié
2. Récupérez le nouveau cookie .ROBLOSECURITY
3. Mettez-le à jour dans le panel : Configuration → Cookie de Session

⏱️  Temps estimé : 2 minutes
    `.trim();

    console.log('\n' + message + '\n');

    // Envoyer aux différents canaux configurés pour cette équipe
    await Promise.all([
      this.sendDiscordNotification(webhooks.discordWebhookUrl, message),
      this.sendSlackNotification(webhooks.slackWebhookUrl, message),
      this.sendEmailNotification(webhooks.notificationEmail, teamName, message)
    ]);
  }

  /**
   * Envoie une notification Discord
   */
  async sendDiscordNotification(webhookUrl, message) {
    if (!webhookUrl) {
      return;
    }

    try {
      await axios.post(webhookUrl, {
        content: message,
        username: 'Roblox Stats Monitor',
        avatar_url: 'https://tr.rbxcdn.com/38c6edcb50633730ff4cf39ac8859840/150/150/Image/Png'
      });
      console.log('✅ Discord notification sent');
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error.message);
    }
  }

  /**
   * Envoie une notification Slack
   */
  async sendSlackNotification(webhookUrl, message) {
    if (!webhookUrl) {
      return;
    }

    try {
      await axios.post(webhookUrl, {
        text: message,
        username: 'Roblox Stats Monitor'
      });
      console.log('✅ Slack notification sent');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
    }
  }

  /**
   * Envoie une notification par email
   */
  async sendEmailNotification(emailAddress, teamName, message) {
    if (!emailAddress) {
      return;
    }

    // TODO: Implémenter l'envoi d'email (nodemailer, SendGrid, etc.)
    console.log(`📧 Email notification would be sent to: ${emailAddress}`);
  }

  /**
   * Vérifie manuellement un cookie spécifique
   */
  async manualCheck(teamId) {
    const { getDatabase } = await import('./database.js');
    const db = getDatabase();

    const team = db.prepare(`
      SELECT t.name FROM teams t WHERE t.id = ?
    `).get(teamId);

    if (!team) {
      throw new Error('Team not found');
    }

    const isValid = await this.checkTeamCookie(teamId, team.name);

    return {
      teamId,
      teamName: team.name,
      isValid,
      checkedAt: new Date().toISOString()
    };
  }
}

export default new CookieMonitoringService();
