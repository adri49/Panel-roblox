import axios from 'axios';
import { getDatabase, initDatabase } from './src/services/database.js';
import teamConfigService from './src/services/teamConfigService.js';

// Initialiser la base de données
initDatabase();

const TEAM_ID = 1; // Team "Adri49"

async function testApiKeyAccess() {
  console.log('🧪 Test d\'accès avec API Keys aux endpoints économiques\n');

  // Récupérer la config de l'équipe
  const config = teamConfigService.getTeamConfig(TEAM_ID);

  const apiKey = config.robloxApiKey;
  const universeId = config.universeIds?.[0];

  if (!apiKey) {
    console.error('❌ Pas d\'API Key configurée');
    return;
  }

  if (!universeId) {
    console.error('❌ Pas d\'Universe ID configuré');
    return;
  }

  console.log('✅ API Key trouvée:', apiKey.substring(0, 20) + '...');
  console.log(`🎮 Universe ID de test: ${universeId}\n`);

  // Dates pour les tests (derniers 30 jours)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Liste des endpoints à tester avec API Key
  const tests = [
    {
      name: 'Economy Creator Stats (Revenue)',
      url: `https://economycreatorstats.roblox.com/v1/universes/${universeId}/stats`,
      headers: {
        'x-api-key': apiKey
      }
    },
    {
      name: 'Engagement Payouts History',
      url: `https://engagementpayouts.roblox.com/v1/universe-payout-history`,
      params: {
        universeId: universeId,
        startDate: startDate,
        endDate: endDate
      },
      headers: {
        'x-api-key': apiKey
      }
    },
    {
      name: 'Universe Details (Open Cloud)',
      url: `https://apis.roblox.com/cloud/v2/universes/${universeId}`,
      headers: {
        'x-api-key': apiKey
      }
    }
  ];

  // Tester chaque endpoint
  for (const test of tests) {
    console.log(`📡 Test: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    if (test.params) {
      console.log(`   Params:`, test.params);
    }

    try {
      const response = await axios.get(test.url, {
        headers: test.headers,
        params: test.params,
        timeout: 10000
      });

      console.log(`   ✅ Succès (${response.status})`);
      if (response.data) {
        const dataStr = JSON.stringify(response.data);
        console.log(`   📊 Données reçues:`, dataStr.substring(0, 200) + (dataStr.length > 200 ? '...' : ''));
      }
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Erreur ${error.response.status}: ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`   📄 Détails:`, error.response.data);
        }

        // Analyser les erreurs courantes
        if (error.response.status === 401) {
          console.log('   💡 API Key invalide ou expirée');
        } else if (error.response.status === 403) {
          console.log('   💡 API Key valide mais permissions insuffisantes');
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
  console.log('Si les API Keys échouent AUSSI sur economycreatorstats/engagementpayouts,');
  console.log('cela signifie que ces endpoints nécessitent un COOKIE de session (.ROBLOSECURITY)');
  console.log('et ne peuvent PAS être accédés via OAuth OU API Keys.');
  console.log('');
  console.log('Si les API Keys RÉUSSISSENT, alors:');
  console.log('- OAuth fonctionne pour: identité, universe details');
  console.log('- API Keys nécessaires pour: economycreatorstats, engagementpayouts');
  console.log('- Configuration HYBRIDE requise');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testApiKeyAccess().catch(console.error);
