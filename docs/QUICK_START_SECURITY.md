# 🔐 Guide Rapide de Sécurité - Clé API Roblox

## ⚡ Configuration en 3 Étapes

### 1. Créer la Clé API

Allez sur : https://create.roblox.com/dashboard/credentials

Cliquez sur "Create API Key" et donnez un nom comme `Panel-Roblox-Stats`

### 2. Sélectionnez UNIQUEMENT ces permissions

#### ✅ Permissions À ACTIVER (lecture seule)

```
☑️ universe:read          - Lire les infos des jeux
☑️ universe.stats:read    - Lire les statistiques
☑️ economy:read           - Lire les données économiques
☑️ transactions:read      - Lire les transactions
☑️ asset:read             - Lire les game passes et produits
```

#### ❌ Permissions À NE JAMAIS ACTIVER

```
❌ Toute permission avec "write"
❌ Toute permission avec "manage"
❌ Toute permission avec "delete"
❌ Toute permission avec "create"
```

### 3. Configurez votre fichier .env

```bash
cd server
cp .env.example .env
nano .env
```

Remplissez :
```env
ROBLOX_API_KEY=rbx_votre_clé_ici
UNIVERSE_IDS=1234567890,9876543210
```

## 🛡️ Checklist de Sécurité

- [ ] Clé API avec permissions READ-ONLY uniquement
- [ ] Fichier `.env` dans `.gitignore`
- [ ] Clé API JAMAIS commitée dans git
- [ ] Rotation de clé tous les 3-6 mois
- [ ] Surveillance régulière du Creator Dashboard

## ⚠️ En cas de problème

**Clé compromise ?**
1. Révoquez immédiatement dans Creator Dashboard
2. Créez une nouvelle clé
3. Mettez à jour `.env`
4. Redémarrez le serveur

**Permissions insuffisantes ?**
- Vérifiez que vous avez bien activé toutes les permissions READ-ONLY listées ci-dessus

**Questions ?**
- Consultez `docs/API_KEY_SETUP.md` pour le guide complet
- Documentation Roblox : https://create.roblox.com/docs/cloud/open-cloud/api-keys

## 📊 Tableau Récapitulatif

| Fonctionnalité | Permission Requise | Niveau |
|----------------|-------------------|--------|
| Stats des jeux | `universe:read` | READ |
| Nombre de joueurs | `universe.stats:read` | READ |
| Revenus | `economy:read` | READ |
| Transactions | `transactions:read` | READ |
| Game passes | `asset:read` | READ |

**Règle d'or** : Si ce n'est pas dans ce tableau, ne l'activez pas ! 🔒
