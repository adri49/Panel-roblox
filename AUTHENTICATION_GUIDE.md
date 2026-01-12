# Guide Complet - Système d'Authentification Multi-Utilisateurs

## 🎉 Nouveau Système Implémenté !

Votre Panel Roblox dispose maintenant d'un système d'authentification complet avec :
- ✅ Gestion multi-utilisateurs
- ✅ Système d'équipes (partagez l'accès avec vos collaborateurs)
- ✅ Sécurité renforcée avec JWT
- ✅ Configuration par équipe (chaque équipe a ses propres clés API et OAuth)

---

## 🚀 Démarrage Rapide

### Étape 1 : Installer les Dépendances

```bash
cd /home/user/Panel-roblox
./update.sh
```

Cette commande va :
1. Récupérer les mises à jour
2. Installer les nouvelles dépendances (bcryptjs, jsonwebtoken, better-sqlite3)
3. Créer la base de données SQLite automatiquement

### Étape 2 : Démarrer le Panel

```bash
npm run dev
```

Vous verrez dans les logs :
```
📊 Initializing database...
✅ Database initialized successfully
📁 Database location: /root/Panel-roblox/server/data/panel.db
🔒 Authentication enabled - All API routes are now protected
```

### Étape 3 : Accéder au Panel

Ouvrez votre navigateur et allez sur :
- **Local** : http://localhost:3000
- **Réseau** : http://192.168.1.18:3000
- **Domaine** : https://panelrbx.adri49.ovh

---

## 📖 Utilisation

### 1️⃣ Créer votre Premier Compte

1. Sur la page d'accueil, cliquez sur **"Créer un Compte"**
2. Remplissez le formulaire :
   - **Email** : Votre adresse email
   - **Nom d'utilisateur** : 3-20 caractères (lettres, chiffres, _ ou -)
   - **Mot de passe** : Minimum 8 caractères
   - **Confirmer** : Répétez le mot de passe
3. Cliquez sur **"Créer mon Compte"**

✅ **Automatiquement :**
- Un compte utilisateur est créé
- Une équipe personnelle est créée (ex: "Équipe de YourUsername")
- Vous êtes connecté automatiquement
- Vous êtes redirigé vers le dashboard

### 2️⃣ Configurer Votre Équipe

Une fois connecté, allez dans **Configuration** :

#### A) Clés API Roblox (Méthode 1)

1. Dans la section **"Clé API Roblox"** :
   - Collez votre **Clé API Groupe** (si vous en avez une)
   - Collez votre **Clé API Utilisateur** (si vous en avez une)
2. Cliquez sur **"Enregistrer la configuration"**

#### B) OAuth 2.0 (Méthode 2 - Recommandée)

1. Créez votre app OAuth sur https://create.roblox.com/credentials
2. Dans la section **"OAuth 2.0 (Recommandé)"** :
   - Collez votre **Client ID**
   - Collez votre **Client Secret**
   - Le **Redirect URI** est auto-rempli
3. Cliquez sur **"Sauvegarder la configuration OAuth"**
4. Cliquez sur **"Se connecter avec Roblox OAuth"**
5. Autorisez l'accès sur Roblox
6. Vous reviendrez au panel avec OAuth actif ✅

#### C) Universe IDs

1. Ajoutez vos Universe IDs dans la section **"Universe IDs des Jeux"**
2. Ou convertissez un Place ID en Universe ID
3. Cliquez sur **"Ajouter"**

### 3️⃣ Inviter des Membres à votre Équipe

Pour partager l'accès avec vos collaborateurs :

1. Allez dans **Configuration**
2. Scrollez jusqu'à **"Gestion de l'Équipe"** (section à venir)
3. Cliquez sur **"Inviter un Membre"**
4. Entrez l'**email** du membre
5. Choisissez le **rôle** :
   - **Owner** : Tous les droits (vous)
   - **Admin** : Peut gérer les membres et la config
   - **Member** : Peut voir et modifier les stats
   - **Viewer** : Lecture seule
6. Cliquez sur **"Inviter"**

Le membre devra créer son compte avec cet email pour rejoindre l'équipe.

### 4️⃣ Changer d'Équipe

Si vous êtes membre de plusieurs équipes :

1. Dans le header, cliquez sur le bouton **avec l'icône d'équipe**
2. Sélectionnez l'équipe désirée
3. Le panel se recharge avec la configuration de cette équipe

### 5️⃣ Se Déconnecter

Cliquez sur le bouton rouge **avec l'icône de déconnexion** dans le header.

---

## 🔐 Sécurité

### Mots de Passe

- **Hachés** avec bcrypt (10 rounds)
- **Jamais stockés en clair**
- Minimum 8 caractères requis

### Tokens JWT

- **Durée de vie** : 7 jours
- Stockés dans **localStorage**
- Automatiquement inclus dans chaque requête API
- Déconnexion automatique si token expiré

### Permissions

