# 🔐 Guide des Scopes OAuth 2.0 pour Roblox

## ✅ DÉCOUVERTE IMPORTANTE - MISE À JOUR

D'après vos screenshots et la documentation Roblox, voici la **situation confirmée** :

### ✅ OAuth 2.0 Peut Accéder aux Statistiques !
- OAuth 2.0 **peut** accéder aux Open Cloud APIs ✅
- Votre documentation Roblox le confirme ✅
- Vous avez été validé par Roblox pour OAuth ✅
- **Les scopes "legacy-universe:manage"** donnent accès aux statistiques économiques ✅

### 🔑 Scopes Critiques
- **`legacy-universe:manage`** → Donne accès à :
  - `economycreatorstats.roblox.com` (statistiques de revenus)
  - `engagementpayouts.roblox.com` (historique des payouts)
  - Gestion des expériences et informations associées

### 📋 Ce qui a Changé
- **AVANT** : Je pensais que les scopes pour les stats n'existaient pas
- **MAINTENANT** : Les scopes **"legacy-*"** donnent accès aux APIs économiques
- **RÉSULTAT** : OAuth **PEUT** remplacer les API Keys (si les tests réussissent)

## 📊 Scopes Activés (Mis à Jour)

Vous avez activé tous les scopes "read" disponibles, **incluant les scopes "legacy"** qui donnent accès aux statistiques économiques :

```javascript
const availableScopes = [
  // Identité (obligatoire)
  'openid',                    // ✅ SSO
  'profile',                   // ✅ Profil utilisateur de base

  // Scopes "read" standards
  'asset:read',                // ✅ Lire les assets
  'group:read',                // ✅ Lire les groupes
  'user.inventory-item:read',  // ✅ Lire l'inventaire utilisateur
  'commerce-item:read',        // ✅ Lire articles commerciaux
  'creator-store-product:read', // ✅ Produits Creator Store
  'universe.subscription-product.subscription:read', // ✅ Abonnements
  'universe.user-restriction:read',            // ✅ Restrictions utilisateur
  'user.advanced:read',        // ✅ Prime et statut vérifié
  'user.social:read',          // ✅ Comptes sociaux liés
  'user.commerce-merchant-connection:read',    // ✅ Connexions marchandes
  'avatar-auto-setup-job:read',                // ✅ Jobs d'auto-setup avatar

  // 🎯 Scopes "legacy" CRITIQUES pour économie et statistiques
  'legacy-universe:manage',                    // ✅ Gestion expériences + STATS ÉCONOMIQUES (NOTER LE : et non .)
  'legacy-universe.following:read',            // ✅ Suivis d'expériences
];
```

### ✅ Accès aux APIs Économiques

Les scopes **"legacy-universe:manage"** et autres scopes legacy donnent accès à :
- ✅ `economycreatorstats.roblox.com/v1/universes/{id}/stats` - Statistiques de revenus
- ✅ `engagementpayouts.roblox.com/v1/universe-payout-history` - Historique des payouts d'engagement

## 🧪 Test de l'Implémentation Actuelle

### Option 1 : Script de Test Automatique

Exécutez le script de test pour voir ce que votre token OAuth peut faire :

```bash
cd /home/user/Panel-roblox/server
node test-oauth-access.js
```

Ce script va tester :
1. ✅ User Info (OpenID) - devrait fonctionner
2. ❓ Universe Details - à vérifier
3. ❓ Universe Statistics - probablement 403
4. ❓ Economy Stats (Revenue) - probablement 403
5. ❓ Developer Stats - à vérifier

### Option 2 : Test Manuel via l'Interface

1. **Reconnectez OAuth** avec les nouveaux scopes :
   ```bash
   # Démarrer le serveur
   cd /home/user/Panel-roblox
   npm run dev
   ```

2. **Dans l'interface web** :
   - Allez dans Configuration → OAuth
   - Cliquez sur "Autoriser avec Roblox"
   - Acceptez les permissions
   - Retournez au Dashboard

3. **Vérifiez les logs serveur** :
   - Vous devriez voir : `🔐 Using OAuth 2.0 token for authentication`
   - OU : `🔑 Using API Key for authentication`

4. **Testez les statistiques** :
   - Allez dans l'onglet Statistiques
   - Regardez les logs serveur pour voir quel méthode d'auth est utilisée

## 📋 Résultats Attendus

### Scénario A : OAuth Fonctionne pour les Stats ✅
```
🔍 Fetching economycreatorstats API for universe 8832949120...
  🔐 Trying with OAuth 2.0...
  ✅ Success with OAuth 2.0!
  📊 Data: {...revenue data...}
```

**Si vous voyez ça** → OAuth peut remplacer les API Keys ! 🎉

