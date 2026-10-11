import type {
  DashboardData,
  DashboardDataSource,
  DashboardFilters,
  ExpenseSummary,
  NewReservationInput,
  ReservationSummary,
  ReservationCreationResult,
  StaySummary,
  UserProfile,
} from '../types/dashboard'
import { supabase } from '../lib/supabase'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  reception: 'Recepção',
  housekeeping: 'Governança',
  finance: 'Financeiro',
}

/**
 * Primeira ponte entre a interface e o Supabase.
 * As telas continuam usando dados de demonstração até existir uma sessão autenticada.
 */
export async function getAuthenticatedUserProfile(): Promise<UserProfile | null> {
  if (!supabase) return null

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (profileError || !profile) return null

  const name = profile.full_name || authData.user.email?.split('@')[0] || 'Usuário'
  return {
    id: profile.id,
    name,
    role: roleLabels[profile.role] ?? profile.role,
    initials: name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join('')
      .toUpperCase(),
  }
}

type RoomTypeRow = { id?: string; name: string; color: string; base_price?: number | string }
type Relation<T> = T | T[] | null
type RoomRow = { id: string; number: string; status: string; room_types?: Relation<RoomTypeRow> }
type ReservationRow = {
  code: string
  check_in: string
  check_out: string
  total_amount: number | string
  status: string
  origin: string
  guests?: Relation<{ full_name: string }>
  rooms?: Relation<{ number: string; room_types?: Relation<RoomTypeRow> }>
}
type StayRow = {
  code: string
  check_in: string
  check_out: string | null
  total_amount: number | string
  status: string
  guests?: Relation<{ full_name: string }>
  rooms?: Relation<{ number: string }>
}
type PaymentRow = { amount: number | string; status: string }
type ExpenseRow = {
  expense_date: string
  description: string
  category: string
  amount: number | string
  status: string
}

const currencyNumber = (value: number | string | null | undefined) => Number(value ?? 0)

const firstRelation = <T,>(value: Relation<T> | undefined): T | null => (Array.isArray(value) ? value[0] ?? null : value ?? null)

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

const reservationStatus = (status: string): ReservationSummary['status'] => {
  if (status === 'confirmed' || status === 'completed') return 'confirmed'
  if (status === 'reserved') return 'reserved'
  if (status === 'cancelled') return 'cancelled'
  return 'pending'
}

const expenseStatus = (status: string): ExpenseSummary['status'] => (status === 'paid' ? 'paid' : 'pending')

const daysBetween = (start: string, end: string | null) => {
  if (!end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
  return Math.max(days, 1)
}

const createTrend = (occupied: number, available: number) => {
  const points: DashboardData['occupancyTrend'] = []
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    points.push({
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      occupied,
      available,
    })
  }
  return points
}

const reservationCode = () => `R${String(Date.now()).slice(-8)}`

export async function createSupabaseReservation(input: NewReservationInput): Promise<ReservationCreationResult> {
  if (!supabase) throw new Error('Supabase não configurado.')

  const fullName = input.fullName.trim()
  const phone = input.phone.trim()
  if (!fullName) throw new Error('Informe o nome do hóspede.')
  if (!input.checkIn || !input.checkOut || input.checkOut <= input.checkIn) {
    throw new Error('A data de saída deve ser posterior à entrada.')
  }
  if (input.totalAmount < 0) throw new Error('O valor da reserva não pode ser negativo.')

  if (input.roomId) {
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_id', input.roomId)
      .neq('status', 'cancelled')
      .lt('check_in', input.checkOut)
      .gt('check_out', input.checkIn)
      .limit(1)

    if (conflictError) throw conflictError
    if (conflicts?.length) throw new Error('Esse quarto já possui uma reserva nesse período.')
  }

  let guestId: string | null = null
  if (phone) {
    const { data: existingGuest, error: guestLookupError } = await supabase
      .from('guests')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    if (guestLookupError) throw guestLookupError
    guestId = existingGuest?.id ?? null
  }

  if (!guestId) {
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({ full_name: fullName, phone: phone || null })
      .select('id')
      .single()
    if (guestError) throw guestError
    guestId = guest.id
  } else {
    const { error: guestUpdateError } = await supabase
      .from('guests')
      .update({ full_name: fullName })
      .eq('id', guestId)
    if (guestUpdateError) throw guestUpdateError
  }

  const { data: reservation, error: reservationError } = await supabase
    .from('reservations')
    .insert({
      code: reservationCode(),
      guest_id: guestId,
      room_id: input.roomId,
      check_in: input.checkIn,
      check_out: input.checkOut,
      adults: input.adults,
      children: input.children,
      origin: input.origin,
      status: 'pending',
      total_amount: input.totalAmount,
      notes: input.notes?.trim() || null,
    })
    .select('code')
    .single()

  if (reservationError) throw reservationError
  return { code: reservation.code }
}

