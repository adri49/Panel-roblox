import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token valide 7 jours

/**
 * Service d'authentification
 */
class AuthService {
  /**
   * Enregistre un nouvel utilisateur
   */
  async register(email, username, password) {
    const db = getDatabase();

    // Vérifier si l'email existe déjà
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      throw new Error('Cet email est déjà utilisé');
    }

    // Vérifier si le username existe déjà
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur
    const result = db.prepare(`
      INSERT INTO users (email, username, password)
      VALUES (?, ?, ?)
    `).run(email, username, hashedPassword);

    const userId = result.lastInsertRowid;

    // Créer une équipe personnelle par défaut
    const teamResult = db.prepare(`
      INSERT INTO teams (name, description, owner_id)
      VALUES (?, ?, ?)
    `).run(`Équipe de ${username}`, 'Équipe personnelle', userId);

    const teamId = teamResult.lastInsertRowid;

    // Ajouter l'utilisateur comme owner de son équipe
    db.prepare(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(teamId, userId, 'owner');

    // Créer une config vide pour l'équipe
    db.prepare(`
      INSERT INTO team_configs (team_id, universe_ids)
      VALUES (?, ?)
    `).run(teamId, '[]');

    console.log(`✅ New user registered: ${username} (ID: ${userId})`);

    return {
      id: userId,
      email,
      username,
      teamId
    };
  }

  /**
   * Connecte un utilisateur
   */
  async login(emailOrUsername, password) {
    const db = getDatabase();

    // Chercher l'utilisateur par email ou username
    const user = db.prepare(`
      SELECT id, email, username, password, is_active
      FROM users
      WHERE email = ? OR username = ?
    `).get(emailOrUsername, emailOrUsername);

    if (!user) {
      throw new Error('Email/nom d\'utilisateur ou mot de passe incorrect');
    }

    if (!user.is_active) {
      throw new Error('Ce compte est désactivé');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email/nom d\'utilisateur ou mot de passe incorrect');
    }

    // Mettre à jour last_login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Récupérer les équipes de l'utilisateur
    const teams = this.getUserTeams(user.id);

    // Générer le JWT
    const token = this.generateToken(user.id, user.username);

    console.log(`✅ User logged in: ${user.username}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      teams,
      token
    };
  }

  /**
   * Génère un JWT token
   */
  generateToken(userId, username) {
    return jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Vérifie un JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide ou expiré');
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  getUserById(userId) {
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, email, username, created_at, last_login, is_active
      FROM users
      WHERE id = ?
    `).get(userId);

    return user;
  }

  /**
   * Récupère les équipes d'un utilisateur
   */
  getUserTeams(userId) {
    const db = getDatabase();
    const teams = db.prepare(`
      SELECT
        t.id,
        t.name,
        t.description,
        t.created_at,
        tm.role,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ?
      ORDER BY tm.role DESC, t.created_at DESC
    `).all(userId);

    return teams;
  }

  /**
   * Récupère les membres d'une équipe
   */
  getTeamMembers(teamId) {
    const db = getDatabase();
    const members = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.email,
        tm.role,
        tm.joined_at
      FROM users u
      JOIN team_members tm ON u.id = tm.user_id
      WHERE tm.team_id = ?
      ORDER BY
        CASE tm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 3
          WHEN 'viewer' THEN 4
        END,
        u.username
    `).all(teamId);

    return members;
  }

  /**
   * Vérifie si un utilisateur a accès à une équipe
   */
  userHasAccessToTeam(userId, teamId, minRole = 'viewer') {
    const db = getDatabase();
    const member = db.prepare(`
      SELECT role FROM team_members
      WHERE user_id = ? AND team_id = ?
    `).get(userId, teamId);

    if (!member) return false;

    const roleHierarchy = {
      'owner': 4,
      'admin': 3,
      'member': 2,
      'viewer': 1
    };

    return roleHierarchy[member.role] >= roleHierarchy[minRole];
  }

  /**
   * Ajoute un membre à une équipe
   */
  addTeamMember(teamId, email, role = 'member', addedBy) {
    const db = getDatabase();

    // Vérifier que l'utilisateur qui ajoute est owner ou admin
    const adderMember = db.prepare(`
      SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamId, addedBy);

    if (!adderMember || !['owner', 'admin'].includes(adderMember.role)) {
      throw new Error('Vous n\'avez pas la permission d\'ajouter des membres');
    }

    // Trouver l'utilisateur par email
    const user = db.prepare('SELECT id, username FROM users WHERE email = ?').get(email);
    if (!user) {
      throw new Error('Aucun utilisateur trouvé avec cet email');
    }

    // Vérifier s'il n'est pas déjà membre
    const existing = db.prepare(`
      SELECT id FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamId, user.id);

    if (existing) {
      throw new Error('Cet utilisateur est déjà membre de l\'équipe');
    }

    // Ajouter le membre
    db.prepare(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (?, ?, ?)
    `).run(teamId, user.id, role);

    console.log(`✅ User ${user.username} added to team ${teamId} as ${role}`);

    return {
      id: user.id,
      username: user.username,
      email,
      role
    };
  }

  /**
   * Supprime un membre d'une équipe
   */
  removeTeamMember(teamId, userId, removedBy) {
    const db = getDatabase();

    // Vérifier que l'utilisateur qui supprime est owner ou admin
    const removerMember = db.prepare(`
      SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamId, removedBy);

    if (!removerMember || !['owner', 'admin'].includes(removerMember.role)) {
      throw new Error('Vous n\'avez pas la permission de retirer des membres');
    }

    // Ne pas pouvoir retirer l'owner
    const targetMember = db.prepare(`
      SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamId, userId);

    if (!targetMember) {
      throw new Error('Ce membre n\'existe pas dans l\'équipe');
    }

    if (targetMember.role === 'owner') {
      throw new Error('Impossible de retirer le propriétaire de l\'équipe');
    }

    db.prepare(`
      DELETE FROM team_members WHERE team_id = ? AND user_id = ?
    `).run(teamId, userId);

    console.log(`✅ User ${userId} removed from team ${teamId}`);
  }

  /**
   * Change le rôle d'un membre
   */
  updateMemberRole(teamId, userId, newRole, updatedBy) {
    const db = getDatabase();

    // Vérifier les permissions
    const updaterMember = db.prepare(`
      SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamId, updatedBy);

    if (!updaterMember || !['owner', 'admin'].includes(updaterMember.role)) {
      throw new Error('Vous n\'avez pas la permission de modifier les rôles');
    }

    // Ne pas modifier le rôle de l'owner
    const targetMember = db.prepare(`
      SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
    `).get(teamId, userId);

    if (!targetMember) {
      throw new Error('Ce membre n\'existe pas');
    }

    if (targetMember.role === 'owner') {
      throw new Error('Impossible de modifier le rôle du propriétaire');
    }

    db.prepare(`
      UPDATE team_members
      SET role = ?
      WHERE team_id = ? AND user_id = ?
    `).run(newRole, teamId, userId);

    console.log(`✅ User ${userId} role updated to ${newRole} in team ${teamId}`);
  }
}

export default new AuthService();
