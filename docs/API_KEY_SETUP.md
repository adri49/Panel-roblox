# Configuration de la Clé API Roblox

## Création de la Clé API

1. Allez sur [Roblox Creator Dashboard](https://create.roblox.com/dashboard/credentials)
2. Cliquez sur "Create API Key"
3. Donnez un nom descriptif : `Panel-Roblox-Stats` (par exemple)

## Autorisations Minimales Requises

### ✅ Permissions à Activer

Pour que le tableau de bord fonctionne correctement, activez UNIQUEMENT ces permissions en lecture seule :

#### Statistiques des Jeux
- `universe:read` - Lire les informations des univers/jeux
- `place:read` - Lire les informations des places
- `universe.stats:read` - Accéder aux statistiques des jeux

#### Données Économiques
- `economy.products:read` - Lire les produits développeur
- `economy.revenue:read` - Lire les revenus
- `economy.transactions:read` - Lire les transactions

#### Assets et Inventaire (pour les ventes)
- `asset:read` - Lire les game passes et produits
- `inventory:read` - Lire les inventaires
- `catalog:read` - Lire le catalogue de produits

### ❌ Permissions à NE PAS Activer

**IMPORTANT:** N'activez JAMAIS ces permissions pour minimiser les risques :

- ❌ Toute permission avec `write`, `create`, `update`, `delete`
- ❌ `user:write` ou `user:manage`
- ❌ `group:manage` ou `group:write`
- ❌ `asset:write` ou `asset:manage`
- ❌ `universe:write` ou `place:write`
- ❌ Permissions d'administration

## Bonnes Pratiques de Sécurité

### 1. Principe du Moindre Privilège
✅ N'activez QUE les permissions nécessaires pour lire les statistiques
✅ Jamais de permissions d'écriture ou de modification
✅ Jamais de permissions de suppression

### 2. Restrictions d'Accès
Si disponible, configurez :
- **IP Whitelist** : Limitez l'accès à votre serveur uniquement
- **Expiration** : Définissez une date d'expiration (renouvelez régulièrement)
- **Scope Restriction** : Limitez aux univers spécifiques si possible

### 3. Gestion de la Clé

```bash
# ✅ BON - Stockez dans .env (jamais commité)
ROBLOX_API_KEY=rbx_xxxxxxxxxxxxxxxx

# ❌ MAUVAIS - Jamais en dur dans le code
const apiKey = 'rbx_xxxxxxxxxxxxxxxx' // NE JAMAIS FAIRE ÇA
```

### 4. Fichier .gitignore

Assurez-vous que ces fichiers sont ignorés :
```gitignore
# Variables d'environnement
.env
.env.local
.env.production

# Fichiers de configuration sensibles
server/.env
**/secrets.json
```

### 5. Rotation des Clés

- 🔄 Changez votre clé API tous les 3-6 mois
- 🔄 Changez immédiatement si vous soupçonnez une compromission
- 🔄 Créez une nouvelle clé avant de révoquer l'ancienne (zéro downtime)

## Configuration dans le Projet

### 1. Créez le fichier .env
```bash
cd server
cp .env.example .env
```

### 2. Remplissez vos informations
```env
PORT=3001
ROBLOX_API_KEY=rbx_votre_clé_api_ici
UNIVERSE_IDS=1234567890,9876543210
```

### 3. Vérifiez la sécurité
```bash
# La clé ne doit PAS apparaître dans git
git status
# .env doit être dans .gitignore
cat .gitignore | grep .env
```

## Surveillance et Monitoring

### Surveiller l'utilisation de votre clé

1. Vérifiez régulièrement le Creator Dashboard
2. Surveillez les logs d'accès si disponibles
3. Mettez en place des alertes pour :
   - Utilisation inhabituelle
   - Erreurs d'authentification répétées
   - Tentatives d'accès depuis des IPs inconnues

### En cas de compromission

1. **Révoquez immédiatement** la clé dans le Creator Dashboard
2. Créez une nouvelle clé avec les mêmes permissions
3. Mettez à jour votre fichier `.env`
4. Redémarrez votre serveur
5. Analysez les logs pour détecter toute activité suspecte

## Exemple de Configuration Complète

```env
# Configuration Serveur
PORT=3001
NODE_ENV=production

# Clé API Roblox (permissions READ-ONLY)
ROBLOX_API_KEY=rbx_xxxxxxxxxxxxxxxxxxxxxxxxxx

# IDs de vos jeux (séparés par des virgules)
UNIVERSE_IDS=1234567890,9876543210

# Optionnel - Cache TTL en secondes
CACHE_TTL=300

# Optionnel - Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
```

## Ressources Officielles

- [Roblox API Keys Documentation](https://create.roblox.com/docs/cloud/open-cloud/api-keys)
- [Open Cloud API Reference](https://create.roblox.com/docs/cloud/open-cloud)
- [Security Best Practices](https://create.roblox.com/docs/cloud/open-cloud/security)

## Support

Si vous avez des questions sur la configuration :
1. Consultez la [documentation Roblox](https://create.roblox.com/docs)
2. Vérifiez que votre clé a bien les permissions nécessaires
3. Testez avec un seul jeu d'abord avant d'ajouter les autres
