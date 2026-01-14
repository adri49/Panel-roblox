import { getDatabase } from './src/services/database.js';
import teamConfigService from './src/services/teamConfigService.js';

// Script de diagnostic pour vérifier le cookie
console.log('=== Diagnostic Cookie ===\n');

const db = getDatabase();

// 1. Vérifier la structure de la table
console.log('1. Structure de la table team_configs:');
const tableInfo = db.prepare(`PRAGMA table_info(team_configs)`).all();
const hasCookieColumn = tableInfo.find(col => col.name === 'roblox_session_cookie');
console.log(`   - Colonne roblox_session_cookie: ${hasCookieColumn ? '✅ Existe' : '❌ N\'existe pas'}`);

// 2. Vérifier toutes les équipes
console.log('\n2. Équipes et leurs cookies:');
const teams = db.prepare(`
  SELECT t.id, t.name, tc.roblox_session_cookie
  FROM teams t
  LEFT JOIN team_configs tc ON t.id = tc.team_id
`).all();

teams.forEach(team => {
  const hasCookie = !!team.roblox_session_cookie;
  console.log(`   - Équipe "${team.name}" (ID: ${team.id}): ${hasCookie ? '✅ Cookie configuré' : '❌ Pas de cookie'}`);
  if (hasCookie) {
    const cookieLength = team.roblox_session_cookie.length;
    console.log(`     Longueur du cookie chiffré: ${cookieLength} caractères`);
  }
});

// 3. Vérifier les webhooks
console.log('\n3. Webhooks configurés:');
teams.forEach(team => {
  const webhooks = teamConfigService.getWebhooks(team.id);
  const hasDiscord = !!webhooks.discordWebhookUrl;
  const hasSlack = !!webhooks.slackWebhookUrl;
  const hasEmail = !!webhooks.notificationEmail;

  console.log(`   - Équipe "${team.name}": Discord ${hasDiscord ? '✅' : '❌'}, Slack ${hasSlack ? '✅' : '❌'}, Email ${hasEmail ? '✅' : '❌'}`);
});

console.log('\n=== Fin du diagnostic ===');
