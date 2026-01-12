#!/usr/bin/env node
import readline from 'readline';
import axios from 'axios';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Test de Clé API Roblox Open Cloud');
console.log('=====================================\n');

rl.question('Entrez votre clé API Roblox (elle restera secrète): ', async (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ Aucune clé API fournie');
    rl.close();
    return;
  }

  console.log(`\n✅ Clé API reçue (longueur: ${apiKey.length} caractères)`);
  console.log(`✅ Premiers caractères: ${apiKey.substring(0, 10)}...\n`);

  rl.question('Entrez votre Universe ID: ', async (universeId) => {
    if (!universeId || universeId.trim() === '') {
      console.log('❌ Aucun Universe ID fourni');
      rl.close();
      return;
    }

    console.log(`\n🎮 Universe ID: ${universeId}\n`);
    console.log('🧪 Lancement des tests...\n');

    const tests = [];

    // Test 1: Public Games API
    try {
      console.log('1️⃣ Test API Publique Games...');
      const response = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
      console.log('   ✅ Succès!');
      console.log('   📊 Données:', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      tests.push({ name: 'Public Games API', success: true });
    } catch (error) {
      console.log('   ❌ Échec:', error.response?.status, error.response?.statusText);
      tests.push({ name: 'Public Games API', success: false, error: error.message });
    }

    // Test 2: Open Cloud Universe API
    try {
      console.log('\n2️⃣ Test Open Cloud Universe API...');
      console.log(`   🔗 URL: https://apis.roblox.com/cloud/v2/universes/${universeId}`);
      console.log(`   🔑 Header: x-api-key: ${apiKey.substring(0, 15)}...`);

      const response = await axios.get(
        `https://apis.roblox.com/cloud/v2/universes/${universeId}`,
        {
          headers: {
            'x-api-key': apiKey.trim()
          }
        }
      );
      console.log('   ✅ Succès!');
      console.log('   📊 Données:', JSON.stringify(response.data, null, 2));
      tests.push({ name: 'Open Cloud Universe', success: true });
    } catch (error) {
      console.log('   ❌ Échec:', error.response?.status, error.response?.statusText);
      console.log('   📋 Message:', error.response?.data?.message || error.message);
      console.log('   🔍 Réponse complète:', JSON.stringify(error.response?.data, null, 2));
      tests.push({ name: 'Open Cloud Universe', success: false, error: error.message });
    }

    // Test 3: Game Passes API
    try {
      console.log('\n3️⃣ Test Game Passes API...');
      const response = await axios.get(`https://games.roblox.com/v1/games/${universeId}/game-passes?limit=10`);
      console.log('   ✅ Succès!');
      console.log('   📊 Game Passes trouvés:', response.data.data?.length || 0);
      tests.push({ name: 'Game Passes API', success: true });
    } catch (error) {
      console.log('   ❌ Échec:', error.response?.status, error.response?.statusText);
      tests.push({ name: 'Game Passes API', success: false, error: error.message });
    }

    // Test 4: Developer Products avec Open Cloud
    try {
      console.log('\n4️⃣ Test Developer Products (Open Cloud)...');
      const response = await axios.get(
        `https://apis.roblox.com/cloud/v2/universes/${universeId}/developer-products`,
        {
          headers: {
            'x-api-key': apiKey.trim()
          }
        }
      );
      console.log('   ✅ Succès!');
      console.log('   📊 Developer Products trouvés:', response.data.developerProducts?.length || 0);
      tests.push({ name: 'Developer Products', success: true });
    } catch (error) {
      console.log('   ❌ Échec:', error.response?.status, error.response?.statusText);
      console.log('   📋 Message:', error.response?.data?.message || error.message);
      tests.push({ name: 'Developer Products', success: false, error: error.message });
    }

    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(50));
    const passed = tests.filter(t => t.success).length;
    const failed = tests.filter(t => !t.success).length;
    console.log(`✅ Réussis: ${passed}`);
    console.log(`❌ Échoués: ${failed}`);
    console.log(`📝 Total: ${tests.length}`);

    if (failed > 0) {
      console.log('\n⚠️ DIAGNOSTIC:');
      if (tests.find(t => t.name === 'Open Cloud Universe' && !t.success)) {
        console.log('  • Vérifiez que votre clé API a le scope "universe:read" ou "universe.read"');
        console.log('  • Vérifiez que la clé API est bien "Active" sur Roblox');
        console.log('  • Vérifiez que la clé API a accès à cette expérience spécifique');
      }
      if (tests.find(t => t.name === 'Game Passes API' && !t.success)) {
        console.log('  • L\'Universe ID pourrait être incorrect');
        console.log('  • Le jeu n\'a peut-être aucun Game Pass');
      }
    }

    rl.close();
  });
});