export const supabaseDashboardDataSource: DashboardDataSource = {
  async getDashboardData(_filters: DashboardFilters): Promise<DashboardData> {
    if (!supabase) throw new Error('Supabase não configurado.')

    const [roomsResult, roomTypesResult, reservationsResult, staysResult, paymentsResult, expensesResult] = await Promise.all([
      supabase.from('rooms').select('id, number, status, room_types(name, color, base_price)').order('number'),
      supabase.from('room_types').select('id, name, color, base_price').eq('active', true).order('name'),
      supabase
        .from('reservations')
        .select('code, check_in, check_out, total_amount, status, origin, guests(full_name), rooms(number, room_types(name, color))')
        .order('check_in', { ascending: true })
        .limit(50),
      supabase
        .from('stays')
        .select('code, check_in, check_out, total_amount, status, guests(full_name), rooms(number)')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('payments').select('amount, status').limit(500),
      supabase
        .from('expenses')
        .select('expense_date, description, category, amount, status')
        .order('expense_date', { ascending: false })
        .limit(20),
    ])

    const firstError = [roomsResult, roomTypesResult, reservationsResult, staysResult, paymentsResult, expensesResult].find((result) => result.error)?.error
    if (firstError) throw firstError

    const rooms = (roomsResult.data ?? []) as RoomRow[]
    const roomTypes = (roomTypesResult.data ?? []) as RoomTypeRow[]
    const reservations = (reservationsResult.data ?? []) as ReservationRow[]
    const stays = (staysResult.data ?? []) as StayRow[]
    const payments = (paymentsResult.data ?? []) as PaymentRow[]
    const expenses = (expensesResult.data ?? []) as ExpenseRow[]

    const occupied = rooms.filter((room) => room.status === 'occupied').length
    const maintenance = rooms.filter((room) => room.status === 'maintenance').length
    const available = Math.max(rooms.length - occupied - maintenance, 0)
    const totalRooms = occupied + available + maintenance
    const grossRevenue = reservations.reduce((sum, reservation) => sum + currencyNumber(reservation.total_amount), 0)
    const totalReceived = payments
      .filter((payment) => payment.status === 'paid' || payment.status === 'partial')
      .reduce((sum, payment) => sum + currencyNumber(payment.amount), 0)
    const pendingAmount = payments
      .filter((payment) => payment.status === 'pending' || payment.status === 'partial')
      .reduce((sum, payment) => sum + currencyNumber(payment.amount), 0)
    const today = new Date().toISOString().slice(0, 10)
    const futureReservations = reservations.filter((reservation) => reservation.check_in >= today && reservation.status !== 'cancelled').length

    const revenueByRoomType = (roomTypes.length ? roomTypes : [{ name: 'Total', color: '#3978f6' }]).map((type) => ({
      name: type.name,
      value: reservations
        .filter((reservation) => firstRelation(firstRelation(reservation.rooms)?.room_types)?.name === type.name)
        .reduce((sum, reservation) => sum + currencyNumber(reservation.total_amount), 0),
      color: type.color,
    }))

    return {
      metrics: {
        totalStays: stays.length,
        futureReservations,
        grossRevenue,
        totalReceived,
        pendingAmount,
      },
      occupancy: {
        occupied,
        available,
        maintenance,
        percentage: totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
      },
      revenueByRoomType,
      occupancyTrend: createTrend(occupied, available),
      roomOptions: rooms
        .filter((room) => room.status !== 'maintenance' && room.status !== 'blocked')
        .map((room) => {
          const roomType = firstRelation(room.room_types)
          return {
            id: room.id,
            number: room.number,
            roomType: roomType?.name ?? 'Não definido',
            basePrice: currencyNumber(roomType?.base_price),
          }
        }),
      reservations: reservations.map((reservation) => {
        const guest = firstRelation(reservation.guests)
        const room = firstRelation(reservation.rooms)
        const roomType = firstRelation(room?.room_types)
        return {
        code: reservation.code,
        guest: guest?.full_name ?? 'Hóspede sem nome',
        checkIn: formatDate(reservation.check_in),
        checkOut: formatDate(reservation.check_out),
        room: room?.number ?? 'A definir',
        roomType: roomType?.name ?? 'Não definido',
        value: currencyNumber(reservation.total_amount),
        status: reservationStatus(reservation.status),
        origin: reservation.origin,
        }
      }),
      stays: stays.map((stay) => {
        const guest = firstRelation(stay.guests)
        const room = firstRelation(stay.rooms)
        return {
        code: stay.code,
        guest: guest?.full_name ?? 'Hóspede sem nome',
        checkIn: formatDate(stay.check_in),
        checkOut: formatDate(stay.check_out),
        room: room?.number ?? '—',
        days: daysBetween(stay.check_in, stay.check_out),
        total: currencyNumber(stay.total_amount),
        status: stay.status === 'checked_out' ? 'checked-out' : 'checked-in',
        }
      }),
      expenses: expenses.map((expense) => ({
        date: formatDate(expense.expense_date),
        description: expense.description,
        category: expense.category,
        value: currencyNumber(expense.amount),
        status: expenseStatus(expense.status),
      })),
    }
  },
  createReservation: createSupabaseReservation,
}

