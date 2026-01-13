import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing from './components/Landing'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import SalesPanel from './components/SalesPanel'
import Settings from './components/Settings'
import TeamManagement from './components/TeamManagement'
import Privacy from './components/Privacy'
import Terms from './components/Terms'
import { GameStats } from './types'
import { fetchAllStats, clearCache } from './api'
import { BarChart3, RefreshCw, LogOut, Users } from 'lucide-react'

// Composant protégé qui nécessite l'authentification
function ProtectedApp() {
  const { user, currentTeam, teams, setCurrentTeam, logout, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<GameStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'settings' | 'team'>('dashboard')
  const [nextRefresh, setNextRefresh] = useState(60)
  const [showTeamSelector, setShowTeamSelector] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      loadStats()
      const interval = setInterval(loadStats, 60000)
      return () => clearInterval(interval)
    }
  }, [authLoading, user])

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
      setNextRefresh(60)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setNextRefresh(60)
    try {
      await clearCache()
      await loadStats()
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout()
      window.location.href = '/'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    )
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
                  <p className="text-white/80">
                    {user?.username} • {currentTeam?.name}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                {/* Team Selector */}
                {teams.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowTeamSelector(!showTeamSelector)}
                      className="px-4 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 flex items-center gap-2 border border-white/20 transition-all"
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">{currentTeam?.name}</span>
                    </button>
                    {showTeamSelector && (
                      <div className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 min-w-[200px] z-50">
                        {teams.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => {
                              setCurrentTeam(team)
                              setShowTeamSelector(false)
                              window.location.reload()
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-purple-500/20 transition-all first:rounded-t-xl last:rounded-b-xl ${
                              currentTeam?.id === team.id ? 'bg-purple-500/30 font-semibold' : ''
                            }`}
                          >
                            <div className="text-purple-900">{team.name}</div>
                            <div className="text-xs text-purple-700">{team.role}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                  onClick={() => setActiveTab('team')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'team'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Équipe
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
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 flex items-center gap-2 border border-red-500/30 transition-all"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
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
            {activeTab === 'dashboard' && <Dashboard stats={stats} />}
            {activeTab === 'sales' && <SalesPanel />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'team' && <TeamManagement />}
          </>
        )}
      </div>
    </div>
  )
}

// Router principal
function AppRouter() {
  const { user, loading } = useAuth()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  // Pages publiques (accessibles sans authentification)
  if (currentPath === '/privacy') return <Privacy />
  if (currentPath === '/terms') return <Terms />
  if (currentPath === '/login') return <Login />
  if (currentPath === '/register') return <Register />

  // Si l'utilisateur est connecté, afficher le dashboard
  if (!loading && user) {
    return <ProtectedApp />
  }

  // Si pas de user et pas sur une page publique, afficher landing
  if (!loading && !user && currentPath !== '/') {
    window.location.href = '/'
    return null
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    )
  }

  // Landing page (si pas connecté)
  return <Landing />
}

// App principal avec AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
