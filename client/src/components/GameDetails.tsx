import { useEffect, useState } from 'react'
import { X, Package, CreditCard, Repeat, Users, Eye, DollarSign, TrendingUp, Clock } from 'lucide-react'

interface GameDetailsProps {
  universeId: string
  onClose: () => void
}

interface GameDetail {
  universeId: string
  name: string
  playing: number
  visits: number
  created: string
  updated: string
  maxPlayers: number
  creator: {
    id: number
    name: string
    type: string
  }
  monetization: {
    gamePasses: Array<{
      id: number
      name: string
      displayName: string
      price: number
      isForSale: boolean
      description: string
      iconImageId: number
    }>
    developerProducts: Array<{
      id: string
      name: string
      description: string
      price: number
      iconImageId: number
    }>
    subscriptions: Array<{
      id: string
      name: string
      description: string
      price: number
      period: string
    }>
  }
  summary: {
    totalGamePasses: number
    totalDeveloperProducts: number
    totalSubscriptions: number
    totalMonetizationItems: number
  }
}

const GameDetails = ({ universeId, onClose }: GameDetailsProps) => {
  const [details, setDetails] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDetails()
  }, [universeId])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stats/universe/${universeId}/details`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails')
      const data = await response.json()
      setDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white/10 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
        </div>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white/10 rounded-2xl p-8 max-w-md">
          <p className="text-white text-center">❌ {error || 'Aucune donnée disponible'}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  const totalRevenue =
    details.monetization.gamePasses.reduce((sum, gp) => sum + (gp.price || 0), 0) +
    details.monetization.developerProducts.reduce((sum, dp) => sum + (dp.price || 0), 0) +
    details.monetization.subscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="min-h-screen px-4 py-8">
        <div
          className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div>
              <h2 className="text-3xl font-bold text-white">{details.name}</h2>
              <p className="text-white/70 mt-1">Universe ID: {details.universeId}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-green-300" />
                <span className="text-white/70 text-sm">Joueurs en ligne</span>
              </div>
              <p className="text-2xl font-bold text-white">{details.playing.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-blue-300" />
                <span className="text-white/70 text-sm">Visites totales</span>
              </div>
              <p className="text-2xl font-bold text-white">{details.visits.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-300" />
                <span className="text-white/70 text-sm">Joueurs max</span>
              </div>
              <p className="text-2xl font-bold text-white">{details.maxPlayers}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-yellow-300" />
                <span className="text-white/70 text-sm">Produits monétisés</span>
              </div>
              <p className="text-2xl font-bold text-white">{details.summary.totalMonetizationItems}</p>
            </div>
          </div>

          {/* Creator Info */}
          <div className="px-6 pb-6">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Créateur</p>
                  <p className="text-white font-semibold text-lg">{details.creator.name}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Type</p>
                  <p className="text-white font-semibold">{details.creator.type}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Dernière mise à jour</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/70" />
                    <p className="text-white font-semibold">
                      {new Date(details.updated).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monetization Sections */}
          <div className="px-6 pb-6 space-y-6">
            {/* Developer Products */}
            {details.monetization.developerProducts.length > 0 && (
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-6 h-6 text-yellow-300" />
                  <h3 className="text-xl font-bold text-white">
                    Produits du développeur ({details.monetization.developerProducts.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.monetization.developerProducts.map((product) => (
                    <div key={product.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="font-semibold text-white mb-1">{product.name}</h4>
                      <p className="text-white/60 text-sm mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-300" />
                        <span className="text-green-300 font-bold">{product.price.toLocaleString()} R$</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Game Passes */}
            {details.monetization.gamePasses.length > 0 && (
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-blue-300" />
                  <h3 className="text-xl font-bold text-white">
                    Game Passes ({details.monetization.gamePasses.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.monetization.gamePasses.map((pass) => (
                    <div key={pass.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="font-semibold text-white mb-1">{pass.displayName || pass.name}</h4>
                      <p className="text-white/60 text-sm mb-2 line-clamp-2">{pass.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-300" />
                          <span className="text-green-300 font-bold">{(pass.price || 0).toLocaleString()} R$</span>
                        </div>
                        {pass.isForSale && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">En vente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscriptions */}
            {details.monetization.subscriptions.length > 0 && (
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Repeat className="w-6 h-6 text-purple-300" />
                  <h3 className="text-xl font-bold text-white">
                    Abonnements ({details.monetization.subscriptions.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {details.monetization.subscriptions.map((sub) => (
                    <div key={sub.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="font-semibold text-white mb-1">{sub.name}</h4>
                      <p className="text-white/60 text-sm mb-2 line-clamp-2">{sub.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-300" />
                          <span className="text-green-300 font-bold">{sub.price.toLocaleString()} R$</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                          {sub.period}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Products Warning */}
            {details.summary.totalMonetizationItems === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <p className="text-yellow-200 text-center">
                  ⚠️ Aucun produit de monétisation trouvé pour ce jeu
                </p>
                <p className="text-yellow-200/70 text-center text-sm mt-2">
                  Vérifiez que votre clé API a les permissions nécessaires (developer-product:read, game-pass:read, subscription:read)
                </p>
              </div>
            )}

            {/* Note about Analytics */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-200 text-sm">
                ℹ️ <strong>Note:</strong> Les données de revenus détaillés, statistiques d'achat par pays/appareil, et analytics avancées ne sont pas disponibles via l'API Open Cloud publique de Roblox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameDetails
