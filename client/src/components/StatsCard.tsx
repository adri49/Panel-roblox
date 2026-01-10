import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string
  icon: ReactNode
  color: string
}

const StatsCard = ({ title, value, icon, color }: StatsCardProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-br ${color} p-3 rounded-xl text-white`}>
          {icon}
        </div>
      </div>
      <h3 className="text-white/70 text-sm font-medium mb-1">{title}</h3>
      <p className="text-white text-3xl font-bold">{value}</p>
    </div>
  )
}

export default StatsCard
