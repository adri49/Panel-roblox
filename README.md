# Panel Roblox - Tableau de Bord Statistiques

Un tableau de bord moderne et élégant pour centraliser et visualiser les statistiques de vos jeux Roblox.

## Fonctionnalités

- 📊 **Statistiques en temps réel** - Nombre de joueurs, visites, revenus
- 💰 **Suivi des revenus** - Visualisation des gains par jeu
- 🛒 **Ventes de marchandises** - Historique complet des transactions
- 🔍 **Recherche avancée** - Trouvez qui a acheté quoi facilement
- 🎨 **Interface moderne** - Design élégant avec animations fluides
- ⚡ **Performances optimales** - Mise en cache des données pour une rapidité maximale

## Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Vite** pour un développement ultra-rapide
- **TailwindCSS** pour le design moderne
- **Lucide React** pour les icônes
- **Axios** pour les requêtes API

### Backend
- **Node.js** avec Express
- **API Roblox** pour récupérer les données
- **Node-Cache** pour optimiser les performances
- **CORS** pour la sécurité

## Installation

### 1. Cloner le repository
```bash
git clone <votre-repo>
cd Panel-roblox
```

### 2. Installer toutes les dépendances
```bash
npm run install:all
```

### 3. Configuration

Créez un fichier `.env` dans le dossier `server/`:
```bash
cp server/.env.example server/.env
```

Éditez le fichier `server/.env`:
```env
PORT=3001
ROBLOX_API_KEY=votre_clé_api_roblox
UNIVERSE_IDS=1234567890,0987654321
```

**Note:** Les Universe IDs de vos jeux Roblox peuvent être trouvés dans l'URL de la page du jeu sur Roblox.

### 4. Démarrer l'application

En mode développement (frontend + backend):
```bash
npm run dev
```

Le frontend sera disponible sur `http://localhost:3000`
Le backend sera disponible sur `http://localhost:3001`

## Utilisation

### Tableau de bord principal
- Affiche tous vos jeux avec leurs statistiques en temps réel
- Mise à jour automatique toutes les minutes
- Cartes récapitulatives pour une vue d'ensemble rapide

### Panel des ventes
- Liste toutes les transactions de marchandises
- Barre de recherche pour filtrer par utilisateur ou produit
- Affichage du total des ventes

## API Endpoints

### Statistiques
- `GET /api/stats/all` - Récupère les stats de tous les jeux
- `GET /api/stats/universe/:universeId` - Stats d'un jeu spécifique
- `GET /api/stats/revenue/:universeId` - Revenus d'un jeu

### Ventes
- `GET /api/sales/all/transactions` - Toutes les transactions
- `GET /api/sales/:universeId` - Ventes d'un jeu spécifique
- `GET /api/sales/search/:query` - Recherche de transactions

## Configuration Roblox API

Pour utiliser l'API Roblox, vous aurez besoin de:

1. **Universe IDs** de vos jeux
   - Trouvable dans l'URL: `https://www.roblox.com/games/PLACE_ID/game-name`
   - Utilisez l'API Roblox pour convertir Place ID en Universe ID si nécessaire

2. **API Key** (optionnelle pour certaines fonctionnalités)
   - Créez une clé API depuis Creator Dashboard
   - Nécessaire pour accéder aux données de revenus et transactions

## Structure du Projet

```
Panel-roblox/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── api/           # Fonctions API
│   │   ├── types/         # Types TypeScript
│   │   ├── App.tsx        # Composant principal
│   │   └── main.tsx       # Point d'entrée
│   └── package.json
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── routes/        # Routes API
│   │   ├── services/      # Services (Roblox API)
│   │   └── index.js       # Point d'entrée
│   └── package.json
└── package.json           # Scripts principaux
```

## Développement

### Frontend seul
```bash
cd client
npm run dev
```

### Backend seul
```bash
cd server
npm run dev
```

## Build pour Production

```bash
npm run build
```

Les fichiers de production seront dans `client/dist/`

## Contributions

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## License

MIT