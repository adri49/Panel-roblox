import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Service de chiffrement pour les cookies Roblox
 * Utilise AES-256-GCM pour chiffrer les cookies de manière sécurisée
 */
class CookieEncryptionService {
  constructor() {
    // Clé de chiffrement dérivée de config.json
    this.encryptionKey = this.getEncryptionKey();
    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Récupère ou génère une clé de chiffrement
   */
  getEncryptionKey() {
    // Charger config.json
    const configPath = path.join(process.cwd(), 'config.json');
    let config = {};

    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configData);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture de config.json:', error.message);
    }

    // Utiliser la clé de config.json si disponible
    if (config.cookieEncryptionKey) {
      return Buffer.from(config.cookieEncryptionKey, 'hex');
    }

    // Générer une clé aléatoire et la sauvegarder dans config.json
    const newKey = crypto.randomBytes(32).toString('hex');
    config.cookieEncryptionKey = newKey;

    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('🔐 Nouvelle clé de chiffrement générée et sauvegardée dans config.json');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la clé:', error.message);
    }

    return Buffer.from(newKey, 'hex');
  }

  /**
   * Chiffre un cookie Roblox
   * @param {string} cookie - Cookie .ROBLOSECURITY en clair
   * @returns {string} Cookie chiffré (format: iv:encryptedData:authTag)
   */
  encrypt(cookie) {
    if (!cookie) {
      throw new Error('Cookie vide - impossible de chiffrer');
    }

    // Générer un IV aléatoire (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Créer le cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    // Chiffrer le cookie
    let encrypted = cipher.update(cookie, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Récupérer le tag d'authentification
    const authTag = cipher.getAuthTag();

    // Retourner: iv:encrypted:authTag (tous en hex)
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  }

  /**
   * Déchiffre un cookie Roblox
   * @param {string} encryptedCookie - Cookie chiffré (format: iv:encryptedData:authTag)
   * @returns {string} Cookie en clair
   */
  decrypt(encryptedCookie) {
    if (!encryptedCookie) {
      throw new Error('Cookie chiffré vide - impossible de déchiffrer');
    }

    try {
      // Parser le cookie chiffré
      const parts = encryptedCookie.split(':');
      if (parts.length !== 3) {
        throw new Error('Format de cookie chiffré invalide');
      }

      const [ivHex, encrypted, authTagHex] = parts;

      // Convertir de hex vers Buffer
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Créer le decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Déchiffrer
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Erreur de déchiffrement:', error.message);
      throw new Error('Impossible de déchiffrer le cookie - clé invalide ou cookie corrompu');
    }
  }

  /**
   * Génère une nouvelle clé de chiffrement pour la production
   * Exécuter: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default new CookieEncryptionService();
