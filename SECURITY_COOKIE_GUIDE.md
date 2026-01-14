# 🔐 Guide de Sécurité : Cookie de Session Roblox

## ⚠️  AVERTISSEMENT DE SÉCURITÉ CRITIQUE

Le cookie `.ROBLOSECURITY` donne un **accès complet** à un compte Roblox. **Une mauvaise utilisation peut compromettre votre compte !**

Ce guide vous explique comment l'utiliser de manière **sécurisée** pour accéder aux APIs `economycreatorstats` et `engagementpayouts` qui nécessitent une authentification par cookie.

---

## 🎯 Pourquoi Un Cookie de Session ?

Les APIs suivantes **n'acceptent PAS** les OAuth Bearer tokens ou les API Keys :
- ❌ `economycreatorstats.roblox.com` → Besoin d'un **cookie de session**
- ❌ `engagementpayouts.roblox.com` → Besoin d'un **cookie de session**

Ces APIs legacy nécessitent un cookie `.ROBLOSECURITY` dans l'en-tête `Cookie` des requêtes HTTP.

---

## 🛡️ Mesures de Sécurité Implémentées

### 1. **Chiffrement AES-256-GCM**
- Le cookie est **chiffré** avant d'être stocké dans la base de données
- Algorithme : AES-256-GCM (authentifié)
- Clé de chiffrement : Configurable via `COOKIE_ENCRYPTION_KEY` dans `.env`

### 2. **Isolation par Équipe**
- Chaque équipe a son propre cookie
- Un utilisateur ne peut pas accéder au cookie d'une autre équipe

### 3. **Jamais Exposé au Client**
- Le cookie n'est **JAMAIS** envoyé au navigateur
- Utilisé **uniquement** côté serveur

### 4. **Logs de Sécurité**
- Toutes les opérations (ajout, suppression) sont loguées
- Traçabilité complète

### 5. **Lecture Seule Uniquement**
- Le cookie n'est utilisé QUE pour les endpoints en lecture :
  - `GET /v1/universes/{id}/stats` (economycreatorstats)
  - `GET /v1/universe-payout-history` (engagementpayouts)

---

## 📋 ÉTAPES RECOMMANDÉES (Sécurité Maximale)

### Option 1 : Compte Roblox Dédié (RECOMMANDÉ ✅)

1. **Créer un nouveau compte Roblox** dédié à l'API
   - Email : `api-stats@votredomaine.com`
   - Nom d'utilisateur : `YourGameStatsAPI`
   - Mot de passe fort avec 2FA activé

2. **Donner des permissions MINIMALES** à ce compte
   - Ajouter le compte au groupe Roblox
   - Role : **"View Analytics Only"** ou équivalent
   - **PAS** de permissions d'édition
   - **PAS** de permissions de dépense de Robux

3. **Activer la 2FA** sur ce compte
   - Utiliser Google Authenticator ou Authy
   - Sauvegarder les codes de récupération

4. **Obtenir le cookie .ROBLOSECURITY**
   - Se connecter au compte dédié sur un navigateur
   - Ouvrir les DevTools (F12)
   - Onglet "Application" → "Cookies" → `https://www.roblox.com`
   - Copier la valeur de `.ROBLOSECURITY`

5. **Configurer le cookie dans le Panel**
   - Aller dans Configuration → Cookie de Session
   - Coller le cookie
   - Sauvegarder

### Option 2 : Compte Principal (NON RECOMMANDÉ ⚠️ )

**⚠️  RISQUES** :
- Si le serveur est compromis, votre compte principal est exposé
- Accès complet à votre compte (achat, vente, trade)
- Pas de séparation des responsabilités

**Si vous devez utiliser votre compte principal** :
1. Assurez-vous que le serveur est **très bien sécurisé**
2. Utilisez HTTPS uniquement
3. Changez le cookie régulièrement (toutes les 2 semaines)
4. Surveillez les logs d'activité du compte

---

## 🤖 Monitoring Automatique du Cookie

### Détection Automatique d'Expiration

Le système inclut un **monitoring automatique** qui :

1. ✅ **Vérifie** la validité du cookie **toutes les heures**
2. ✅ **Détecte automatiquement** quand le cookie expire (401 errors)
3. ✅ **Vous notifie** immédiatement par Discord/Slack/Email
4. ✅ **Évite le spam** : 1 notification maximum par 24h par équipe

### Comment ça Fonctionne

```
[Serveur Node.js]
    │
    ├─ Toutes les heures ⏰
    │   │
    │   ├─ Récupère tous les cookies configurés
    │   ├─ Teste chaque cookie (GET /users/authenticated)
    │   │
    │   ├─ ✅ Cookie valide ?
    │   │   └─ Log : "Cookie is valid (User ID: 442615396)"
    │   │
    │   └─ ❌ Cookie expiré (401) ?
    │       ├─ Log : "Cookie is INVALID or EXPIRED"
    │       └─ Envoie notification Discord/Slack/Email
    │           │
    │           └─ 🔔 Message:
    │               "Le cookie pour l'équipe Adri49 est expiré"
    │               "Action requise: Mettre à jour le cookie"
```

