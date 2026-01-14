import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, Plus, Trash2, Key, Hash, RefreshCw, ArrowRight, CheckCircle, XCircle, AlertCircle, Shield, LogIn, LogOut, Cookie, Bell, Send } from 'lucide-react'
import { fetchConfig, updateConfig, addUniverseId, removeUniverseId, clearCache, convertPlaceToUniverse, testApiKey, getOAuthConfig, updateOAuthConfig, startOAuthFlow, revokeOAuthToken, getOAuthStatus, getSessionCookieStatus, setSessionCookie, deleteSessionCookie, checkSessionCookie, getWebhooks, updateWebhooks, deleteWebhooks, testWebhooks } from '../api'

interface ConfigData {
  universeIds: string[]
  cacheTTL: number
  hasApiKey: boolean
  hasUserApiKey: boolean
  lastUpdated: string | null
}

const Settings = () => {
  const [config, setConfig] = useState<ConfigData>({
    universeIds: [],
    cacheTTL: 300,
    hasApiKey: false,
    hasUserApiKey: false,
    lastUpdated: null
  })
  const [apiKey, setApiKey] = useState('')
  const [userApiKey, setUserApiKey] = useState('')
  const [newUniverseId, setNewUniverseId] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [converting, setConverting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // États OAuth 2.0
  const [oauthClientId, setOauthClientId] = useState('')
  const [oauthClientSecret, setOauthClientSecret] = useState('')
  const [oauthRedirectUri, setOauthRedirectUri] = useState('')
  const [oauthConfig, setOauthConfig] = useState<any>(null)
  const [oauthStatus, setOauthStatus] = useState<any>(null)
  const [savingOAuth, setSavingOAuth] = useState(false)

  // États Session Cookie
  const [sessionCookie, setSessionCookie] = useState('')
  const [hasSessionCookie, setHasSessionCookie] = useState(false)
  const [checkingCookie, setCheckingCookie] = useState(false)
  const [cookieCheckResult, setCookieCheckResult] = useState<any>(null)

  // États Webhooks
  const [discordWebhook, setDiscordWebhook] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [webhooksStatus, setWebhooksStatus] = useState<any>(null)
  const [savingWebhooks, setSavingWebhooks] = useState(false)
  const [testingWebhooks, setTestingWebhooks] = useState(false)

  useEffect(() => {
    loadConfig()
    loadOAuthConfig()
    loadSessionCookieStatus()
    loadWebhooks()
    checkOAuthCallback()
  }, [])

  useEffect(() => {
    if (oauthConfig?.hasTokens) {
      loadOAuthStatus()
    }
  }, [oauthConfig])

  const loadConfig = async (silent = false) => {
    try {
      const data = await fetchConfig()
      setConfig(data)
    } catch (error: any) {
      console.error('Error loading config:', error)
      // Don't show error message if it's a silent reload (after save)
      if (!silent) {
        showMessage('error', 'Erreur lors du chargement de la configuration')
      }
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const updates: any = {
        cacheTTL: config.cacheTTL
      }

      if (apiKey) {
        updates.robloxApiKey = apiKey
      }

      if (userApiKey) {
        updates.robloxUserApiKey = userApiKey
      }

      const result = await updateConfig(updates)

      // Update local state with server response instead of reloading
      if (result.config) {
        setConfig(result.config)
      }

      showMessage('success', 'Configuration enregistrée avec succès !')
      setApiKey('')
      setUserApiKey('')
    } catch (error) {
      console.error('Error saving config:', error)
      showMessage('error', 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUniverseId = async () => {
    if (!newUniverseId.trim()) return

    try {
      const result = await addUniverseId(newUniverseId.trim())
      setNewUniverseId('')

      // Update local state with server response
      if (result.universeIds) {
        setConfig({ ...config, universeIds: result.universeIds })
      }

      showMessage('success', 'Universe ID ajouté !')
    } catch (error: any) {
      console.error('Error adding universe ID:', error)

      // Check if it's a duplicate error
      if (error.response?.data?.duplicate) {
        showMessage('error', error.response.data.error || 'Cet ID est déjà ajouté')
      } else {
        showMessage('error', 'Erreur lors de l\'ajout')
      }
    }
  }

  const handleConvertPlace = async () => {
    if (!placeId.trim()) return

    setConverting(true)
    try {
      const result = await convertPlaceToUniverse(placeId.trim())

      if (result.success && result.universeId) {
        setNewUniverseId(result.universeId.toString())
        setPlaceId('')
        showMessage('success', `Universe ID trouvé : ${result.universeId}`)
      }
    } catch (error: any) {
      console.error('Error converting place ID:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la conversion')
    } finally {
      setConverting(false)
    }
  }

  const handleRemoveUniverseId = async (id: string) => {
    try {
      const result = await removeUniverseId(id)

      // Update local state with server response
      if (result.universeIds) {
        setConfig({ ...config, universeIds: result.universeIds })
      }

      showMessage('success', 'Universe ID supprimé !')
    } catch (error) {
      console.error('Error removing universe ID:', error)
      showMessage('error', 'Erreur lors de la suppression')
    }
  }

  const handleClearCache = async () => {
    try {
      await clearCache()
      showMessage('success', 'Cache vidé ! Les données seront rechargées.')
    } catch (error) {
      console.error('Error clearing cache:', error)
      showMessage('error', 'Erreur lors du vidage du cache')
    }
  }

  const handleTestApiKey = async () => {
    setTesting(true)
    setTestResults(null)
    try {
      const results = await testApiKey()
      setTestResults(results)

      if (results.hasApiKey) {
        if (results.summary.failed === 0) {
          showMessage('success', `Tous les tests réussis ! (${results.summary.passed}/${results.summary.total})`)
        } else {
          showMessage('error', `${results.summary.failed} test(s) échoué(s) sur ${results.summary.total}`)
        }
      } else {
        showMessage('error', 'Aucune clé API configurée')
      }
    } catch (error) {
      console.error('Error testing API key:', error)
      showMessage('error', 'Erreur lors du test de la clé API')
    } finally {
      setTesting(false)
    }
  }

  // OAuth 2.0 Functions
  const loadOAuthConfig = async () => {
    try {
      const data = await getOAuthConfig()
      setOauthConfig(data.config)
      if (data.config.clientId) {
        setOauthRedirectUri(data.config.redirectUri || `${window.location.origin}/api/oauth/callback`)
      }
    } catch (error) {
      console.error('Error loading OAuth config:', error)
    }
  }

  const loadOAuthStatus = async () => {
    try {
      const data = await getOAuthStatus()
      setOauthStatus(data.status)
    } catch (error) {
      console.error('Error loading OAuth status:', error)
    }
  }

  const checkOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search)
    const oauthSuccess = params.get('oauth_success')
    const oauthError = params.get('oauth_error')

    if (oauthSuccess) {
      showMessage('success', 'Connexion OAuth réussie !')
      loadOAuthConfig()
      loadOAuthStatus()
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (oauthError) {
      showMessage('error', `Erreur OAuth: ${oauthError}`)
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  const handleSaveOAuthConfig = async () => {
    if (!oauthClientId || !oauthClientSecret || !oauthRedirectUri) {
      showMessage('error', 'Veuillez remplir tous les champs OAuth')
      return
    }

    setSavingOAuth(true)
    try {
      await updateOAuthConfig({
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
        redirectUri: oauthRedirectUri
      })

      showMessage('success', 'Configuration OAuth sauvegardée')
      setOauthClientId('')
      setOauthClientSecret('')
      loadOAuthConfig()
    } catch (error: any) {
      console.error('Error saving OAuth config:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingOAuth(false)
    }
  }

  const handleStartOAuth = async () => {
    try {
      const result = await startOAuthFlow()
      if (result.success && result.authUrl) {
        // Rediriger vers l'URL d'autorisation Roblox
        window.location.href = result.authUrl
      } else {
        showMessage('error', 'Impossible de démarrer l\'autorisation')
      }
    } catch (error: any) {
      console.error('Error starting OAuth:', error)
      showMessage('error', error.response?.data?.error || 'Erreur OAuth')
    }
  }

  const handleRevokeOAuth = async () => {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) {
      return
    }

    try {
      await revokeOAuthToken()
      showMessage('success', 'Déconnecté avec succès')
      loadOAuthConfig()
      setOauthStatus(null)
    } catch (error: any) {
      console.error('Error revoking OAuth:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la déconnexion')
    }
  }

  // Session Cookie Functions
  const loadSessionCookieStatus = async () => {
    try {
      const data = await getSessionCookieStatus()
      setHasSessionCookie(data.hasSessionCookie)
    } catch (error) {
      console.error('Error loading session cookie status:', error)
    }
  }

  const handleSaveSessionCookie = async () => {
    if (!sessionCookie.trim()) {
      showMessage('error', 'Veuillez entrer un cookie de session')
      return
    }

    try {
      const result = await setSessionCookie(sessionCookie)
      showMessage('success', 'Cookie de session configuré avec succès')
      setSessionCookie('')
      loadSessionCookieStatus()

      if (result.warning) {
        setTimeout(() => showMessage('error', result.warning), 3000)
      }
    } catch (error: any) {
      console.error('Error saving session cookie:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteSessionCookie = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer le cookie de session ?')) {
      return
    }

    try {
      await deleteSessionCookie()
      showMessage('success', 'Cookie de session supprimé')
      loadSessionCookieStatus()
      setCookieCheckResult(null)
    } catch (error: any) {
      console.error('Error deleting session cookie:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleCheckSessionCookie = async () => {
    setCheckingCookie(true)
    setCookieCheckResult(null)

    try {
      const result = await checkSessionCookie()
      setCookieCheckResult(result)

      if (result.isValid) {
        showMessage('success', 'Cookie valide !')
      } else if (result.isValid === false) {
        showMessage('error', 'Cookie expiré ou invalide')
      } else {
        showMessage('error', 'Impossible de vérifier le cookie')
      }
    } catch (error: any) {
      console.error('Error checking session cookie:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la vérification')
    } finally {
      setCheckingCookie(false)
    }
  }

  // Webhooks Functions
  const loadWebhooks = async () => {
    try {
      const data = await getWebhooks()
      setWebhooksStatus(data.webhooks)
      if (data.webhooks.notificationEmail) {
        setNotificationEmail(data.webhooks.notificationEmail)
      }
    } catch (error) {
      console.error('Error loading webhooks:', error)
    }
  }

  const handleSaveWebhooks = async () => {
    setSavingWebhooks(true)

    try {
      const updates: any = {}

      if (discordWebhook.trim()) {
        updates.discordWebhookUrl = discordWebhook.trim()
      }

      if (slackWebhook.trim()) {
        updates.slackWebhookUrl = slackWebhook.trim()
      }

      if (notificationEmail.trim()) {
        updates.notificationEmail = notificationEmail.trim()
      }

      const result = await updateWebhooks(updates)
      showMessage('success', 'Webhooks configurés avec succès')

      setDiscordWebhook('')
      setSlackWebhook('')
      loadWebhooks()
    } catch (error: any) {
      console.error('Error saving webhooks:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingWebhooks(false)
    }
  }

  const handleDeleteWebhooks = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les webhooks ?')) {
      return
    }

    try {
      await deleteWebhooks()
      showMessage('success', 'Webhooks supprimés')
      setNotificationEmail('')
      loadWebhooks()
    } catch (error: any) {
      console.error('Error deleting webhooks:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleTestWebhooks = async () => {
    setTestingWebhooks(true)

    try {
      const result = await testWebhooks()
      showMessage('success', 'Notifications de test envoyées ! Vérifiez vos canaux.')
    } catch (error: any) {
      console.error('Error testing webhooks:', error)
      showMessage('error', error.response?.data?.error || 'Erreur lors du test')
    } finally {
      setTestingWebhooks(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-500/20 border border-green-500/50'
            : 'bg-red-500/20 border border-red-500/50'
        }`}>
          <p className="text-white font-semibold">{message.text}</p>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl text-white">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Configuration</h2>
            <p className="text-white/70">
              {config.lastUpdated
                ? `Dernière mise à jour: ${new Date(config.lastUpdated).toLocaleString('fr-FR')}`
                : 'Pas encore configuré'
              }
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* OAuth 2.0 Section - MÉTHODE RECOMMANDÉE */}
          <div className="border-2 border-blue-500/50 rounded-xl p-6 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">OAuth 2.0 (Recommandé)</h3>
              <span className="ml-auto bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">Moderne & Sécurisé</span>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
              <p className="text-blue-200 text-sm">
                💡 <strong>OAuth 2.0</strong> est la méthode d'authentification moderne recommandée par Roblox.
                Elle donne accès à <strong>toutes les APIs</strong> incluant economycreatorstats et engagementpayouts.
              </p>
            </div>

            {!oauthConfig?.isConfigured ? (
              // Configuration initiale OAuth
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm mb-2">
                    📋 <strong>Créez d'abord votre application OAuth sur Roblox:</strong>
                  </p>
                  <ol className="text-yellow-200 text-sm list-decimal list-inside space-y-1 ml-4">
                    <li>Allez sur <a href="https://create.roblox.com/credentials" target="_blank" rel="noopener noreferrer" className="underline">create.roblox.com/credentials</a></li>
                    <li>Cliquez sur "Create OAuth2 App"</li>
                    <li>Copiez le Client ID et Client Secret</li>
                    <li>Configurez le Redirect URI: <code className="bg-black/20 px-1 rounded">{window.location.origin}/api/oauth/callback</code></li>
                  </ol>
                </div>

                <div>
                  <label className="text-white font-semibold mb-2 block">Client ID</label>
                  <input
                    type="text"
                    value={oauthClientId}
                    onChange={(e) => setOauthClientId(e.target.value)}
                    placeholder="Entrez le Client ID"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold mb-2 block">Client Secret</label>
                  <input
                    type="password"
                    value={oauthClientSecret}
                    onChange={(e) => setOauthClientSecret(e.target.value)}
                    placeholder="Entrez le Client Secret"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold mb-2 block">Redirect URI</label>
                  <input
                    type="text"
                    value={oauthRedirectUri}
                    onChange={(e) => setOauthRedirectUri(e.target.value)}
                    placeholder="URL de redirection"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <p className="text-white/60 text-xs mt-1">
                    Doit correspondre exactement à l'URL configurée dans Roblox Creator Dashboard
                  </p>
                </div>

                <button
                  onClick={handleSaveOAuthConfig}
                  disabled={savingOAuth}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {savingOAuth ? 'Sauvegarde...' : 'Sauvegarder la configuration OAuth'}
                </button>
              </div>
            ) : (
              // OAuth configuré - Afficher le statut et le bouton de connexion
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Application OAuth configurée</span>
                </div>

                {oauthConfig?.hasTokens && oauthStatus ? (
                  // Connecté
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-300 font-semibold">✅ Connecté via OAuth 2.0</span>
                      </div>
                      <p className="text-green-200 text-sm">
                        Scopes: <code className="bg-black/20 px-1 rounded text-xs">{oauthStatus.scope}</code>
                      </p>
                      {oauthStatus.expiresAt && (
                        <p className="text-green-200 text-sm mt-1">
                          Expire: {new Date(oauthStatus.expiresAt).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleRevokeOAuth}
                      className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnecter OAuth
                    </button>
                  </div>
                ) : (
                  // Pas connecté - Afficher le bouton de connexion
                  <div className="space-y-3">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-200 text-sm">
                        ⚠️ Non connecté. Cliquez ci-dessous pour autoriser l'accès aux APIs Roblox.
                      </p>
                    </div>

                    <button
                      onClick={handleStartOAuth}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      Se connecter avec Roblox OAuth
                    </button>

                    <p className="text-white/60 text-xs text-center">
                      Vous serez redirigé vers Roblox pour autoriser l'accès
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-white/50 text-sm text-center">Ou utilisez les clés API (méthode alternative)</p>
          </div>

          {/* API Key Section */}
          <div>
            <label className="flex items-center gap-2 text-white font-semibold mb-2">
              <Key className="w-5 h-5" />
              Clé API Roblox (Groupe)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.hasApiKey ? "Clé API Groupe configurée - laissez vide pour ne pas changer" : "Entrez votre clé API Groupe"}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <p className="text-white/60 text-sm mt-2">
              {config.hasApiKey ? '✅ Clé API Groupe configurée' : '⚠️ Aucune clé API Groupe configurée'}
            </p>
          </div>

          {/* User API Key Section */}
          <div>
            <label className="flex items-center gap-2 text-white font-semibold mb-2">
              <Key className="w-5 h-5" />
              Clé API Roblox (Utilisateur)
            </label>
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              placeholder={config.hasUserApiKey ? "Clé API Utilisateur configurée - laissez vide pour ne pas changer" : "Entrez votre clé API Utilisateur"}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <p className="text-white/60 text-sm mt-2">
              {config.hasUserApiKey ? '✅ Clé API Utilisateur configurée' : '⚠️ Aucune clé API Utilisateur configurée'}
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
              <p className="text-blue-200 text-sm">
                💡 <strong>Important:</strong> La clé Utilisateur est nécessaire pour accéder aux statistiques de revenus (economycreatorstats, engagementpayouts). Les clés Groupe ont des limitations.
              </p>
            </div>

            {/* Test API Key Button */}
            {(config.hasApiKey || config.hasUserApiKey) && (
              <button
                onClick={handleTestApiKey}
                disabled={testing}
                className="mt-3 w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-200 font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <AlertCircle className="w-4 h-4" />
                {testing ? 'Test en cours...' : 'Tester les permissions des clés API'}
              </button>
            )}

            {/* Test Results */}
            {testResults && testResults.hasApiKey && (
              <div className="mt-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold">Résultats du test</h4>
                  <div className="text-sm">
                    <span className="text-green-400">{testResults.summary.passed} ✓</span>
                    {' / '}
                    <span className="text-red-400">{testResults.summary.failed} ✗</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {testResults.tests.map((test: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        test.success
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {test.success ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">{test.name}</p>
                          <p className={`text-sm ${test.success ? 'text-green-200' : 'text-red-200'}`}>
                            {test.message}
                          </p>
                          <p className="text-white/50 text-xs mt-1">
                            Scope: {test.scope}
                          </p>
                          {test.productCount !== undefined && (
                            <p className="text-white/50 text-xs">
                              Produits trouvés: {test.productCount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cache TTL */}
          <div>
            <label className="flex items-center gap-2 text-white font-semibold mb-2">
              <RefreshCw className="w-5 h-5" />
              Durée du cache (secondes)
            </label>
            <input
              type="number"
              value={config.cacheTTL}
              onChange={(e) => setConfig({ ...config, cacheTTL: parseInt(e.target.value) || 300 })}
              min="60"
              max="3600"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <p className="text-white/60 text-sm mt-2">
              Les données sont mises en cache pendant {config.cacheTTL} secondes
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
          </button>
        </div>
      </div>

      {/* Universe IDs Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl text-white">
            <Hash className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-white">Universe IDs des Jeux</h3>
        </div>

        {/* Convert Place ID to Universe ID */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <p className="text-yellow-200 text-sm mb-3">
            💡 Vous avez un <strong>Place ID</strong> ? Convertissez-le en Universe ID ici
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConvertPlace()}
              placeholder="Entrez le Place ID (ex: 84545134639707)"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleConvertPlace}
              disabled={converting}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5" />
              {converting ? 'Conversion...' : 'Convertir'}
            </button>
          </div>
        </div>

        {/* Add Universe ID */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newUniverseId}
            onChange={(e) => setNewUniverseId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddUniverseId()}
            placeholder="Entrez un Universe ID"
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={handleAddUniverseId}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>

        {/* Universe IDs List */}
        <div className="space-y-2">
          {config.universeIds.length === 0 ? (
            <p className="text-white/60 text-center py-8">
              Aucun jeu configuré. Ajoutez vos Universe IDs ci-dessus.
            </p>
          ) : (
            config.universeIds.map((id) => (
              <div
                key={id}
                className="bg-white/5 rounded-lg p-3 flex items-center justify-between border border-white/10"
              >
                <span className="text-white font-mono">{id}</span>
                <button
                  onClick={() => handleRemoveUniverseId(id)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-2 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Session Cookie Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-xl text-white">
            <Cookie className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Cookie de Session Roblox</h2>
            <p className="text-white/70">
              {hasSessionCookie ? '✅ Cookie configuré' : '⚠️ Aucun cookie configuré'}
            </p>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <p className="text-yellow-200 text-sm mb-2">
            ⚠️ <strong>Important:</strong> Le cookie .ROBLOSECURITY est nécessaire pour accéder aux APIs economycreatorstats et engagementpayouts.
          </p>
          <p className="text-yellow-200 text-sm">
            🔒 <strong>Sécurité:</strong> Utilisez un compte dédié avec permissions minimales. Le cookie est chiffré en base de données (AES-256-GCM).
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white font-semibold mb-2 block">Cookie .ROBLOSECURITY</label>
            <input
              type="password"
              value={sessionCookie}
              onChange={(e) => setSessionCookie(e.target.value)}
              placeholder={hasSessionCookie ? "Laissez vide pour ne pas changer" : "Collez votre cookie .ROBLOSECURITY"}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
            <p className="text-white/60 text-xs mt-1">
              Trouvez ce cookie dans les DevTools de votre navigateur (Application → Cookies → .ROBLOSECURITY)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveSessionCookie}
              disabled={!sessionCookie.trim()}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Enregistrer le cookie
            </button>

            {hasSessionCookie && (
              <>
                <button
                  onClick={handleCheckSessionCookie}
                  disabled={checkingCookie}
                  className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-200 font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <AlertCircle className="w-5 h-5" />
                  {checkingCookie ? 'Vérification...' : 'Vérifier'}
                </button>

                <button
                  onClick={handleDeleteSessionCookie}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Supprimer
                </button>
              </>
            )}
          </div>

          {cookieCheckResult && (
            <div className={`p-4 rounded-xl border ${
              cookieCheckResult.isValid
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {cookieCheckResult.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={cookieCheckResult.isValid ? 'text-green-300 font-semibold' : 'text-red-300 font-semibold'}>
                  {cookieCheckResult.isValid ? 'Cookie valide !' : 'Cookie expiré ou invalide'}
                </span>
              </div>
              <p className={cookieCheckResult.isValid ? 'text-green-200 text-sm' : 'text-red-200 text-sm'}>
                Vérifié le: {new Date(cookieCheckResult.checkedAt).toLocaleString('fr-FR')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Webhooks Notifications Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl text-white">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Notifications de Monitoring</h2>
            <p className="text-white/70">
              Configurez où recevoir les alertes d'expiration de cookie
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
          <p className="text-blue-200 text-sm mb-2">
            🔔 <strong>Monitoring automatique:</strong> Le système vérifie votre cookie toutes les heures.
          </p>
          <p className="text-blue-200 text-sm">
            📧 <strong>Notifications:</strong> Vous serez alerté par Discord/Slack/Email si le cookie expire (max 1 notification par 24h).
          </p>
        </div>

        <div className="space-y-4">
          {/* Discord Webhook */}
          <div>
            <label className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Webhook Discord
            </label>
            <input
              type="text"
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              placeholder={webhooksStatus?.hasDiscordWebhook ? "Webhook configuré - laissez vide pour ne pas changer" : "https://discord.com/api/webhooks/..."}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-white/60 text-xs mt-1">
              {webhooksStatus?.hasDiscordWebhook ? '✅ Webhook Discord configuré' : '⚠️ Aucun webhook Discord configuré'}
            </p>
          </div>

          {/* Slack Webhook */}
          <div>
            <label className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">💼</span>
              Webhook Slack
            </label>
            <input
              type="text"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder={webhooksStatus?.hasSlackWebhook ? "Webhook configuré - laissez vide pour ne pas changer" : "https://hooks.slack.com/services/..."}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-white/60 text-xs mt-1">
              {webhooksStatus?.hasSlackWebhook ? '✅ Webhook Slack configuré' : '⚠️ Aucun webhook Slack configuré'}
            </p>
          </div>

          {/* Email Notifications */}
          <div>
            <label className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📧</span>
              Email de Notification
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-white/60 text-xs mt-1">
              {webhooksStatus?.hasNotificationEmail ? '✅ Email configuré' : '⚠️ Aucun email configuré'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveWebhooks}
              disabled={savingWebhooks || (!discordWebhook.trim() && !slackWebhook.trim() && !notificationEmail.trim())}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {savingWebhooks ? 'Sauvegarde...' : 'Enregistrer les webhooks'}
            </button>

            {(webhooksStatus?.hasDiscordWebhook || webhooksStatus?.hasSlackWebhook || webhooksStatus?.hasNotificationEmail) && (
              <>
                <button
                  onClick={handleTestWebhooks}
                  disabled={testingWebhooks}
                  className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-200 font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  {testingWebhooks ? 'Test...' : 'Tester'}
                </button>

                <button
                  onClick={handleDeleteWebhooks}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cache Control */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">Contrôle du Cache</h3>
        <p className="text-white/70 mb-4">
          Videz le cache pour forcer le rechargement immédiat de toutes les données.
        </p>
        <button
          onClick={handleClearCache}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Vider le cache et actualiser
        </button>
      </div>
    </div>
  )
}

export default Settings
