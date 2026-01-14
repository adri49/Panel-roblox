import axios from 'axios'
import { GameStats, SalesData } from '../types'

const API_BASE = '/api'

export const fetchAllStats = async (): Promise<GameStats[]> => {
  const response = await axios.get(`${API_BASE}/stats/all`)
  return response.data
}

export const fetchUniverseStats = async (universeId: string): Promise<GameStats> => {
  const response = await axios.get(`${API_BASE}/stats/universe/${universeId}`)
  return response.data
}

export const fetchAllSales = async (): Promise<SalesData> => {
  const response = await axios.get(`${API_BASE}/sales/all/transactions`)
  return response.data
}

export const searchPurchases = async (query: string): Promise<SalesData> => {
  const response = await axios.get(`${API_BASE}/sales/search/${query}`)
  return response.data
}

// Configuration API
export const fetchConfig = async () => {
  const response = await axios.get(`${API_BASE}/config`)
  return response.data
}

export const updateConfig = async (config: {
  robloxApiKey?: string
  universeIds?: string[]
  cacheTTL?: number
}) => {
  const response = await axios.post(`${API_BASE}/config`, config)
  return response.data
}

export const addUniverseId = async (universeId: string) => {
  const response = await axios.post(`${API_BASE}/config/universe`, { universeId })
  return response.data
}

export const removeUniverseId = async (universeId: string) => {
  const response = await axios.delete(`${API_BASE}/config/universe/${universeId}`)
  return response.data
}

export const clearCache = async () => {
  const response = await axios.post(`${API_BASE}/config/cache/clear`)
  return response.data
}

export const convertPlaceToUniverse = async (placeId: string) => {
  const response = await axios.get(`${API_BASE}/config/convert-place/${placeId}`)
  return response.data
}

export const testApiKey = async () => {
  const response = await axios.get(`${API_BASE}/stats/test-api-key`)
  return response.data
}

// OAuth 2.0 API
export const getOAuthConfig = async () => {
  const response = await axios.get(`${API_BASE}/oauth/config`)
  return response.data
}

export const updateOAuthConfig = async (config: {
  clientId: string
  clientSecret: string
  redirectUri: string
}) => {
  const response = await axios.post(`${API_BASE}/oauth/config`, config)
  return response.data
}

export const startOAuthFlow = async (scopes?: string[]) => {
  const response = await axios.post(`${API_BASE}/oauth/authorize`, { scopes })
  return response.data
}

export const refreshOAuthToken = async () => {
  const response = await axios.post(`${API_BASE}/oauth/refresh`)
  return response.data
}

export const revokeOAuthToken = async () => {
  const response = await axios.post(`${API_BASE}/oauth/revoke`)
  return response.data
}

export const getOAuthStatus = async () => {
  const response = await axios.get(`${API_BASE}/oauth/status`)
  return response.data
}

// Session Cookie API
export const getSessionCookieStatus = async () => {
  const response = await axios.get(`${API_BASE}/config/session-cookie/status`)
  return response.data
}

export const setSessionCookie = async (sessionCookie: string) => {
  console.log('🔍 [API] setSessionCookie appelé, longueur:', sessionCookie.length)
  console.log('🔍 [API] URL:', `${API_BASE}/config/session-cookie`)
  console.log('🔍 [API] Début du cookie:', sessionCookie.substring(0, 50))

  try {
    const response = await axios.post(`${API_BASE}/config/session-cookie`, { sessionCookie })
    console.log('🔍 [API] Réponse reçue:', response.status, response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ [API] Erreur axios:', error)
    console.error('❌ [API] error.response:', error.response)
    throw error
  }
}

export const deleteSessionCookie = async () => {
  const response = await axios.delete(`${API_BASE}/config/session-cookie`)
  return response.data
}

export const checkSessionCookie = async () => {
  const response = await axios.get(`${API_BASE}/config/session-cookie/check`)
  return response.data
}

// Webhooks API
export const getWebhooks = async () => {
  const response = await axios.get(`${API_BASE}/config/webhooks`)
  return response.data
}

export const updateWebhooks = async (webhooks: {
  discordWebhookUrl?: string
  slackWebhookUrl?: string
  notificationEmail?: string
}) => {
  const response = await axios.post(`${API_BASE}/config/webhooks`, webhooks)
  return response.data
}

export const deleteWebhooks = async () => {
  const response = await axios.delete(`${API_BASE}/config/webhooks`)
  return response.data
}

export const testWebhooks = async () => {
  const response = await axios.post(`${API_BASE}/config/webhooks/test`)
  return response.data
}
