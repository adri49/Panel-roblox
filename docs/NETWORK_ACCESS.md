# 🌐 Accès Réseau Local

Guide pour accéder au Panel Roblox depuis d'autres ordinateurs sur votre réseau local.

## 🎯 Configuration Serveur

### 1. Vérifiez que le serveur écoute sur toutes les interfaces

Le fichier `server/src/index.js` doit avoir cette configuration :

```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

✅ **C'est déjà configuré dans ce projet !**

### 2. Vérifiez que Vite expose sur le réseau

Le fichier `client/vite.config.ts` doit avoir :

```typescript
server: {
  port: 3000,
  host: '0.0.0.0', // Expose on network
}
```

✅ **C'est déjà configuré dans ce projet !**

## 🚀 Démarrage

Sur le serveur Ubuntu, lancez simplement :

```bash
npm run dev
```

Vous devriez voir :

```
Server running on http://0.0.0.0:3001
Local access: http://localhost:3001
Network access: http://192.168.1.18:3001

VITE ready in 266 ms
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.18:3000/
```

## 🔌 Accès depuis un Autre PC

### Option 1 : Accès Direct (Recommandé)

Depuis n'importe quel PC sur le même réseau local :

```
http://192.168.1.18:3000
```

Remplacez `192.168.1.18` par l'IP de votre serveur Ubuntu.

### Option 2 : Via le Backend directement

Si vous voulez tester le backend uniquement :

```
http://192.168.1.18:3001/api/health
```

## 🔍 Trouver l'IP de votre Serveur

Sur le serveur Ubuntu, exécutez :

```bash
hostname -I
```

ou

```bash
ip addr show
```

Cherchez l'adresse IP commençant par `192.168.x.x` ou `10.x.x.x`

## 🛡️ Pare-feu

Si vous ne pouvez pas accéder, vérifiez le pare-feu :

### Ubuntu/Debian

```bash
# Vérifier le statut
sudo ufw status

# Autoriser les ports (si nécessaire)
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Ou désactiver temporairement pour tester
sudo ufw disable
```

### Vérifier que les ports écoutent

```bash
# Vérifier que les ports sont ouverts
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
```

Vous devriez voir :
```
tcp   0.0.0.0:3000   LISTEN   node
tcp   0.0.0.0:3001   LISTEN   node
```

## 📱 Architecture

```
┌─────────────────────┐
│   PC Client         │
│  (Navigateur)       │
│  192.168.1.X        │
└──────────┬──────────┘
           │
           │ http://192.168.1.18:3000
           ▼
┌─────────────────────────────────────┐
│   Serveur Ubuntu (192.168.1.18)     │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Vite (3000)  │  │ API (3001)  │ │
│  │   Frontend   │──│  Backend    │ │
│  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────┘
```

## 🔧 Dépannage

### Erreur 404 Not Found

**Cause** : Le serveur backend n'écoute pas sur `0.0.0.0`

**Solution** : Vérifiez que `server/src/index.js` a bien :
```javascript
app.listen(PORT, '0.0.0.0', ...)
```

### Impossible de se connecter

**Causes possibles** :

1. **Pare-feu bloquant**
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 3001/tcp
   ```

2. **Mauvaise IP**
   ```bash
   # Vérifiez l'IP correcte
   hostname -I
   ```

3. **Serveur non démarré**
   ```bash
   # Vérifiez que le serveur tourne
   ps aux | grep node
   ```

### CORS Errors

Si vous voyez des erreurs CORS dans la console du navigateur :

Le backend est déjà configuré avec :
```javascript
app.use(cors()); // Accepte toutes les origines
```

Si vous voulez restreindre :
```javascript
app.use(cors({
  origin: ['http://192.168.1.18:3000', 'http://localhost:3000']
}));
```

## 📊 Test de Connectivité

Depuis votre PC client :

### 1. Testez le ping
```bash
ping 192.168.1.18
```

### 2. Testez le backend
```bash
curl http://192.168.1.18:3001/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "message": "Roblox Stats API is running"
}
```

### 3. Accédez au frontend
Ouvrez dans votre navigateur :
```
http://192.168.1.18:3000
```

## 🌍 Accès depuis Internet (Avancé)

Pour accéder depuis l'extérieur de votre réseau local :

### Option 1 : Port Forwarding

1. Configurez le port forwarding sur votre routeur :
   - Port externe : 8080 → Port interne : 3000 (IP: 192.168.1.18)

2. Trouvez votre IP publique :
   ```bash
   curl ifconfig.me
   ```

3. Accédez via : `http://VOTRE_IP_PUBLIQUE:8080`

⚠️ **Sécurité** : Ajoutez une authentification avant d'exposer sur Internet !

### Option 2 : Tunnel (ngrok, Cloudflare Tunnel)

```bash
# Avec ngrok
npx ngrok http 3000
```

### Option 3 : VPN

Configurez un VPN pour accéder à votre réseau local depuis l'extérieur.

## 🔐 Sécurité

Pour un usage en réseau local :

- ✅ Pare-feu actif
- ✅ Réseau local de confiance uniquement
- ✅ Pas d'exposition Internet sans authentification
- ✅ HTTPS avec certificat SSL (pour production)
- ✅ Variables d'environnement sécurisées

## 📝 Notes

- Les modifications sont automatiquement détectées grâce à Vite et nodemon
- Le cache est partagé entre tous les clients
- Les WebSocket (si ajoutés plus tard) fonctionneront aussi en réseau

---

**Besoin d'aide ?** Vérifiez les logs du serveur avec `npm run dev` et la console du navigateur (F12).
