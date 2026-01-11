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
