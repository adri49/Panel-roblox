# 📋 Guide de Vérification et Utilisation

## ✅ 1. Vérifier que la configuration se sauvegarde

### Méthode 1 : Via le script de vérification (recommandé)

```bash
cd /home/user/Panel-roblox/server
node check-config.js
```

**Ce script affiche :**
- ✅ Tous les utilisateurs enregistrés
- ✅ Toutes les équipes et leurs propriétaires
- ✅ Les configurations de chaque équipe :
  - Universe IDs
  - Clés API Roblox (masquées pour sécurité)
  - OAuth Client ID / Secret
  - OAuth Access Token
  - Dernière mise à jour

**Exemple de sortie :**
```
📊 État de la base de données

👥 UTILISATEURS:
  - [1] Adri49 (adri49@example.com)

🏢 ÉQUIPES:
  - [1] Adri49 (propriétaire: Adri49)

⚙️  CONFIGURATIONS PAR ÉQUIPE:

  📦 Équipe: Adri49 (ID: 1)
     Universe IDs: ["8832949120"]
     Roblox API Key: ✅ Configurée (sk_1234567890abcdef...)
     OAuth Client ID: 1747914006881604168
     OAuth Client Secret: ✅ Configuré
     Dernière mise à jour: 2025-01-13 15:30:45
```

### Méthode 2 : Vérifier les logs du serveur

Quand vous sauvegardez votre configuration, vous devriez voir dans la console du serveur :

```
✅ Team 1 config updated
```

Si vous ne voyez PAS ce message, la configuration n'est pas sauvegardée !

### Méthode 3 : Tester avec une configuration de test

1. Connectez-vous à votre compte
2. Allez dans **Configuration**
3. Ajoutez une clé API de test : `test-api-key-12345`
4. Cliquez sur **Enregistrer**
5. Exécutez `node check-config.js`
6. Vérifiez que votre clé API apparaît

---

## 🚀 2. Procédure de test complète

### Étape 1 : Démarrer le serveur

```bash
cd /home/user/Panel-roblox
./update.sh  # Met à jour les dépendances
npm run dev  # Démarre serveur ET client
```

### Étape 2 : Créer un compte

1. Ouvrez votre navigateur : https://panelrbx.adri49.ovh
2. Cliquez sur **S'inscrire**
3. Remplissez :
   - Email : votre email
   - Username : Adri49 (ou autre)
   - Mot de passe : au moins 8 caractères
4. Validez

**✅ Vérification :** Vous devriez être automatiquement connecté et voir le Dashboard

### Étape 3 : Configurer les clés API

1. Cliquez sur l'onglet **Configuration**
2. Remplissez :
   - **Roblox API Key** : Votre clé depuis Creator Dashboard
   - **Roblox User API Key** (optionnel)
   - **Universe IDs** : L'ID de votre jeu (ex: 8832949120)
3. Cliquez sur **Enregistrer la configuration**

**✅ Vérification :**
```bash
node check-config.js  # Doit afficher votre clé API
```

### Étape 4 : Configurer OAuth 2.0 (optionnel)

1. Dans **Configuration**, section OAuth
2. Remplissez :
   - **Client ID** : 1747914006881604168
   - **Client Secret** : Votre secret depuis Roblox
   - **Redirect URI** : https://panelrbx.adri49.ovh/api/oauth/callback
3. Cliquez sur **Enregistrer OAuth Config**

**✅ Vérification :**
```bash
node check-config.js  # Doit afficher OAuth configuré
```

### Étape 5 : Tester les statistiques

1. Allez dans l'onglet **Statistiques**
2. Vous devriez voir les stats de votre jeu

**❌ Si vous voyez "401 Unauthorized" :**
- Vérifiez que la clé API est bien sauvegardée (étape 3)
- Vérifiez les logs du serveur pour voir les erreurs
- Vérifiez que vous êtes bien connecté

---

## 👥 3. Gérer votre équipe

### Accéder à la gestion d'équipe

1. Cliquez sur l'onglet **Équipe** dans la navigation
2. Vous verrez :
   - Formulaire d'invitation (si vous êtes Owner/Admin)
   - Liste des membres actuels
   - Leurs rôles et dates d'adhésion

### Inviter un membre

1. Dans le formulaire d'invitation :
   - **Email** : L'email du membre à inviter (doit avoir un compte)
   - **Rôle** : Sélectionnez :
     - **Observateur** : Lecture seule
     - **Membre** : Lecture + modification config
     - **Admin** : Toutes permissions sauf transfert propriété
     - **Propriétaire** : Toutes permissions
2. Cliquez sur **Inviter**

**Note :** Le membre doit déjà avoir un compte sur le panel !

### Changer le rôle d'un membre

1. Dans la liste des membres, cliquez sur **Changer le rôle**
2. Entrez le nouveau rôle : `owner`, `admin`, `member`, ou `viewer`
3. Validez

### Retirer un membre

1. Cliquez sur **Retirer** à côté du membre
2. Confirmez la suppression

**⚠️ Attention :** Seuls les Owner et Admin peuvent gérer les membres !

---

## 🔍 4. Vérifications importantes

### ✅ Points de contrôle après chaque modification

| Action | Vérification |
|--------|-------------|
| Enregistrer API Key | `node check-config.js` → API Key apparaît |
| Enregistrer OAuth | `node check-config.js` → OAuth configuré |
| Ajouter Universe ID | `node check-config.js` → Universe ID dans la liste |
| Inviter membre | Onglet Équipe → Membre apparaît dans la liste |

### ❌ Problèmes courants

**1. La configuration ne se sauvegarde pas**
- Vérifiez les logs serveur pour les erreurs
- Vérifiez que vous êtes bien connecté (token JWT)
- Vérifiez que vous avez les permissions (Owner/Admin)
- Exécutez `node check-config.js` pour voir l'état de la DB

**2. Erreur 401 sur les stats**
- La configuration n'est pas sauvegardée
- Le token JWT est invalide (déconnexion/reconnexion)
- Le Team ID n'est pas envoyé (vérifier console navigateur)

**3. OAuth ne fonctionne pas**
- Vérifiez que le Redirect URI est correct dans Roblox
- Vérifiez que le Client Secret est correct
- Les scopes doivent être activés dans votre app Roblox

---

## 📊 5. Structure de la base de données

Votre configuration est stockée dans :
```
server/data/panel.db
```

**⚠️ NE PAS** versionner ce fichier (déjà dans .gitignore)

**Tables :**
- `users` : Tous les utilisateurs
- `teams` : Toutes les équipes
- `team_members` : Relations utilisateur-équipe avec rôles
- `team_configs` : Configuration par équipe (API keys, OAuth, Universe IDs)

---

## 🆘 Besoin d'aide ?

1. **Vérifier l'état** : `node check-config.js`
2. **Vérifier les logs** : Console du serveur pendant les opérations
3. **Vérifier le réseau** : Onglet Network dans les DevTools du navigateur
4. **Réinitialiser** : Supprimer `server/data/panel.db` et recommencer

---

## 📝 Résumé

✅ **Configuration sauvegardée** = Message "Team X config updated" dans les logs
✅ **Vérification** = `node check-config.js` affiche vos données
✅ **Gestion équipe** = Onglet "Équipe" dans l'interface
✅ **Stats fonctionnelles** = Pas d'erreur 401, données affichées

**Tout fonctionne ?** 🎉 Vous pouvez maintenant :
- Gérer votre équipe
- Partager l'accès avec des membres
- Chaque équipe a sa propre configuration isolée
