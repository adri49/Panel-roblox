import axios from 'axios'

const API_BASE = '/api'

// Configuration axios pour inclure automatiquement le token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs 401/403 (token invalide)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token invalide, rediriger vers login
      localStorage.removeItem('token')
      localStorage.removeItem('currentTeamId')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (email: string, username: string, password: string) => {
  const response = await axios.post(`${API_BASE}/auth/register`, {
    email,
    username,
    password
  })
  return response.data
}

/**
 * Connexion d'un utilisateur
 */
export const login = async (emailOrUsername: string, password: string) => {
  const response = await axios.post(`${API_BASE}/auth/login`, {
    emailOrUsername,
    password
  })
  return response.data
}

/**
 * Récupère les informations de l'utilisateur connecté
 */
export const getMe = async () => {
  const response = await axios.get(`${API_BASE}/auth/me`)
  return response.data
}

/**
 * Récupère les membres d'une équipe
 */
export const getTeamMembers = async (teamId: number) => {
  const response = await axios.get(`${API_BASE}/auth/teams/${teamId}/members`)
  return response.data
}

/**
 * Ajoute un membre à une équipe
 */
export const addTeamMember = async (teamId: number, email: string, role: string = 'member') => {
  const response = await axios.post(`${API_BASE}/auth/teams/${teamId}/members`, {
    email,
    role
  })
  return response.data
}

/**
 * Retire un membre d'une équipe
 */
export const removeTeamMember = async (teamId: number, userId: number) => {
  const response = await axios.delete(`${API_BASE}/auth/teams/${teamId}/members/${userId}`)
  return response.data
}

/**
 * Change le rôle d'un membre
 */
export const updateMemberRole = async (teamId: number, userId: number, role: string) => {
  const response = await axios.patch(`${API_BASE}/auth/teams/${teamId}/members/${userId}`, {
    role
  })
  return response.data
}
