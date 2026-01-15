import { getDatabase } from '../server/src/services/database.js';

const db = getDatabase();

console.log('\n=== Verification de la base de donnees ===\n');

// Vérifier les équipes
const teams = db.prepare('SELECT id, name FROM teams').all();
console.log('[TEAMS] Nombre d\'equipes:', teams.length);
teams.forEach(team => {
  console.log(`  - ID: ${team.id}, Nom: "${team.name}"`);
});

// Vérifier les utilisateurs
const users = db.prepare('SELECT id, username, email FROM users').all();
console.log('\n[USERS] Nombre d\'utilisateurs:', users.length);
users.forEach(user => {
  console.log(`  - ID: ${user.id}, Username: "${user.username}", Email: "${user.email}"`);
});

// Vérifier les team_configs
const configs = db.prepare('SELECT team_id, roblox_session_cookie FROM team_configs').all();
console.log('\n[CONFIGS] Nombre de configurations:', configs.length);
configs.forEach(config => {
  const hasCookie = !!config.roblox_session_cookie;
  console.log(`  - Team ID: ${config.team_id}, Cookie: ${hasCookie ? 'OUI' : 'NON'}`);
});

console.log('\n');