- Chaque équipe a sa propre configuration
- Les membres ne peuvent voir que les données de leur(s) équipe(s)
- Les actions sont limitées selon le rôle

---

## 🗂️ Structure de la Base de Données

### Table `users`
```
id, email, username, password, created_at, last_login, is_active
```

### Table `teams`
```
id, name, description, owner_id, created_at
```

### Table `team_members`
```
id, team_id, user_id, role, joined_at
```

### Table `team_configs`
```
id, team_id, roblox_api_key, roblox_user_api_key, universe_ids,
oauth_client_id, oauth_client_secret, oauth_access_token, etc.
```

**Emplacement** : `/root/Panel-roblox/server/data/panel.db`

---

## 🔄 Migration depuis l'Ancien Système

Si vous utilisiez le panel sans authentification :

### Option 1 : Créer un Compte et Reconfigurer

1. Créez un compte
2. Reconfigurez vos clés API et Universe IDs
3. Reconfigurez OAuth si nécessaire

### Option 2 : Migrer la Configuration

L'ancien fichier `server/config.json` existe toujours mais **n'est plus utilisé**.
Chaque équipe a maintenant sa propre config dans la base de données.

Pour migrer :
```bash
# Notez vos anciennes valeurs
cat /root/Panel-roblox/server/config.json

# Puis configurez-les dans le panel après connexion
```

---

## 🐛 Dépannage

### "Token d'authentification manquant"

**Cause** : Vous n'êtes pas connecté ou le token a expiré.

**Solution** :
1. Allez sur /login
2. Connectez-vous
3. Si le problème persiste, videz localStorage : `localStorage.clear()` dans la console navigateur

### "Aucune clé API configurée"

**Cause** : L'équipe actuelle n'a pas de clés API.

**Solution** :
1. Allez dans Configuration
2. Ajoutez vos clés API OU configurez OAuth 2.0

### "Vous n'avez pas accès à cette équipe"

**Cause** : Vous essayez d'accéder à une équipe dont vous n'êtes pas membre.

**Solution** :
- Changez d'équipe via le sélecteur d'équipe
- Demandez au propriétaire de l'équipe de vous inviter

### Base de données corrompue

Si la base de données est corrompue :

```bash
# Sauvegarder (au cas où)
cp /root/Panel-roblox/server/data/panel.db /root/panel-backup.db

# Supprimer et recréer
rm /root/Panel-roblox/server/data/panel.db

# Redémarrer le serveur (recrée la DB)
npm run dev
```

⚠️ **Attention** : Cela supprimera tous les comptes et équipes !

---

## 📊 APIs Protégées

Toutes les routes suivantes nécessitent un token JWT :

- ✅ `/api/stats/*` - Statistiques
- ✅ `/api/sales/*` - Ventes
- ✅ `/api/config/*` - Configuration
- ✅ `/api/oauth/*` - OAuth 2.0

Routes publiques (pas besoin de token) :

- ✅ `/api/health` - Santé du serveur
- ✅ `/api/auth/register` - Inscription
- ✅ `/api/auth/login` - Connexion

---

## 🎯 Cas d'Usage

### Scénario 1 : Développeur Solo

1. Créez votre compte
2. Configurez vos clés API / OAuth
3. Ajoutez vos Universe IDs
4. C'est tout ! Vous avez votre panel personnel

### Scénario 2 : Studio avec Plusieurs Développeurs

1. **Le propriétaire** crée son compte et configure le panel
2. **Le propriétaire** invite les développeurs :
   - Admins : Peuvent tout modifier
   - Members : Peuvent voir les stats
   - Viewers : Lecture seule
3. **Les développeurs** créent leur compte avec leur email
4. **Les développeurs** peuvent changer entre leurs équipes

### Scénario 3 : Plusieurs Projets

1. Créez votre compte principal
2. Pour chaque projet :
   - Vous êtes invité dans une équipe différente
   - Chaque équipe a ses propres Universe IDs
   - Chaque équipe a sa propre config OAuth
3. Changez d'équipe selon le projet

---

## ⚙️ Variables d'Environnement (Optionnel)

Créez un fichier `.env` dans `/home/user/Panel-roblox/server/` :

```env
# Secret JWT (changez-le en production !)
JWT_SECRET=votre-super-secret-tres-long-et-aleatoire

# Port serveur
PORT=3001
```

Si `JWT_SECRET` n'est pas défini, une clé par défaut sera utilisée (pas recommandé en production).

---

## 🎉 C'est Prêt !

Votre Panel Roblox est maintenant :
- ✅ **Sécurisé** avec authentification JWT
- ✅ **Multi-utilisateurs** avec système d'équipes
- ✅ **Flexible** avec permissions par rôle
- ✅ **Privé** - chaque équipe a ses données isolées

Créez votre compte et commencez à utiliser votre panel ! 🚀

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du serveur
2. Consultez ce guide
3. Vérifiez que la base de données existe : `ls -lh /root/Panel-roblox/server/data/`

---

**Bon développement ! 🎮**
