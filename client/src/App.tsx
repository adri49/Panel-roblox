import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import SalesPanel from './components/SalesPanel'
import { GameStats } from './types'
import { fetchAllStats } from './api'
import { BarChart3 } from 'lucide-react'

function App() {
  const [stats, setStats] = useState<GameStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales'>('dashboard')

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchAllStats()
      setStats(data)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Panel Roblox</h1>
                  <p className="text-white/80">Tableau de bord des statistiques</p>
                </div>
              </div>
              <div className="flex gap-2">
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
            {activeTab === 'dashboard' ? (
              <Dashboard stats={stats} />
            ) : (
              <SalesPanel />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
