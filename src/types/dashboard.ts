export type NavKey =
  | 'dashboard'
  | 'reservas'
  | 'hospedagens'
  | 'quartos'
  | 'pagamentos'
  | 'despesas'
  | 'relatorios'
  | 'configuracoes'

export type Status = 'confirmed' | 'pending' | 'cancelled' | 'reserved' | 'paid' | 'partial' | 'unpaid'

export interface UserProfile {
  id: string
  name: string
  role: string
  initials: string
}

export interface ReservationSummary {
  code: string
  guest: string
  checkIn: string
  checkOut: string
  room: string
  roomType: string
  value: number
  status: Status
  origin: string
}

export interface StaySummary {
  code: string
  guest: string
  checkIn: string
  checkOut: string
  room: string
  days: number
  total: number
  status: 'checked-in' | 'checked-out'
}

export interface ExpenseSummary {
  date: string
  description: string
  category: string
  value: number
  status: 'paid' | 'pending'
}

export interface DashboardData {
  occupancy: {
    occupied: number
    available: number
    maintenance: number
    percentage: number
  }
  revenueByRoomType: Array<{ name: string; value: number; color: string }>
  occupancyTrend: Array<{ day: string; occupied: number; available: number }>
  reservations: ReservationSummary[]
  stays: StaySummary[]
  expenses: ExpenseSummary[]
}

export interface DashboardFilters {
  period: string
}

export interface DashboardDataSource {
  getDashboardData(filters: DashboardFilters): Promise<DashboardData>
}
