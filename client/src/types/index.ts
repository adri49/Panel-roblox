export interface GameStats {
  universeId: string
  name: string
  playing: number
  visits: number
  created: string
  updated: string
  maxPlayers: number
  revenue: number
  creator?: {
    id: number
    name: string
    type: string
  }
}

export interface SalesTransaction {
  id: string
  productName: string
  buyerUsername: string
  buyerId: number
  price: number
  currency: string
  timestamp: string
  universeId: string
}

export interface SalesData {
  transactions: SalesTransaction[]
  totalSales: number
}
