import type { DashboardData, DashboardDataSource, NewReservationInput, UserProfile } from '../types/dashboard'

export const demoUser: UserProfile = {
  id: 'demo-user',
  name: 'Mariana Silva',
  role: 'Gerente geral',
  initials: 'MS',
}

const baseData: DashboardData = {
  metrics: {
    totalStays: 48,
    futureReservations: 18,
    grossRevenue: 28560,
    totalReceived: 24320,
    pendingAmount: 4240,
  },
  occupancy: {
    occupied: 22,
    available: 8,
    maintenance: 1,
    percentage: 73,
  },
  revenueByRoomType: [
    { name: 'Simples', value: 6480, color: '#3978f6' },
    { name: 'Duplo', value: 9720, color: '#20b59c' },
    { name: 'Triplo', value: 5640, color: '#8b5cf6' },
    { name: 'Suíte', value: 6720, color: '#f59e0b' },
  ],
  occupancyTrend: [
    { day: '01/04', occupied: 15, available: 6 },
    { day: '04/04', occupied: 16, available: 8 },
    { day: '07/04', occupied: 18, available: 9 },
    { day: '10/04', occupied: 17, available: 8 },
    { day: '13/04', occupied: 20, available: 7 },
    { day: '16/04', occupied: 22, available: 9 },
    { day: '19/04', occupied: 19, available: 8 },
    { day: '22/04', occupied: 23, available: 7 },
    { day: '25/04', occupied: 21, available: 7 },
    { day: '28/04', occupied: 24, available: 9 },
    { day: '30/04', occupied: 25, available: 7 },
  ],
  roomOptions: [
    { id: 'demo-104', number: '104', roomType: 'Duplo', basePrice: 320 },
    { id: 'demo-201', number: '201', roomType: 'Triplo', basePrice: 420 },
    { id: 'demo-305', number: '305', roomType: 'Suíte', basePrice: 560 },
  ],
  reservations: [
    { code: 'R0018', guest: 'Ana Souza', checkIn: '23/04/2025', checkOut: '26/04/2025', room: '104', roomType: 'Duplo', value: 620, status: 'confirmed', origin: 'WhatsApp' },
    { code: 'R0017', guest: 'Carlos Lima', checkIn: '24/04/2025', checkOut: '27/04/2025', room: '201', roomType: 'Triplo', value: 1080, status: 'confirmed', origin: 'Booking' },
    { code: 'R0016', guest: 'Fernanda Alves', checkIn: '25/04/2025', checkOut: '28/04/2025', room: '102', roomType: 'Duplo', value: 540, status: 'pending', origin: 'Telefone' },
    { code: 'R0015', guest: 'Rafael Costa', checkIn: '26/04/2025', checkOut: '29/04/2025', room: '305', roomType: 'Suíte', value: 1620, status: 'confirmed', origin: 'Site' },
    { code: 'R0014', guest: 'Juliana Martins', checkIn: '27/04/2025', checkOut: '29/04/2025', room: '108', roomType: 'Simples', value: 1080, status: 'reserved', origin: 'Balcão' },
  ],
  stays: [
    { code: 'HOS-048', guest: 'Mariana Silva', checkIn: '20/04/2025', checkOut: '22/04/2025', room: '203', days: 2, total: 660, status: 'checked-out' },
    { code: 'HOS-047', guest: 'Paulo Santos', checkIn: '19/04/2025', checkOut: '22/04/2025', room: '101', days: 3, total: 990, status: 'checked-out' },
    { code: 'HOS-046', guest: 'Camila Rocha', checkIn: '18/04/2025', checkOut: '20/04/2025', room: '105', days: 2, total: 580, status: 'checked-out' },
    { code: 'HOS-045', guest: 'Lucas Pereira', checkIn: '17/04/2025', checkOut: '19/04/2025', room: '302', days: 2, total: 1080, status: 'checked-out' },
    { code: 'HOS-044', guest: 'Beatriz Lima', checkIn: '16/04/2025', checkOut: '18/04/2025', room: '204', days: 2, total: 720, status: 'checked-out' },
  ],
  expenses: [
    { date: '05/04/2025', description: 'Energia elétrica', category: 'Utilidades', value: 1250, status: 'paid' },
    { date: '08/04/2025', description: 'Lavanderia', category: 'Serviços', value: 680, status: 'paid' },
    { date: '12/04/2025', description: 'Manutenção do ar', category: 'Manutenção', value: 420, status: 'paid' },
    { date: '18/04/2025', description: 'Produtos de limpeza', category: 'Limpeza', value: 310, status: 'pending' },
    { date: '22/04/2025', description: 'Salários', category: 'Pessoal', value: 3200, status: 'pending' },
  ],
}

export const mockDashboardDataSource: DashboardDataSource = {
  async getDashboardData(filters) {
    await new Promise((resolve) => setTimeout(resolve, 160))

    if (filters.period === 'Últimos 7 dias') {
      return {
        ...baseData,
        occupancy: { ...baseData.occupancy, occupied: 19, percentage: 63 },
        revenueByRoomType: baseData.revenueByRoomType.map((item) => ({ ...item, value: Math.round(item.value * 0.34) })),
      }
    }

    if (filters.period === 'Próximos 30 dias') {
      return {
        ...baseData,
        occupancy: { ...baseData.occupancy, occupied: 25, percentage: 81 },
        revenueByRoomType: baseData.revenueByRoomType.map((item) => ({ ...item, value: Math.round(item.value * 1.2) })),
      }
    }

    return baseData
  },
  async createReservation(_input: NewReservationInput) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    return { code: `R${String(Date.now()).slice(-6)}` }
  },
}

export const rooms = [
  { number: '101', type: 'Simples', status: 'Ocupado', guest: 'Paulo Santos', tone: 'occupied' },
  { number: '102', type: 'Duplo', status: 'Limpeza', guest: 'Fernanda Alves', tone: 'cleaning' },
  { number: '103', type: 'Simples', status: 'Livre', guest: '—', tone: 'available' },
  { number: '104', type: 'Duplo', status: 'Ocupado', guest: 'Ana Souza', tone: 'occupied' },
  { number: '105', type: 'Simples', status: 'Livre', guest: '—', tone: 'available' },
  { number: '201', type: 'Triplo', status: 'Ocupado', guest: 'Carlos Lima', tone: 'occupied' },
  { number: '202', type: 'Duplo', status: 'Livre', guest: '—', tone: 'available' },
  { number: '203', type: 'Duplo', status: 'Manutenção', guest: '—', tone: 'maintenance' },
  { number: '204', type: 'Suíte', status: 'Ocupado', guest: 'Beatriz Lima', tone: 'occupied' },
  { number: '301', type: 'Simples', status: 'Livre', guest: '—', tone: 'available' },
  { number: '302', type: 'Suíte', status: 'Ocupado', guest: 'Lucas Pereira', tone: 'occupied' },
  { number: '305', type: 'Suíte', status: 'Ocupado', guest: 'Rafael Costa', tone: 'occupied' },
]
