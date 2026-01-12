import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../data/panel.db');

// Créer le dossier data s'il n'existe pas
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connexion à la base de données
const db = new Database(DB_PATH);

// Activer les foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialise le schéma de la base de données
 */
export function initDatabase() {
  console.log('📊 Initializing database...');

  // Table Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // Table Teams
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table Team Members (relation many-to-many entre users et teams)
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(team_id, user_id)
    )
  `);

  // Table Team Configs (une config OAuth par équipe)
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER UNIQUE NOT NULL,
      roblox_api_key TEXT,
      roblox_user_api_key TEXT,
      universe_ids TEXT, -- JSON array
      group_id TEXT,
      cache_ttl INTEGER DEFAULT 300,
      oauth_client_id TEXT,
      oauth_client_secret TEXT,
      oauth_redirect_uri TEXT,
      oauth_access_token TEXT,
      oauth_refresh_token TEXT,
      oauth_expires_at INTEGER,
      oauth_scope TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    )
  `);

  // Indexes pour performances
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id)`);

  console.log('✅ Database initialized successfully');
  console.log(`📁 Database location: ${DB_PATH}`);
}

/**
 * Obtient la connexion à la base de données
 */
export function getDatabase() {
  return db;
}

/**
 * Ferme la connexion à la base de données
 */
export function closeDatabase() {
  db.close();
  console.log('🔒 Database connection closed');
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase
};
