import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth'

interface User {
  id: number
  email: string
  username: string
  createdAt?: string
  lastLogin?: string
}

interface Team {
  id: number
  name: string
  description: string
  role: string
  member_count: number
}

interface AuthContextType {
  user: User | null
  teams: Team[]
  currentTeam: Team | null
  token: string | null
  loading: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  setCurrentTeam: (team: Team) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  // Sauvegarder currentTeam dans localStorage
  useEffect(() => {
    if (currentTeam) {
      localStorage.setItem('currentTeamId', currentTeam.id.toString())
    }
  }, [currentTeam])

  const loadUser = async () => {
    try {
      const response = await getMe()
      setUser(response.user)
      setTeams(response.teams)

      // Sélectionner l'équipe sauvegardée ou la première équipe
      const savedTeamId = localStorage.getItem('currentTeamId')
      if (savedTeamId && response.teams.length > 0) {
        const savedTeam = response.teams.find((t: Team) => t.id.toString() === savedTeamId)
        setCurrentTeamState(savedTeam || response.teams[0])
      } else if (response.teams.length > 0) {
        setCurrentTeamState(response.teams[0])
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      // Token invalide, déconnecter
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (emailOrUsername: string, password: string) => {
    const response = await apiLogin(emailOrUsername, password)
    const { user: userData, teams: teamsData, token: tokenData } = response

    setToken(tokenData)
    setUser(userData)
    setTeams(teamsData)
    localStorage.setItem('token', tokenData)

    if (teamsData.length > 0) {
      setCurrentTeamState(teamsData[0])
    }
  }

  const register = async (email: string, username: string, password: string) => {
    await apiRegister(email, username, password)
    // Après inscription, connecter automatiquement
    await login(email, password)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setTeams([])
    setCurrentTeamState(null)
    localStorage.removeItem('token')
    localStorage.removeItem('currentTeamId')
  }

  const setCurrentTeam = (team: Team) => {
    setCurrentTeamState(team)
  }

  const refreshUser = async () => {
    await loadUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        teams,
        currentTeam,
        token,
        loading,
        login,
        register,
        logout,
        setCurrentTeam,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
