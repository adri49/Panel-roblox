# Guide de Configuration Rapide

## Étape 1: Installation des dépendances

```bash
npm run install:all
```

Cette commande installera toutes les dépendances pour le projet racine, le serveur et le client.

## Étape 2: Configuration du serveur

1. Créez un fichier `.env` dans le dossier `server/`:
```bash
cp server/.env.example server/.env
```

2. Éditez `server/.env` avec vos informations:
```env
PORT=3001
ROBLOX_API_KEY=votre_clé_api_ici
UNIVERSE_IDS=123456789,987654321
```

### Comment obtenir vos Universe IDs ?

1. Allez sur la page de votre jeu Roblox
2. L'URL ressemble à: `https://www.roblox.com/games/PLACE_ID/nom-du-jeu`
3. Pour convertir un Place ID en Universe ID, utilisez l'API Roblox:
   ```
   https://apis.roblox.com/universes/v1/places/PLACE_ID/universe
   ```

### Comment obtenir une API Key Roblox ?

1. Connectez-vous à [Roblox Creator Dashboard](https://create.roblox.com/)
2. Allez dans "Credentials" ou "API Keys"
3. Créez une nouvelle clé API avec les permissions nécessaires:
   - Read game stats
   - Read revenue data
   - Read sales data

**Note:** Certaines fonctionnalités basiques fonctionnent sans API key, mais pour accéder aux données de revenus et transactions détaillées, vous en aurez besoin.

## Étape 3: Démarrer l'application

```bash
npm run dev
```

Cette commande démarre automatiquement:
- Le serveur backend sur `http://localhost:3001`
- Le client frontend sur `http://localhost:3000`

## Étape 4: Accéder à l'application

Ouvrez votre navigateur et allez sur: `http://localhost:3000`

## Dépannage

### Erreur: "Cannot find module"
```bash
cd server && npm install
cd ../client && npm install
```

### Le serveur ne démarre pas
Vérifiez que le port 3001 n'est pas déjà utilisé:
```bash
lsof -i :3001
```

### Le client ne démarre pas
Vérifiez que le port 3000 n'est pas déjà utilisé:
```bash
lsof -i :3000
```

### Pas de données affichées
1. Vérifiez que vos Universe IDs sont corrects dans le fichier `.env`
2. Vérifiez que le serveur backend est bien démarré
3. Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles

## Fonctionnalités Disponibles

### Sans API Key Roblox
- Statistiques basiques des jeux (joueurs en ligne, visites)
- Informations sur les jeux
- Interface complète

### Avec API Key Roblox
- Toutes les fonctionnalités ci-dessus
- Données de revenus détaillées
- Historique des transactions
- Ventes de marchandises
- Recherche avancée

## Prochaines Étapes

1. Personnalisez les couleurs dans `client/tailwind.config.js`
2. Ajoutez plus de jeux dans `UNIVERSE_IDS`
3. Configurez des alertes pour les statistiques importantes
4. Déployez en production (voir README.md)

## Besoin d'aide ?

Consultez la documentation complète dans `README.md` ou ouvrez une issue sur GitHub.
