import authService from '../services/authService.js';

/**
 * Middleware pour extraire et valider le Team ID
 * Doit être utilisé APRÈS authenticateToken
 */
export function extractTeamId(req, res, next) {
  try {
    const teamId = req.headers['x-team-id'];

    if (!teamId) {
      return res.status(400).json({
        error: 'Team ID manquant. Veuillez sélectionner une équipe.'
      });
    }

    // Valider que l'utilisateur a bien accès à cette équipe
    const userTeams = authService.getUserTeams(req.user.userId);
    const hasAccess = userTeams.some(team => team.id.toString() === teamId.toString());

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Vous n\'avez pas accès à cette équipe.'
      });
    }

    // Attacher le team ID validé à la requête
    req.teamId = parseInt(teamId);

    // Récupérer les informations de l'équipe pour les permissions
    const teamInfo = userTeams.find(team => team.id.toString() === teamId.toString());
    req.teamRole = teamInfo?.role || 'viewer';

    next();
  } catch (error) {
    console.error('Error in extractTeamId middleware:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de l\'équipe' });
  }
}

/**
 * Middleware pour vérifier les permissions de modification
 * Seuls owner et admin peuvent modifier la configuration
 */
export function requireConfigPermission(req, res, next) {
  if (!['owner', 'admin'].includes(req.teamRole)) {
    return res.status(403).json({
      error: 'Permissions insuffisantes. Seuls les propriétaires et administrateurs peuvent modifier la configuration.'
    });
  }
  next();
}

/**
 * Middleware pour vérifier les permissions de membre
 * owner, admin et member peuvent voir/modifier les données
 */
export function requireMemberPermission(req, res, next) {
  if (!['owner', 'admin', 'member'].includes(req.teamRole)) {
    return res.status(403).json({
      error: 'Permissions insuffisantes. Accès en lecture seule.'
    });
  }
  next();
}
