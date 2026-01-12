import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'panel.db');
const db = new Database(dbPath);

console.log('📊 État de la base de données\n');

// Lister tous les utilisateurs
console.log('👥 UTILISATEURS:');
const users = db.prepare('SELECT id, username, email, created_at FROM users').all();
users.forEach(user => {
  console.log(`  - [${user.id}] ${user.username} (${user.email})`);
});

console.log('\n🏢 ÉQUIPES:');
const teams = db.prepare('SELECT id, name, owner_id FROM teams').all();
teams.forEach(team => {
  const owner = users.find(u => u.id === team.owner_id);
  console.log(`  - [${team.id}] ${team.name} (propriétaire: ${owner?.username})`);
});

console.log('\n⚙️  CONFIGURATIONS PAR ÉQUIPE:');
const configs = db.prepare(`
  SELECT
    tc.*,
    t.name as team_name
  FROM team_configs tc
  JOIN teams t ON tc.team_id = t.id
`).all();

configs.forEach(config => {
  console.log(`\n  📦 Équipe: ${config.team_name} (ID: ${config.team_id})`);
  console.log(`     Universe IDs: ${config.universe_ids || '[]'}`);
  console.log(`     Roblox API Key: ${config.roblox_api_key ? '✅ Configurée (' + config.roblox_api_key.substring(0, 20) + '...)' : '❌ Non configurée'}`);
  console.log(`     Roblox User API Key: ${config.roblox_user_api_key ? '✅ Configurée' : '❌ Non configurée'}`);
  console.log(`     Group ID: ${config.group_id || 'Non défini'}`);
  console.log(`     Cache TTL: ${config.cache_ttl || 300}s`);
  console.log(`     OAuth Client ID: ${config.oauth_client_id || 'Non configuré'}`);
  console.log(`     OAuth Client Secret: ${config.oauth_client_secret ? '✅ Configuré' : '❌ Non configuré'}`);
  console.log(`     OAuth Redirect URI: ${config.oauth_redirect_uri || 'Non configuré'}`);
  console.log(`     OAuth Access Token: ${config.oauth_access_token ? '✅ Présent (expire: ' + new Date(config.oauth_expires_at).toLocaleString() + ')' : '❌ Absent'}`);
  console.log(`     Dernière mise à jour: ${config.last_updated || 'Jamais'}`);
});

console.log('\n');
db.close();
