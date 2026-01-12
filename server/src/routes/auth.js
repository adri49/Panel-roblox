import express from 'express';
import authService from '../services/authService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, nom d\'utilisateur et mot de passe requis'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email invalide'
      });
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Le nom d\'utilisateur doit contenir 3-20 caractères (lettres, chiffres, _ ou -)'
      });
    }

    const user = await authService.register(email, username, password);

    res.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/nom d\'utilisateur et mot de passe requis'
      });
    }

    const result = await authService.login(emailOrUsername, password);

    res.json({
      success: true,
      message: 'Connexion réussie',
      ...result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Récupère les infos de l'utilisateur connecté
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = authService.getUserById(req.user.userId);
    const teams = authService.getUserTeams(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      teams
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auth/teams/:teamId/members
 * Récupère les membres d'une équipe
 */
router.get('/teams/:teamId/members', authenticateToken, (req, res) => {
  try {
    const { teamId } = req.params;

    // Vérifier l'accès
    const hasAccess = authService.userHasAccessToTeam(req.user.userId, teamId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé à cette équipe'
      });
    }

    const members = authService.getTeamMembers(teamId);

    res.json({
      success: true,
      members
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/teams/:teamId/members
 * Ajoute un membre à une équipe
 */
router.post('/teams/:teamId/members', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    const validRoles = ['admin', 'member', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide'
      });
    }

    const member = authService.addTeamMember(
      teamId,
      email,
      role || 'member',
      req.user.userId
    );

    res.json({
      success: true,
      message: 'Membre ajouté avec succès',
      member
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/auth/teams/:teamId/members/:userId
 * Retire un membre d'une équipe
 */
router.delete('/teams/:teamId/members/:userId', authenticateToken, (req, res) => {
  try {
    const { teamId, userId } = req.params;

    authService.removeTeamMember(teamId, parseInt(userId), req.user.userId);

    res.json({
      success: true,
      message: 'Membre retiré avec succès'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/auth/teams/:teamId/members/:userId
 * Change le rôle d'un membre
 */
router.patch('/teams/:teamId/members/:userId', authenticateToken, (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'member', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle invalide'
      });
    }

    authService.updateMemberRole(
      teamId,
      parseInt(userId),
      role,
      req.user.userId
    );

    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès'
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
