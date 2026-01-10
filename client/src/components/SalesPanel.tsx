import { useState, useEffect } from 'react'
import { Search, ShoppingCart, User, Calendar, DollarSign } from 'lucide-react'
import { SalesData } from '../types'
import { fetchAllSales, searchPurchases } from '../api'

const SalesPanel = () => {
  const [salesData, setSalesData] = useState<SalesData>({ transactions: [], totalSales: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      const data = await fetchAllSales()
      setSalesData(data)
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadSales()
      return
    }

    setSearching(true)
    try {
      const results = await searchPurchases(searchQuery)
      setSalesData(results)
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
    } finally {
      setSearching(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl text-white">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Ventes de Marchandises</h2>
            <p className="text-white/70">Total: {salesData.totalSales.toLocaleString()} R$</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom d'utilisateur ou produit..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {searching ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
          </div>
        ) : salesData.transactions.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {salesData.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-white/70" />
                    <div>
                      <p className="text-white/50 text-xs">Produit</p>
                      <p className="text-white font-semibold">{transaction.productName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-white/70" />
                    <div>
                      <p className="text-white/50 text-xs">Acheteur</p>
                      <p className="text-white font-semibold">{transaction.buyerUsername}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-white/70" />
                    <div>
                      <p className="text-white/50 text-xs">Prix</p>
                      <p className="text-green-300 font-semibold">
                        {transaction.price.toLocaleString()} {transaction.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <div>
                      <p className="text-white/50 text-xs">Date</p>
                      <p className="text-white font-semibold text-sm">
                        {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-lg">
              {searchQuery
                ? 'Aucune transaction trouvée pour cette recherche'
                : 'Aucune transaction disponible pour le moment'}
            </p>
            <p className="text-white/50 text-sm mt-2">
              Les données de ventes apparaîtront ici une fois configurées avec l'API Roblox
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesPanel
