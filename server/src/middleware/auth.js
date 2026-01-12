import authService from '../services/authService.js';

/**
 * Middleware pour vérifier le JWT token
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token d\'authentification manquant'
    });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded; // { userId, username }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
}

/**
 * Middleware pour vérifier l'accès à une équipe
 * Attend teamId dans req.params ou req.body
 */
export function requireTeamAccess(minRole = 'viewer') {
  return (req, res, next) => {
    const teamId = req.params.teamId || req.body.teamId || req.query.teamId;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'Team ID manquant'
      });
    }

    const hasAccess = authService.userHasAccessToTeam(req.user.userId, teamId, minRole);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas accès à cette équipe'
      });
    }

    req.teamId = teamId;
    next();
  };
}

/**
 * Middleware optionnel : si token présent, l'ajoute à req.user, sinon continue
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Token invalide mais on continue quand même
    }
  }

  next();
}