### Scénario B : OAuth Échoue pour les Stats ❌
```
🔍 Fetching economycreatorstats API for universe 8832949120...
  🔐 Trying with OAuth 2.0...
  ❌ OAuth 2.0 failed: 403 Forbidden
  📋 Details: {"error": "insufficient_scope"}
  🔑 Trying with API Key...
  ✅ Success with API Key!
```

**Si vous voyez ça** → Vous devez garder les API Keys pour les stats

## 🔧 Code Actuel - Comment ça Fonctionne

Le système est déjà configuré pour **essayer OAuth en priorité** :

### Dans `robloxApi.js` :

```javascript
async getAuthHeaders() {
  // 1. Essayer OAuth en priorité
  if (oauth2Service.hasValidToken()) {
    const accessToken = await oauth2Service.getValidAccessToken();
    return { 'Authorization': `Bearer ${accessToken}` };
  }

  // 2. Fallback sur API Key
  const apiKey = this.getApiKey();
  if (apiKey) {
    return { 'x-api-key': apiKey };
  }

  throw new Error('Aucune méthode d\'authentification disponible');
}
```

### Dans `getUniverseEconomyStats()` et `getEngagementPayouts()` :

```javascript
// Méthode 1: Essayer OAuth 2.0 en priorité
try {
  if (oauth2Service.hasValidToken()) {
    const headers = await this.getAuthHeaders();
    console.log('  🔐 Trying with OAuth 2.0...');
    const response = await axios.get(url, { headers });
    console.log('  ✅ Success with OAuth 2.0!');
    return response.data;
  }
} catch (error) {
  console.log(`  ❌ OAuth 2.0 failed: ${error.response?.status}`);
}

// Méthode 2: Fallback sur API Keys
// ...
```

## 🎯 Recommandations

### Si OAuth Fonctionne pour les Stats
1. Vous pouvez **retirer** les API Keys de la config
2. OAuth devient la **seule méthode** d'authentification
3. Plus simple pour les utilisateurs (1 seule connexion)

### Si OAuth NE Fonctionne PAS pour les Stats
1. **Gardez** les API Keys pour les statistiques et revenus
2. **Utilisez** OAuth uniquement pour l'identité utilisateur
3. **Configuration hybride** :
   - OAuth → Identité (openid, profile)
   - API Keys → Statistiques, revenus, analytics

## 📚 Endpoints et Leurs Scopes Requis (Mis à Jour)

| Endpoint | OAuth Scope Requis | Status |
|----------|-------------------|--------|
| `/oauth/v1/userinfo` | `openid`, `profile` | ✅ CONFIRMÉ |
| `/cloud/v2/universes/{id}` | `legacy-universe:manage` | ✅ DEVRAIT FONCTIONNER |
| `economycreatorstats.roblox.com/v1/universes/{id}/stats` | `legacy-universe:manage` | ✅ DEVRAIT FONCTIONNER |
| `engagementpayouts.roblox.com/v1/universe-payout-history` | `legacy-universe:manage` | ✅ DEVRAIT FONCTIONNER |
| `/cloud/v2/universes/{id}/developer-products` | `legacy-universe:manage` | ✅ DEVRAIT FONCTIONNER |
| `games.roblox.com/v1/games` | Public (pas de scope requis) | ✅ CONFIRMÉ |

## 🚀 Prochaines Étapes

1. **Exécutez le test** :
   ```bash
   node server/test-oauth-access.js
   ```

2. **Analysez les résultats** :
   - Quels endpoints réussissent avec OAuth ?
   - Quels endpoints échouent avec 403 ?

3. **Partagez les résultats** avec moi :
   - Je pourrai adapter le code en fonction
   - Confirmer si OAuth peut remplacer les API Keys

4. **Mettez à jour la documentation Roblox** :
   - Si OAuth ne fonctionne pas pour les stats, signalez-le à Roblox
   - Demandez l'ajout de scopes pour les statistiques et revenus

## 📞 Support

Si vous avez besoin de scopes supplémentaires pour les statistiques :
- 🔗 Forum développeurs Roblox : https://devforum.roblox.com
- 📧 Support Roblox : https://www.roblox.com/support
- 📖 Documentation OAuth : https://create.roblox.com/docs/cloud/oauth2-overview

---

## 🔬 Résultats de Vos Tests

**À remplir après avoir exécuté `node server/test-oauth-access.js` :**

```
Collez ici les résultats du script de test...
```

### Conclusion :
- [ ] OAuth peut accéder aux statistiques → Retirer les API Keys
- [ ] OAuth ne peut PAS accéder aux statistiques → Garder les API Keys
- [ ] Configuration hybride nécessaire
