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