### Configurer les Notifications

#### Option 1 : Discord (Recommandé) 💬

1. **Créer un Webhook Discord** :
   - Ouvrez Discord → Paramètres du Serveur
   - Onglet "Intégrations" → "Webhooks"
   - Cliquez sur "Nouveau Webhook"
   - Donnez-lui un nom (ex: "Roblox Stats Monitor")
   - Choisissez le canal (#notifications ou #admin)
   - Copiez l'URL du webhook

2. **Configurer dans `.env`** :
   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdefghijklmnop
   ```

3. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

**Exemple de notification Discord** :
```
🔔 Cookie Roblox Expiré

⚠️  Le cookie de session pour l'équipe Adri49 (ID: 1) est expiré ou invalide.

📊 Les statistiques économiques (economycreatorstats, engagementpayouts)
ne peuvent plus être récupérées.

✅ Action Requise :
1. Connectez-vous au compte Roblox dédié
2. Récupérez le nouveau cookie .ROBLOSECURITY
3. Mettez-le à jour dans le panel : Configuration → Cookie de Session

⏱️  Temps estimé : 2 minutes
```

#### Option 2 : Slack 📢

1. **Créer un Webhook Slack** :
   - Allez sur https://api.slack.com/messaging/webhooks
   - Cliquez sur "Create your Slack app"
   - Suivez les instructions
   - Copiez l'URL du webhook

2. **Configurer dans `.env`** :
   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   ```

#### Option 3 : Email 📧

```env
ADMIN_EMAIL=admin@example.com
```

*Note: L'envoi d'email nécessite de configurer un service SMTP (Sendgrid, Mailgun, etc.) - À implémenter selon vos besoins.*

### Désactiver le Monitoring (Non Recommandé)

Si vous ne voulez pas de monitoring automatique :

```env
ENABLE_COOKIE_MONITORING=false
```

### Vérification Manuelle

Vous pouvez aussi vérifier manuellement si un cookie est valide :

**API** : `GET /api/config/session-cookie/check`

```bash
curl https://votre-panel.com/api/config/session-cookie/check \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Team-Id: 1"
```

**Réponse** :
```json
{
  "success": true,
  "teamId": 1,
  "teamName": "Adri49",
  "isValid": true,
  "checkedAt": "2026-01-14T17:30:00.000Z"
}
```

---

## 🔧 Configuration

### Générer une Clé de Chiffrement

Pour la production, **générez une clé de chiffrement unique** :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajoutez-la dans `.env` :

```env
COOKIE_ENCRYPTION_KEY=votre_clé_de_64_caractères_hex_ici
```

### Obtenir le Cookie .ROBLOSECURITY

#### Méthode 1 : Via les DevTools du Navigateur

1. Ouvrez un navigateur (Chrome, Firefox, etc.)
2. Allez sur `https://www.roblox.com`
3. Connectez-vous au compte (dédié ou principal)
4. Appuyez sur `F12` pour ouvrir les DevTools
5. Onglet **"Application"** (Chrome) ou **"Stockage"** (Firefox)
6. Naviguez vers **Cookies** → `https://www.roblox.com`
7. Trouvez le cookie nommé `.ROBLOSECURITY`
8. Copiez sa **valeur** (commence par `_|WARNING:-DO-NOT-SHARE-THIS.`)

#### Méthode 2 : Via l'Extension EditThisCookie

1. Installez l'extension [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)
2. Allez sur `https://www.roblox.com` et connectez-vous
3. Cliquez sur l'icône EditThisCookie
4. Trouvez `.ROBLOSECURITY`
5. Cliquez sur "Export" pour copier tous les cookies (JSON)
6. Extrayez la valeur de `.ROBLOSECURITY`

---

## 🚀 Utilisation de l'API

### Configurer le Cookie

**POST** `/api/config/session-cookie`

```bash
curl -X POST https://votre-panel.com/api/config/session-cookie \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Team-Id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCookie": "_|WARNING:-DO-NOT-SHARE-THIS.votre_cookie_ici"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Cookie de session configuré avec succès",
  "warning": "IMPORTANT: Assurez-vous que ce cookie provient d'un compte avec permissions lecture seule !"
}
```

### Vérifier le Statut

**GET** `/api/config/session-cookie/status`

```bash
curl https://votre-panel.com/api/config/session-cookie/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Team-Id: 1"
```

**Réponse :**
```json
{
  "success": true,
  "hasSessionCookie": true,
  "message": "Cookie de session configuré"
}
```

### Supprimer le Cookie

**DELETE** `/api/config/session-cookie`

```bash
curl -X DELETE https://votre-panel.com/api/config/session-cookie \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Team-Id: 1"
```

---

## 📊 Comment Ça Fonctionne

### Flux d'Authentification

1. **Client** → Demande des statistiques économiques
2. **Serveur** → Vérifie si un cookie de session est configuré
3. **Serveur** → Déchiffre le cookie (jamais exposé)
4. **Serveur** → Envoie la requête à Roblox avec le cookie
5. **Roblox** → Retourne les données
6. **Serveur** → Retourne les données au client

```
Client         Serveur (Node.js)        Roblox API
  |                  |                       |
  |  GET /stats     |                       |
  |---------------->|                       |
  |                  |                       |
  |                  | Récupérer cookie     |
  |                  | (chiffré dans DB)    |
  |                  |                       |
  |                  | Déchiffrer cookie    |
  |                  | (AES-256)            |
  |                  |                       |
  |                  |  GET avec Cookie     |
  |                  |--------------------->|
  |                  |                       |
  |                  |  <--- Données ---    |
  |                  |                       |
  |  <-- Données ---|                       |
  |                  |                       |
```

### Ordre de Tentative d'Authentification

Pour les endpoints `economycreatorstats` et `engagementpayouts` :

1. **🍪 Cookie de Session** (priorité - généralement fonctionne)
2. **🔐 OAuth 2.0** (fallback - peu probable)
3. **🔑 API Keys** (fallback - peu probable)

---

## ⚠️  Que FAIRE et NE PAS FAIRE

### ✅ À FAIRE

- Utiliser un compte Roblox **dédié** avec permissions minimales
- Activer la **2FA** sur le compte
- Changer le cookie **régulièrement** (toutes les 2 semaines)
- Surveiller les **logs serveur** pour détecter toute activité suspecte
- Utiliser HTTPS **uniquement**
- Configurer `COOKIE_ENCRYPTION_KEY` en production

### ❌ NE PAS FAIRE

- **JAMAIS** partager le cookie avec qui que ce soit
- **JAMAIS** commit le cookie dans Git
- **JAMAIS** logger le cookie en clair
- **JAMAIS** envoyer le cookie au client
- **JAMAIS** utiliser le compte principal (utilisez un compte dédié)
- **JAMAIS** donner des permissions d'édition au compte

---

## 🔒 Sécurité Avancée

### Rotation Automatique du Cookie

Pour plus de sécurité, vous pouvez implémenter une rotation automatique :

1. Le serveur détecte quand le cookie expire (401 errors)
2. Envoie une notification à l'admin
3. L'admin se reconnecte sur le compte dédié
4. Récupère le nouveau cookie
5. Le met à jour dans le panel

### Audit Logs

Tous les accès aux endpoints `economycreatorstats` et `engagementpayouts` sont loggés :

```
🔍 Fetching economycreatorstats API for universe 8832949120...
  🍪 Trying with Session Cookie...
  ✅ Success with Session Cookie!
  📊 Data: {...}
```

Surveillez ces logs pour détecter toute activité anormale.

---

## ❓ FAQ - Questions Fréquentes

### Peut-on récupérer le cookie automatiquement depuis Roblox ?

**NON**, et voici pourquoi :

**Raisons techniques** :
- 🔒 Roblox nécessite une connexion via navigateur (interaction humaine)
- 🤖 CAPTCHA bloque les connexions automatisées
- 🔐 2FA (authentification à deux facteurs) nécessite une validation humaine
- 🛡️ Tokens anti-bot détectent et bloquent les scripts automatisés
- 🔄 Les cookies sont révoqués si détectés comme automatisés

**Ce qui est automatisé** :
- ✅ Détection d'expiration (toutes les heures)
- ✅ Notifications instantanées (Discord/Slack/Email)
- ✅ Stockage sécurisé (chiffrement AES-256)

**Fréquence de mise à jour manuelle** :
- 📅 Environ **2 fois par an** (tous les 6+ mois)
- ⏱️ **2-4 minutes** par mise à jour
- 🔔 **Notification automatique** quand c'est nécessaire

**C'est la solution standard** utilisée par tous les bots et outils Roblox (RoVer, Bloxlink, RoMonitor, etc.).

### Pourquoi les cookies durent 6 mois et pas 2 semaines ?

Les cookies `.ROBLOSECURITY` de Roblox ont une **durée de vie de 6+ mois** par défaut.

La rotation "toutes les 2 semaines" était une **recommandation de sécurité supplémentaire** (pas une obligation), mais avec :
- Un compte dédié avec permissions minimales
- Le monitoring automatique qui détecte toute anomalie
- Le chiffrement AES-256 en base de données

Il n'est **pas nécessaire** de rotationner si souvent. Attendez simplement que le système vous notifie quand le cookie expire naturellement (~6 mois).

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez que le cookie est valide (connectez-vous manuellement sur Roblox)
2. Vérifiez les logs serveur pour voir les erreurs
3. Vérifiez que `COOKIE_ENCRYPTION_KEY` est configuré en production
4. Si le cookie ne fonctionne plus, rafraîchissez-le (reconnexion)

---

## 🔗 Ressources

- [Roblox Security Best Practices](https://create.roblox.com/docs/production/publishing/account-security)
- [OAuth 2.0 Documentation](https://create.roblox.com/docs/cloud/auth/oauth2-overview)
- [AES-256-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

---

**Date de dernière mise à jour** : 2026-01-14
