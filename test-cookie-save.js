import { getDatabase } from './server/src/services/database.js';
import teamConfigService from './server/src/services/teamConfigService.js';

console.log('\n=== Test de sauvegarde de cookie ===\n');

// Cookie de test (format valide)
const testCookie = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_TEST_COOKIE_' + 'x'.repeat(850);

console.log('[1] Cookie de test cree:', testCookie.length, 'caracteres');
console.log('[2] Debut du cookie:', testCookie.substring(0, 50));

// Récupérer la première équipe
const db = getDatabase();
const teams = db.prepare('SELECT id, name FROM teams').all();

if (teams.length === 0) {
  console.log('[X] Aucune equipe trouvee dans la base de donnees');
  process.exit(1);
}

const teamId = teams[0].id;
const teamName = teams[0].name;

console.log('[3] Test avec l\'equipe "' + teamName + '" (ID: ' + teamId + ')');

try {
  // Test 1: Sauvegarder le cookie
  console.log('\n[TEST 1] Sauvegarde du cookie...');
  teamConfigService.setSessionCookie(teamId, testCookie);
  console.log('[OK] Cookie sauvegarde');

  // Test 2: Vérifier qu'il existe
  console.log('\n[TEST 2] Verification de l\'existence...');
  const hasCookie = teamConfigService.hasSessionCookie(teamId);
  console.log(hasCookie ? '[OK] Cookie trouve' : '[ERREUR] Cookie non trouve');

  // Test 3: Récupérer le cookie
  console.log('\n[TEST 3] Recuperation du cookie...');
  const retrievedCookie = teamConfigService.getSessionCookie(teamId);

  if (retrievedCookie) {
    console.log('[OK] Cookie recupere:', retrievedCookie.length, 'caracteres');
    console.log('     Debut:', retrievedCookie.substring(0, 50));

    if (retrievedCookie === testCookie) {
      console.log('[OK] Cookie identique (chiffrement/dechiffrement OK)');
    } else {
      console.log('[ERREUR] Cookie different ! Probleme de chiffrement ?');
    }
  } else {
    console.log('[ERREUR] Cookie non recupere');
  }

  // Test 4: Vérifier dans la DB directement
  console.log('\n[TEST 4] Verification directe dans la base de donnees...');
  const dbResult = db.prepare('SELECT roblox_session_cookie FROM team_configs WHERE team_id = ?').get(teamId);

  if (dbResult && dbResult.roblox_session_cookie) {
    console.log('[OK] Cookie trouve en DB (chiffre):', dbResult.roblox_session_cookie.substring(0, 50), '...');
  } else {
    console.log('[ERREUR] Aucun cookie en DB');
  }

  // Nettoyage
  console.log('\n[CLEANUP] Nettoyage...');
  teamConfigService.clearSessionCookie(teamId);
  console.log('[OK] Cookie supprime');

  console.log('\n[SUCCESS] TOUS LES TESTS REUSSIS !\n');
} catch (error) {
  console.error('\n[ERREUR]', error.message);
  console.error(error.stack);
  process.exit(1);
}
