import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, Plus, Trash2, Key, Hash, RefreshCw, ArrowRight } from 'lucide-react'
import { fetchConfig, updateConfig, addUniverseId, removeUniverseId, clearCache, convertPlaceToUniverse } from '../api'

interface ConfigData {
  universeIds: string[]
  cacheTTL: number
  hasApiKey: boolean
  lastUpdated: string | null
}

const Settings = () => {
  const [config, setConfig] = useState<ConfigData>({
    universeIds: [],
    cacheTTL: 300,
    hasApiKey: false,
    lastUpdated: null
  })
  const [apiKey, setApiKey] = useState('')
  const [newUniverseId, setNewUniverseId] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [converting, setConverting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

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

      const result = await updateConfig(updates)

      // Update local state with server response instead of reloading
      if (result.config) {
        setConfig(result.config)
      }

      showMessage('success', 'Configuration enregistrée avec succès !')
      setApiKey('')
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
          {/* API Key Section */}
          <div>
            <label className="flex items-center gap-2 text-white font-semibold mb-2">
              <Key className="w-5 h-5" />
              Clé API Roblox
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.hasApiKey ? "Clé API configurée - laissez vide pour ne pas changer" : "Entrez votre clé API Roblox"}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <p className="text-white/60 text-sm mt-2">
              {config.hasApiKey ? '✅ Clé API configurée' : '⚠️ Aucune clé API configurée'}
            </p>
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
