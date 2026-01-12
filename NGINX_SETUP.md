# Configuration Nginx Proxy Manager pour Panel Roblox

Ce guide explique comment configurer Nginx Proxy Manager pour accéder à votre Panel Roblox via HTTPS.

## ✅ Prérequis

- Nginx Proxy Manager installé et accessible
- Nom de domaine configuré (ex: `panelrbx.adri49.ovh`)
- DNS pointant vers votre serveur
- Panel Roblox en cours d'exécution sur le port 3000

## 📋 Configuration Proxy Host

### 1. Ajouter un Proxy Host

Dans Nginx Proxy Manager :
1. Cliquez sur **"Proxy Hosts"**
2. Cliquez sur **"Add Proxy Host"**

### 2. Onglet "Details"

Configurez les paramètres suivants :

```
Domain Names:
  - panelrbx.adri49.ovh

Scheme: http
Forward Hostname / IP: 192.168.1.18
Forward Port: 3000

Cache Assets: ✓ (activé)
Block Common Exploits: ✓ (activé)
Websockets Support: ✓ (activé)
```

**⚠️ IMPORTANT pour résoudre le 502 Bad Gateway:**
- Ne PAS utiliser `localhost` ou `127.0.0.1`
- Utilisez l'IP réelle du serveur : `192.168.1.18`
- Le scheme doit être `http` (pas https), car le backend écoute en HTTP
- Le port doit être `3000` (frontend Vite)

### 3. Onglet "SSL"

Configurez le certificat SSL :

```
SSL Certificate: panelrbx.adri49.ovh

Force SSL: ✓ (activé)
HTTP/2 Support: ✓ (activé)
HSTS Enabled: ✓ (activé)
HSTS Subdomains: ✗ (désactivé)
```

Si le certificat n'existe pas encore :
1. Cliquez sur **"Request a new SSL Certificate"**
2. Sélectionnez **"Use a DNS Challenge"** ou **"Let's Encrypt"**
3. Entrez votre email
4. Acceptez les Conditions d'Utilisation
5. Cliquez sur **"Save"**

### 4. Onglet "Advanced" (Optionnel)

Pour de meilleures performances, ajoutez cette configuration personnalisée :

```nginx
# Timeouts augmentés pour les APIs Roblox
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Buffers pour les grosses réponses
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;

# Headers requis pour OAuth
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;

# Support WebSocket (si nécessaire)
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### 5. Sauvegarder

Cliquez sur **"Save"** pour appliquer la configuration.

## 🧪 Test de la Configuration

### 1. Vérifier le Frontend
```bash
# Devrait retourner le HTML de votre app
curl https://panelrbx.adri49.ovh
```

### 2. Vérifier le Backend
```bash
# Devrait retourner {"status":"ok"}
curl https://panelrbx.adri49.ovh/api/health
```

### 3. Vérifier les Pages Légales
```bash
# Devrait afficher la politique de confidentialité
curl https://panelrbx.adri49.ovh/privacy

# Devrait afficher les conditions d'utilisation
curl https://panelrbx.adri49.ovh/terms
```

## 🔐 Configuration OAuth 2.0 sur Roblox

Une fois Nginx configuré et fonctionnel :

1. Allez sur https://create.roblox.com/credentials
2. Cliquez sur **"Create OAuth2 App"**
3. Remplissez les informations :

```
Application Name: Panel Roblox Stats
Description: Tableau de bord statistiques pour mes jeux Roblox

Redirect URIs:
  https://panelrbx.adri49.ovh/api/oauth/callback

App Entry Link:
  https://panelrbx.adri49.ovh

Privacy Policy URL:
  https://panelrbx.adri49.ovh/privacy

Terms of Use URL:
  https://panelrbx.adri49.ovh/terms
```

4. Cochez les scopes nécessaires :
   - ✓ openid
   - ✓ profile
   - ✓ universe:read (ou autres selon vos besoins)

5. Cliquez sur **"Create"**
6. Copiez le **Client ID** et le **Client Secret**

## 🎯 Configuration dans Panel Roblox

1. Allez sur https://panelrbx.adri49.ovh/settings
2. Dans la section **"OAuth 2.0 (Recommandé)"** :
   - Collez le **Client ID**
   - Collez le **Client Secret**
   - Le **Redirect URI** devrait être automatiquement rempli avec : `https://panelrbx.adri49.ovh/api/oauth/callback`
3. Cliquez sur **"Sauvegarder la configuration OAuth"**
4. Cliquez sur **"Se connecter avec Roblox OAuth"**
5. Autorisez l'accès sur Roblox
6. Vous serez redirigé vers le panel ✅

## 🐛 Résolution des Problèmes

### Erreur 502 Bad Gateway

**Causes possibles :**
1. Le service n'est pas démarré :
```bash
cd /home/user/Panel-roblox
npm run dev
```

2. Mauvaise IP dans la config Nginx :
   - Utilisez `192.168.1.18` au lieu de `localhost`

3. Port incorrect :
   - Frontend : port `3000`
   - Backend : port `3001` (appelé via `/api/*`)

### Erreur 404 sur /api/oauth/callback

Vérifiez que :
1. Le backend est bien démarré
2. La route est correctement configurée dans `/api/oauth`
3. Le redirect URI dans Roblox correspond exactement : `https://panelrbx.adri49.ovh/api/oauth/callback`

### OAuth ne fonctionne pas

1. Vérifiez que les URLs dans Roblox Creator Dashboard correspondent EXACTEMENT :
   - Redirect URI : `https://panelrbx.adri49.ovh/api/oauth/callback` (AVEC /api)
   - Privacy Policy : `https://panelrbx.adri49.ovh/privacy` (SANS /api)
   - Terms : `https://panelrbx.adri49.ovh/terms` (SANS /api)

2. Vérifiez les logs du serveur :
```bash
cd /home/user/Panel-roblox
npm run dev
# Regardez les logs pour voir les erreurs OAuth
```

3. Vérifiez que SSL est bien activé :
```bash
curl -I https://panelrbx.adri49.ovh
# Devrait retourner "200 OK" avec des headers HTTPS
```

## 📝 Vérification Finale

Checklist complète :
- [ ] DNS pointant vers votre serveur
- [ ] Nginx Proxy Manager configuré avec SSL
- [ ] Panel Roblox accessible via HTTPS
- [ ] `/api/health` retourne 200 OK
- [ ] `/privacy` affiche la politique
- [ ] `/terms` affiche les CGU
- [ ] OAuth app créée sur Roblox avec les bonnes URLs
- [ ] OAuth configuré dans Panel Roblox
- [ ] Connexion OAuth fonctionnelle

## 🎉 Succès !

Si toutes les vérifications passent, votre Panel Roblox est prêt à utiliser OAuth 2.0 en production avec HTTPS !

Accédez à votre panel : **https://panelrbx.adri49.ovh**
