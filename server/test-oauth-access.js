import axios from 'axios';
import { getDatabase, initDatabase } from './src/services/database.js';
import teamConfigService from './src/services/teamConfigService.js';

// Initialiser la base de données
initDatabase();

const TEAM_ID = 1; // Team "Adri49"

async function testOAuthAccess() {
  console.log('🧪 Test d\'accès OAuth aux APIs Roblox\n');

  // Récupérer la config de l'équipe
  const config = teamConfigService.getTeamConfig(TEAM_ID);

  if (!config.oauthAccessToken) {
    console.error('❌ Pas de token OAuth trouvé pour cette équipe');
    console.log('   Connectez-vous d\'abord via OAuth dans l\'interface');
    return;
  }

  console.log('✅ Token OAuth trouvé');
  console.log(`   Expire le: ${new Date(config.oauthExpiresAt).toLocaleString()}`);
  console.log(`   Scopes: ${config.oauthScope}\n`);

  const universeId = config.universeIds?.[0];
  if (!universeId) {
    console.error('❌ Pas d\'Universe ID configuré');
    return;
  }

  console.log(`🎮 Universe ID de test: ${universeId}\n`);

  // Liste des endpoints à tester
  const tests = [
    {
      name: 'User Info (OpenID)',
      url: 'https://apis.roblox.com/oauth/v1/userinfo',
      headers: {
        'Authorization': `Bearer ${config.oauthAccessToken}`
      }
    },
    {
      name: 'Universe Details',
      url: `https://apis.roblox.com/cloud/v2/universes/${universeId}`,
      headers: {
        'Authorization': `Bearer ${config.oauthAccessToken}`
      }
    },
    {
      name: 'Universe Statistics (Player Count)',
      url: `https://apis.roblox.com/cloud/v2/universes/${universeId}/stats`,
      headers: {
        'Authorization': `Bearer ${config.oauthAccessToken}`
      }
    },
    {
      name: 'Economy Stats (Revenue)',
      url: `https://economy.roblox.com/v2/users/${universeId}/transactions`,
      headers: {
        'Authorization': `Bearer ${config.oauthAccessToken}`
      }
    },
    {
      name: 'Developer Stats',
      url: `https://develop.roblox.com/v2/universes/${universeId}/places`,
      headers: {
        'Authorization': `Bearer ${config.oauthAccessToken}`
      }
    }
  ];

  // Tester chaque endpoint
  for (const test of tests) {
    console.log(`📡 Test: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    try {
      const response = await axios.get(test.url, {
        headers: test.headers,
        timeout: 10000
      });

      console.log(`   ✅ Succès (${response.status})`);
      if (response.data) {
        console.log(`   📊 Données reçues:`, JSON.stringify(response.data).substring(0, 200) + '...');
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Erreur ${error.response.status}: ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`   📄 Détails:`, error.response.data);
        }

        // Analyser les erreurs courantes
        if (error.response.status === 401) {
          console.log('   💡 Token invalide ou expiré');
        } else if (error.response.status === 403) {
          console.log('   💡 Token valide mais scope insuffisant pour cet endpoint');
        } else if (error.response.status === 404) {
          console.log('   💡 Endpoint ou ressource introuvable');
        }
      } else {
        console.log(`   ❌ Erreur réseau:`, error.message);
      }
    }

    console.log('');
  }

  // Conclusion
  console.log('\n📋 CONCLUSION:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Si vous voyez des 403 sur les endpoints de statistiques,');
  console.log('cela confirme que les scopes OAuth actuels ne donnent pas');
  console.log('accès aux statistiques d\'univers et aux revenus.');
  console.log('');
  console.log('Dans ce cas, vous devrez CONTINUER à utiliser les API Keys');
  console.log('pour les statistiques, et OAuth uniquement pour l\'identité.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testOAuthAccess().catch(console.error);
