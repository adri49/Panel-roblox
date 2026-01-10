import { GameStats } from '../types'
import { Users, Eye, TrendingUp, DollarSign } from 'lucide-react'
import StatsCard from './StatsCard'

interface DashboardProps {
  stats: GameStats[]
}

const Dashboard = ({ stats }: DashboardProps) => {
  const totalPlayers = stats.reduce((sum, game) => sum + game.playing, 0)
  const totalVisits = stats.reduce((sum, game) => sum + game.visits, 0)
  const totalRevenue = stats.reduce((sum, game) => sum + (game.revenue || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Jeux Actifs"
          value={stats.length.toString()}
          icon={<TrendingUp className="w-6 h-6" />}
          color="from-blue-500 to-blue-600"
        />
        <StatsCard
          title="Joueurs en Ligne"
          value={totalPlayers.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          color="from-green-500 to-green-600"
        />
        <StatsCard
          title="Visites Totales"
          value={totalVisits.toLocaleString()}
          icon={<Eye className="w-6 h-6" />}
          color="from-purple-500 to-purple-600"
        />
        <StatsCard
          title="Revenus"
          value={`${totalRevenue.toLocaleString()} R$`}
          icon={<DollarSign className="w-6 h-6" />}
          color="from-yellow-500 to-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.map((game) => (
          <div
            key={game.universeId}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:bg-white/15 transition-all"
          >
            <h3 className="text-2xl font-bold text-white mb-4">{game.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Joueurs actuels:</span>
                <span className="text-white font-semibold text-lg">
                  {game.playing.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Visites:</span>
                <span className="text-white font-semibold text-lg">
                  {game.visits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Joueurs max:</span>
                <span className="text-white font-semibold text-lg">
                  {game.maxPlayers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Revenus:</span>
                <span className="text-green-300 font-semibold text-lg">
                  {(game.revenue || 0).toLocaleString()} R$
                </span>
              </div>
              {game.creator && (
                <div className="flex justify-between items-center pt-2 border-t border-white/20">
                  <span className="text-white/70">Créateur:</span>
                  <span className="text-white font-semibold">
                    {game.creator.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {stats.length === 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
          <p className="text-white/70 text-lg">
            Aucun jeu configuré. Ajoutez vos Universe IDs dans le fichier .env
          </p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
