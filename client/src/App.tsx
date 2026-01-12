import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import SalesPanel from './components/SalesPanel'
import Settings from './components/Settings'
import { GameStats } from './types'
import { fetchAllStats, clearCache } from './api'
import { BarChart3, RefreshCw } from 'lucide-react'

function App() {
  const [stats, setStats] = useState<GameStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'settings'>('dashboard')
  const [nextRefresh, setNextRefresh] = useState(60)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setNextRefresh((prev) => {
        if (prev <= 1) return 60
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchAllStats()
      setStats(data)
      setNextRefresh(60) // Reset countdown after each auto-refresh
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setNextRefresh(60) // Reset countdown
    try {
      await clearCache()
      await loadStats()
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Panel Roblox</h1>
                  <p className="text-white/80">Tableau de bord des statistiques</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Statistiques
                </button>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'sales'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Ventes
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Configuration
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all bg-white/20 text-white hover:bg-white/30 flex items-center gap-2 disabled:opacity-50 ${
                    refreshing ? 'animate-pulse' : ''
                  }`}
                  title="Vider le cache et actualiser"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Actualisation...' : 'Actualiser'}
                </button>
                <div className="px-4 py-3 rounded-xl bg-white/10 text-white flex items-center gap-2 border border-white/20">
                  <span className="text-white/70 text-sm">Prochaine actualisation:</span>
                  <span className="font-mono font-bold text-lg">{formatTime(nextRefresh)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard stats={stats} />}
            {activeTab === 'sales' && <SalesPanel />}
            {activeTab === 'settings' && <Settings />}
          </>
        )}
      </div>
    </div>
  )
}

export default App
