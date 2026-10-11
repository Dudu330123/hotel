import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileBarChart,
  Home,
  Hotel,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Settings,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { demoUser, mockDashboardDataSource } from './data/mockData'
import { getAuthenticatedUserProfile, supabaseDashboardDataSource } from './data/supabaseDataSource'
import { LoginPage } from './components/LoginPage'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { DashboardData, NavKey, NewReservationInput, ReservationSummary, RoomOption, Status } from './types/dashboard'

const navItems: Array<{ key: NavKey; label: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { key: 'reservas', label: 'Reservas', icon: CalendarDays },
  { key: 'hospedagens', label: 'Hospedagens', icon: BedDouble },
  { key: 'quartos', label: 'Quartos', icon: Hotel },
  { key: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
  { key: 'despesas', label: 'Despesas', icon: Receipt },
  { key: 'relatorios', label: 'Relatórios', icon: FileBarChart },
  { key: 'configuracoes', label: 'Configurações', icon: Settings },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const navTitle: Record<NavKey, string> = {
  dashboard: 'Painel de controle',
  reservas: 'Reservas',
  hospedagens: 'Hospedagens',
  quartos: 'Quartos',
  pagamentos: 'Pagamentos',
  despesas: 'Despesas',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações',
}

function App() {
  const [activeNav, setActiveNav] = useState<NavKey>('dashboard')
  const [period, setPeriod] = useState('01/04/2025 a 30/04/2025')
  const [currentUser, setCurrentUser] = useState(demoUser)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [dataRevision, setDataRevision] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    let isCurrent = true
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!isCurrent) return
      setSessionUserId(sessionData.session?.user.id ?? null)
      setAuthReady(true)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user.id ?? null)
      if (!session) setCurrentUser(demoUser)
    })

    return () => {
      isCurrent = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!sessionUserId) {
      setCurrentUser(demoUser)
      return
    }

    getAuthenticatedUserProfile().then((profile) => {
      if (profile) setCurrentUser(profile)
    })
  }, [sessionUserId])

  useEffect(() => {
    if (!authReady) return

    let isCurrent = true
    setIsLoading(true)
    const dataSource = sessionUserId ? supabaseDashboardDataSource : mockDashboardDataSource
    dataSource.getDashboardData({ period }).then((dashboardData) => {
      if (isCurrent) {
        setData(dashboardData)
        setIsLoading(false)
      }
    }).catch(() => {
      if (isCurrent) {
        setData(null)
        setIsLoading(false)
        setNotice('Não foi possível carregar os dados do Supabase.')
      }
    })

    return () => {
      isCurrent = false
    }
  }, [authReady, period, sessionUserId, dataRevision])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const handleSignOut = async () => {
    if (!supabase) {
      setNotice('O protótipo está em modo demonstração.')
      return
    }
    await supabase.auth.signOut()
  }

  const handleNav = (key: NavKey) => {
    setActiveNav(key)
    if (key !== 'dashboard') {
      setNotice(`${navTitle[key]} está preparado para a próxima etapa do protótipo.`)
    }
  }

  const handleSaveReservation = async (input: NewReservationInput) => {
    const dataSource = sessionUserId ? supabaseDashboardDataSource : mockDashboardDataSource
    const result = await dataSource.createReservation(input)
    setIsReservationOpen(false)
    setDataRevision((revision) => revision + 1)
    setNotice(sessionUserId ? `Reserva ${result.code} criada e salva no Supabase.` : `Reserva ${result.code} criada no modo demonstração.`)
  }

  if (isSupabaseConfigured && !authReady) {
    return <div className="grid min-h-screen place-items-center bg-[#f4f7fb] text-sm font-semibold text-[#31516e]">Carregando acesso seguro...</div>
  }

  if (isSupabaseConfigured && !sessionUserId) {
    return <LoginPage />
  }

  return (
    <div className="flex min-h-screen min-w-0 bg-[#f4f7fb] text-[#10253f]">
      <Sidebar activeNav={activeNav} onNavigate={handleNav} user={currentUser} onSignOut={handleSignOut} />
      <main className="min-w-0 flex-1">
        <TopBar
          user={currentUser}
          onSearch={() => setIsSearchOpen(true)}
          onNotification={() => setNotice('Você está em dia: nenhuma nova notificação.')}
          onProfile={() => setNotice(`Perfil de ${currentUser.name} — dados vindos do Supabase quando houver login.`)}
        />
        {activeNav === 'dashboard' ? (
          <DashboardPage
            data={data}
            isLoading={isLoading}
            period={period}
            onPeriodChange={setPeriod}
            onNewReservation={() => setIsReservationOpen(true)}
            onNotice={setNotice}
          />
        ) : (
          <ModulePlaceholder activeNav={activeNav} onBack={() => setActiveNav('dashboard')} />
        )}
      </main>
      {isReservationOpen && (
        <NewReservationModal
          roomOptions={data?.roomOptions ?? []}
          onClose={() => setIsReservationOpen(false)}
          onSave={handleSaveReservation}
        />
      )}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
      {notice && <Toast message={notice} onClose={() => setNotice(null)} />}
    </div>
  )
}

export default App

function Sidebar({ activeNav, onNavigate, user, onSignOut }: { activeNav: NavKey; onNavigate: (key: NavKey) => void; user: typeof demoUser; onSignOut: () => void }) {
  return (
    <aside className="sidebar sticky top-0 flex h-screen w-[252px] shrink-0 flex-col bg-[#071d32] px-4 py-5 text-slate-300 max-[1200px]:w-[84px] max-[1200px]:px-3">
      <div className="flex items-center gap-3 px-3 pb-8">
        <div className="grid size-10 place-items-center rounded-[14px] bg-[#18b7a0] text-white shadow-lg shadow-[#18b7a0]/20">
          <Hotel size={22} strokeWidth={2.3} />
        </div>
        <div className="sidebar-wordmark">
          <div className="text-[15px] font-extrabold tracking-tight text-white">Hotel Aurora</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Gestão de hospedagens</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ key, label, icon: Icon }) => {
          const active = activeNav === key
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`sidebar-compact-nav group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition max-[1200px]:justify-center max-[1200px]:px-2 ${active ? 'bg-[#0b74c9] text-white shadow-lg shadow-[#0b74c9]/25' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
              <span className="sidebar-label">{label}</span>
              {key === 'pagamentos' && <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">3</span>}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <div className="sidebar-user-copy mb-4 flex items-center gap-3 px-2">
          <div className="grid size-9 place-items-center rounded-full bg-[#e9f0f8] text-[12px] font-extrabold text-[#0c5f9c]">{user.initials}</div>
          <div className="min-w-0">
            <div className="truncate text-[12px] font-bold text-white">{user.name}</div>
            <div className="text-[11px] text-slate-400">{user.role}</div>
          </div>
        </div>
        <button className="sidebar-compact-nav flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-400 transition hover:bg-white/8 hover:text-white max-[1200px]:justify-center max-[1200px]:px-2" onClick={onSignOut}>
          <LogOut size={17} />
          <span className="sidebar-logout-label">Sair da conta</span>
        </button>
      </div>
    </aside>
  )
}

function TopBar({ user, onSearch, onNotification, onProfile }: { user: typeof demoUser; onSearch: () => void; onNotification: () => void; onProfile: () => void }) {
  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[#e4eaf2] bg-white px-8 max-[1200px]:px-4">
      <div className="flex items-center gap-3">
        <button className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Abrir menu"><Menu size={20} /></button>
        <button onClick={onSearch} className="flex h-10 w-[330px] items-center gap-3 rounded-xl border border-[#e4eaf2] bg-[#fbfcfe] px-3.5 text-left text-xs text-slate-400 transition hover:border-[#a9bacd] max-[1200px]:w-[220px]">
          <Search size={16} />
          Buscar por nome, telefone ou código...
          <span className="ml-auto rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">⌘ K</span>
        </button>
      </div>
      <div className="flex items-center gap-5">
        <button onClick={onNotification} className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#0b74c9]" aria-label="Notificações">
          <Bell size={19} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#f59e0b] ring-2 ring-white" />
        </button>
        <div className="h-7 w-px bg-[#e7edf4]" />
        <button onClick={onProfile} className="flex items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-slate-50">
          <div className="grid size-9 place-items-center rounded-full bg-[#ddecfb] text-xs font-extrabold text-[#0b74c9]">{user.initials}</div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-[#10253f]">{user.name}</div>
            <div className="text-[11px] text-slate-400">{user.role}</div>
          </div>
          <ChevronDown size={15} className="text-slate-400" />
        </button>
      </div>
    </header>
  )
}

function DashboardPage({ data, isLoading, period, onPeriodChange, onNewReservation, onNotice }: { data: DashboardData | null; isLoading: boolean; period: string; onPeriodChange: (period: string) => void; onNewReservation: () => void; onNotice: (message: string) => void }) {
  const selectedDate = period === 'Últimos 7 dias' ? 'Últimos 7 dias' : period === 'Próximos 30 dias' ? 'Próximos 30 dias' : '01/04/2025 a 30/04/2025'

  return (
    <div className="page-enter px-8 py-7 max-[1200px]:px-4 max-[1200px]:py-5">
      <div className="mx-auto max-w-[1460px]">
        <div className="mb-7 flex items-start justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0b74c9]"><Sparkles size={14} /> Visão geral</div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-[#10253f]">Painel de controle</h1>
            <p className="mt-1.5 text-sm text-slate-500">Acompanhe a ocupação, o faturamento e a situação financeira do seu hotel.</p>
          </div>
          <div className="flex items-center gap-3 max-[1200px]:flex-col max-[1200px]:items-end">
            <label className="flex h-11 items-center gap-2 rounded-xl border border-[#dce5ef] bg-white px-3.5 text-xs font-semibold text-[#3f5770] shadow-sm shadow-slate-900/[0.02]">
              <CalendarDays size={17} className="text-[#0b74c9]" />
              <select value={selectedDate} onChange={(event) => onPeriodChange(event.target.value)} className="max-w-[170px] bg-transparent outline-none">
                <option>01/04/2025 a 30/04/2025</option>
                <option>Últimos 7 dias</option>
                <option>Próximos 30 dias</option>
              </select>
              <ChevronDown size={15} className="text-slate-400" />
            </label>
            <button onClick={onNewReservation} className="flex h-11 items-center gap-2 rounded-xl bg-[#0b74c9] px-4 text-xs font-bold text-white shadow-lg shadow-[#0b74c9]/20 transition hover:bg-[#095fa5] active:scale-[0.98]"><Plus size={17} /> Nova reserva</button>
          </div>
        </div>

        {isLoading || !data ? <DashboardSkeleton /> : <>
          <MetricsGrid data={data} />
          <div className="mt-5 grid grid-cols-[1.04fr_1.25fr_1.25fr] gap-5 max-[1200px]:grid-cols-1">
            <OccupancyCard data={data} />
            <RevenueCard data={data} />
            <OccupancyTrendCard data={data} />
          </div>
          <div className="mt-5 grid grid-cols-[1.42fr_1fr] gap-5 max-[1200px]:grid-cols-1">
            <ReservationsCard reservations={data.reservations} onNotice={onNotice} />
            <AlertsCard onNotice={onNotice} />
          </div>
          <div className="mt-5 grid grid-cols-[1.42fr_1fr] gap-5 max-[1200px]:grid-cols-1">
            <StaysCard stays={data.stays} />
            <ExpensesCard expenses={data.expenses} />
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#b9e7df] bg-[#edfbf8] px-5 py-4 text-xs text-[#356f69]">
            <div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-full bg-white text-[#12a88d] shadow-sm"><Sparkles size={16} /></div><span><strong className="text-[#177d71]">Dica:</strong> mantenha suas informações sempre atualizadas para ter um controle financeiro mais preciso.</span></div>
            <button onClick={() => onNotice('Dica dispensada nesta demonstração.')} className="rounded-lg p-1.5 text-[#65a99f] hover:bg-white"><X size={15} /></button>
          </div>
        </>}
      </div>
    </div>
  )
}

function MetricsGrid({ data }: { data: DashboardData }) {
  const metrics = [
    { label: 'Total de hospedagens', value: String(data.metrics.totalStays), delta: 'ao vivo', note: 'no período', icon: BedDouble, tone: 'blue', up: true },
    { label: 'Reservas futuras', value: String(data.metrics.futureReservations), delta: 'ao vivo', note: 'próximos 30 dias', icon: CalendarDays, tone: 'purple', up: true },
    { label: 'Faturamento bruto', value: formatCurrency(data.metrics.grossRevenue), delta: 'ao vivo', note: 'no período', icon: CircleDollarSign, tone: 'green', up: true },
    { label: 'Total recebido', value: formatCurrency(data.metrics.totalReceived), delta: 'ao vivo', note: 'no período', icon: WalletCards, tone: 'orange', up: true },
    { label: 'Pendências', value: formatCurrency(data.metrics.pendingAmount), delta: 'ao vivo', note: 'a receber', icon: AlertTriangle, tone: 'red', up: false },
  ]

  const tones: Record<string, { icon: string; bg: string }> = {
    blue: { icon: 'text-[#0b74c9]', bg: 'bg-[#eaf4ff]' },
    purple: { icon: 'text-[#7958d8]', bg: 'bg-[#f0ecff]' },
    green: { icon: 'text-[#0eae8c]', bg: 'bg-[#e8faf4]' },
    orange: { icon: 'text-[#ec9911]', bg: 'bg-[#fff5df]' },
    red: { icon: 'text-[#e55656]', bg: 'bg-[#ffebeb]' },
  }

  return <div className="grid grid-cols-5 gap-4 max-[1200px]:grid-cols-2">
    {metrics.map((metric) => {
      const Icon = metric.icon
      const tone = tones[metric.tone]
      return <div key={metric.label} className="rounded-2xl border border-[#e3eaf2] bg-white p-4 shadow-[0_4px_18px_rgba(20,52,83,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(20,52,83,0.07)]">
        <div className="flex items-start justify-between gap-2"><div className={`grid size-9 place-items-center rounded-xl ${tone.bg} ${tone.icon}`}><Icon size={19} /></div><button className="rounded-md p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-500"><MoreHorizontal size={17} /></button></div>
        <div className="mt-4 text-[12px] font-semibold text-slate-500">{metric.label}</div>
        <div className="mt-1 text-[21px] font-extrabold tracking-[-0.035em] text-[#10253f]">{metric.value}</div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold"><span className={metric.up ? 'text-[#16a47f]' : 'text-[#e45555]'}>{metric.up ? <ArrowUpRight size={13} className="inline" /> : <ArrowDownRight size={13} className="inline" />} {metric.delta}</span><span className="font-medium text-slate-400">{metric.note}</span></div>
      </div>
    })}
  </div>
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3"><div><h2 className="text-[14px] font-extrabold text-[#18324d]">{title}</h2>{subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}</div>{action}</div>
}

function OccupancyCard({ data }: { data: DashboardData }) {
  const chartData = [{ name: 'Ocupados', value: data.occupancy.occupied, color: '#17ab8e' }, { name: 'Disponíveis', value: data.occupancy.available, color: '#d8e2ec' }, { name: 'Manutenção', value: data.occupancy.maintenance, color: '#f5a623' }]
  return <div className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><CardHeader title="Taxa de ocupação" subtitle="Quartos ocupados x disponíveis" /><div className="mt-3 flex items-center gap-3"><div className="relative h-[148px] w-[148px] shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={70} paddingAngle={2} startAngle={90} endAngle={-270} stroke="none">{chartData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 grid place-content-center text-center"><strong className="text-[28px] font-extrabold tracking-[-0.06em] text-[#10253f]">{data.occupancy.percentage}%</strong><span className="text-[10px] font-semibold text-slate-400">ocupação</span></div></div><div className="flex-1 space-y-4">{chartData.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]"><div className="flex items-center gap-2 text-slate-500"><span className="size-2.5 rounded-full" style={{ background: item.color }} />{item.name}</div><strong className="text-[#213b56]">{item.value}</strong></div>)}</div></div></div>
}

function RevenueCard({ data }: { data: DashboardData }) {
  return <div className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><CardHeader title="Faturamento por tipo de quarto" subtitle="Total acumulado no período" action={<button className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-50"><MoreHorizontal size={17} /></button>} /><div className="mt-4 h-[164px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.revenueByRoomType} margin={{ top: 3, right: 4, left: -24, bottom: 0 }} barCategoryGap="26%"><CartesianGrid vertical={false} stroke="#edf1f6" /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#8a9aad', fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#9aa8b8', fontSize: 9 }} tickFormatter={(value) => `R$${value / 1000}k`} /><Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f5f8fb' }} /><Bar dataKey="value" radius={[5, 5, 0, 0]}>{data.revenueByRoomType.map((item) => <Cell key={item.name} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div></div>
}

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value?: number; payload?: { name?: string } }> }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><div className="text-[10px] font-semibold text-slate-400">{payload[0].payload?.name}</div><div className="mt-0.5 text-xs font-extrabold text-[#17324d]">{formatCurrency(Number(payload[0].value ?? 0))}</div></div>
}

function OccupancyTrendCard({ data }: { data: DashboardData }) {
  return <div className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><CardHeader title="Ocupação dos quartos" subtitle="Acompanhamento diário" action={<div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#16ab8d]" />Ocupados</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#b7c3d0]" />Disponíveis</span></div>} /><div className="mt-4 h-[164px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.occupancyTrend} margin={{ top: 4, right: 2, left: -25, bottom: 0 }}><defs><linearGradient id="occupiedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16ab8d" stopOpacity={0.2} /><stop offset="100%" stopColor="#16ab8d" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f6" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#9aa8b8', fontSize: 9 }} interval={2} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#9aa8b8', fontSize: 9 }} /><Tooltip content={<TrendTooltip />} /><Area type="monotone" dataKey="occupied" stroke="#16ab8d" strokeWidth={2.4} fill="url(#occupiedFill)" dot={false} /><Line type="monotone" dataKey="available" stroke="#b7c3d0" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div></div>
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><div className="text-[10px] font-semibold text-slate-400">{label}</div>{payload.map((item) => <div key={item.name} className="mt-1 flex items-center justify-between gap-4 text-[11px] font-bold text-[#17324d]"><span>{item.name === 'occupied' ? 'Ocupados' : 'Disponíveis'}</span><span>{item.value}</span></div>)}</div>
}

function ReservationsCard({ reservations, onNotice }: { reservations: ReservationSummary[]; onNotice: (message: string) => void }) {
  return <div className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><CardHeader title="Próximas reservas" subtitle="Acompanhe as chegadas previstas" action={<button onClick={() => onNotice('A lista completa de reservas estará disponível na próxima etapa.')} className="text-[11px] font-bold text-[#0b74c9] hover:underline">Ver todas <span aria-hidden="true">→</span></button>} /><div className="mt-4 overflow-hidden rounded-xl border border-[#edf1f5]"><table className="w-full border-collapse text-left"><thead className="bg-[#f8fafc] text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><tr><th className="px-3 py-3">Entrada</th><th className="px-3 py-3">Hóspede</th><th className="px-3 py-3">Quarto</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Valor</th><th className="px-3 py-3">Status</th><th className="px-2 py-3" /></tr></thead><tbody className="divide-y divide-[#edf1f5]">{reservations.map((item) => <tr key={item.code} className="text-[11px] text-slate-600 transition hover:bg-[#fbfdff]"><td className="whitespace-nowrap px-3 py-3 font-semibold text-[#314b66]">{item.checkIn}</td><td className="px-3 py-3"><div className="font-bold text-[#18324d]">{item.guest}</div><div className="mt-0.5 text-[10px] text-slate-400">{item.code} · {item.origin}</div></td><td className="px-3 py-3 font-semibold">{item.room}</td><td className="px-3 py-3">{item.roomType}</td><td className="px-3 py-3 font-bold text-[#314b66]">{formatCurrency(item.value)}</td><td className="px-3 py-3"><StatusPill status={item.status} /></td><td className="px-2 py-3"><button onClick={() => onNotice(`Reserva ${item.code} selecionada.`)} className="rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600"><MoreHorizontal size={15} /></button></td></tr>)}</tbody></table></div></div>
}

function AlertsCard({ onNotice }: { onNotice: (message: string) => void }) {
  const alerts = [
    { icon: AlertTriangle, tone: 'red', title: 'Pagamentos pendentes', body: '3 reservas precisam de acompanhamento', action: 'Ver pagamentos' },
    { icon: Sparkles, tone: 'yellow', title: 'Quartos aguardando limpeza', body: '2 quartos prontos para inspeção', action: 'Ver quartos' },
    { icon: Clock3, tone: 'blue', title: 'Próximos check-ins', body: '4 chegadas previstas para hoje', action: 'Abrir agenda' },
  ]
  const tones: Record<string, string> = { red: 'bg-[#fff0ef] text-[#e25b5b]', yellow: 'bg-[#fff6e3] text-[#e7a21e]', blue: 'bg-[#eaf4ff] text-[#1675c2]' }
  return <div className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><CardHeader title="Alertas e tarefas" subtitle="O que precisa da sua atenção hoje" /><div className="mt-4 space-y-2.5">{alerts.map((alert) => { const Icon = alert.icon; return <button key={alert.title} onClick={() => onNotice(alert.action)} className="flex w-full items-center gap-3 rounded-xl border border-[#edf1f5] p-3 text-left transition hover:border-[#cdd9e6] hover:bg-[#fbfdff]"><div className={`grid size-9 shrink-0 place-items-center rounded-xl ${tones[alert.tone]}`}><Icon size={17} /></div><div className="min-w-0 flex-1"><div className="text-[11px] font-extrabold text-[#23405c]">{alert.title}</div><div className="mt-1 truncate text-[10px] text-slate-400">{alert.body}</div></div><span className="text-slate-300">›</span></button> })}</div><div className="mt-4 rounded-xl bg-[#f8fafc] p-3 text-[10px] leading-relaxed text-slate-500"><strong className="text-[#36526d]">Prioridade do dia:</strong> confirme os pagamentos das reservas com entrada nas próximas 24 horas.</div></div>
}

function StaysCard({ stays }: { stays: DashboardData['stays'] }) {
  return <div className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><CardHeader title="Últimas hospedagens" subtitle="Histórico recente de estadias" action={<button className="text-[11px] font-bold text-[#0b74c9] hover:underline">Ver todas <span aria-hidden="true">→</span></button>} /><div className="mt-4 overflow-hidden rounded-xl border border-[#edf1f5]"><table className="w-full border-collapse text-left"><thead className="bg-[#f8fafc] text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><tr><th className="px-3 py-3">Código</th><th className="px-3 py-3">Hóspede</th><th className="px-3 py-3">Check-in</th><th className="px-3 py-3">Quarto</th><th className="px-3 py-3">Diárias</th><th className="px-3 py-3">Total</th></tr></thead><tbody className="divide-y divide-[#edf1f5]">{stays.map((stay) => <tr key={stay.code} className="text-[11px] text-slate-600 transition hover:bg-[#fbfdff]"><td className="px-3 py-3 font-bold text-[#31516e]">{stay.code}</td><td className="px-3 py-3 font-bold text-[#18324d]">{stay.guest}</td><td className="px-3 py-3">{stay.checkIn}</td><td className="px-3 py-3">{stay.room}</td><td className="px-3 py-3">{stay.days}</td><td className="px-3 py-3 font-bold text-[#314b66]">{formatCurrency(stay.total)}</td></tr>)}</tbody></table></div></div>
}

function ExpensesCard({ expenses }: { expenses: DashboardData['expenses'] }) {
  return <div className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><CardHeader title="Despesas do mês" subtitle="Últimos lançamentos" action={<button className="text-[11px] font-bold text-[#0b74c9] hover:underline">Ver todas <span aria-hidden="true">→</span></button>} /><div className="mt-4 overflow-hidden rounded-xl border border-[#edf1f5]"><table className="w-full border-collapse text-left"><thead className="bg-[#f8fafc] text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"><tr><th className="px-3 py-3">Descrição</th><th className="px-3 py-3">Categoria</th><th className="px-3 py-3">Valor</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y divide-[#edf1f5]">{expenses.map((expense) => <tr key={expense.description} className="text-[11px] text-slate-600 transition hover:bg-[#fbfdff]"><td className="px-3 py-3"><div className="font-bold text-[#18324d]">{expense.description}</div><div className="mt-0.5 text-[10px] text-slate-400">{expense.date}</div></td><td className="px-3 py-3">{expense.category}</td><td className="px-3 py-3 font-bold text-[#314b66]">{formatCurrency(expense.value)}</td><td className="px-3 py-3"><StatusPill status={expense.status === 'paid' ? 'paid' : 'pending'} /></td></tr>)}</tbody></table></div></div>
}

function StatusPill({ status }: { status: Status }) {
  const styles: Record<Status, { label: string; className: string }> = {
    confirmed: { label: 'Confirmada', className: 'bg-[#e7f8ef] text-[#169566]' },
    pending: { label: 'Pendente', className: 'bg-[#fff4d9] text-[#c98813]' },
    cancelled: { label: 'Cancelada', className: 'bg-[#ffebeb] text-[#dd5c5c]' },
    reserved: { label: 'Reservada', className: 'bg-[#e9f3ff] text-[#287cc1]' },
    paid: { label: 'Pago', className: 'bg-[#e7f8ef] text-[#169566]' },
    partial: { label: 'Parcial', className: 'bg-[#fff4d9] text-[#c98813]' },
    unpaid: { label: 'Pendente', className: 'bg-[#ffebeb] text-[#dd5c5c]' },
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status].className}`}>{styles[status].label}</span>
}

function DashboardSkeleton() {
  return <div className="animate-pulse"><div className="grid grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[154px] rounded-2xl bg-white" />)}</div><div className="mt-5 grid grid-cols-3 gap-5">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-[250px] rounded-2xl bg-white" />)}</div><div className="mt-5 h-[300px] rounded-2xl bg-white" /></div>
}

function ModulePlaceholder({ activeNav, onBack }: { activeNav: NavKey; onBack: () => void }) {
  const config: Record<NavKey, { icon: typeof Home; description: string; items: string[] }> = {
    dashboard: { icon: LayoutDashboard, description: '', items: [] },
    reservas: { icon: CalendarDays, description: 'Centralize reservas, origens, status e datas de entrada e saída.', items: ['Calendário de disponibilidade', 'Lista de reservas', 'Nova reserva'] },
    hospedagens: { icon: BedDouble, description: 'Acompanhe check-ins, check-outs e hóspedes presentes.', items: ['Chegadas de hoje', 'Saídas de hoje', 'Hóspedes em casa'] },
    quartos: { icon: Hotel, description: 'Visualize a situação dos quartos e tarefas de limpeza.', items: ['Livres', 'Ocupados', 'Limpeza e manutenção'] },
    pagamentos: { icon: CreditCard, description: 'Organize recebimentos, pendências e formas de pagamento.', items: ['Recebidos', 'Em aberto', 'Resumo da quitação'] },
    despesas: { icon: Receipt, description: 'Registre despesas operacionais por categoria e status.', items: ['Despesas do mês', 'Categorias', 'Novo lançamento'] },
    relatorios: { icon: FileBarChart, description: 'Reúna indicadores para acompanhar a operação do hotel.', items: ['Ocupação', 'Faturamento', 'Origem das reservas'] },
    configuracoes: { icon: Settings, description: 'Ajuste hotel, usuários, permissões e preferências.', items: ['Dados do hotel', 'Usuários', 'Permissões'] },
  }
  const page = config[activeNav]
  const Icon = page.icon
  return <div className="page-enter px-8 py-7"><div className="mx-auto max-w-[1460px]"><div className="flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0b74c9]"><Icon size={14} /> Módulo do sistema</div><h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-[#10253f]">{navTitle[activeNav]}</h1><p className="mt-1.5 text-sm text-slate-500">{page.description}</p></div><button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-[#dce5ef] bg-white px-4 py-2.5 text-xs font-bold text-[#31516e] shadow-sm hover:bg-slate-50">Voltar ao painel</button></div><div className="mt-7 grid grid-cols-3 gap-5">{page.items.map((item, index) => <div key={item} className="rounded-2xl border border-[#e3eaf2] bg-white p-5 shadow-[0_4px_18px_rgba(20,52,83,0.035)]"><div className="grid size-10 place-items-center rounded-xl bg-[#eaf4ff] text-[#0b74c9]"><span className="text-sm font-extrabold">0{index + 1}</span></div><h2 className="mt-5 text-sm font-extrabold text-[#18324d]">{item}</h2><p className="mt-2 text-xs leading-relaxed text-slate-400">Essa área será conectada ao Supabase depois da validação do protótipo.</p><div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#0b74c9]">Preparado para próxima fase <span>→</span></div></div>)}</div><div className="mt-5 rounded-2xl border border-dashed border-[#bfd0e1] bg-[#f9fbfd] p-10 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-[#0b74c9] shadow-sm"><Sparkles size={21} /></div><h2 className="mt-4 text-base font-extrabold text-[#18324d]">Protótipo em evolução</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">O layout deste módulo está preparado. Depois da aprovação visual do painel, vamos transformar esta área em uma tela completa com dados e ações reais.</p></div></div></div>
}

function NewReservationModal({ roomOptions, onClose, onSave }: { roomOptions: RoomOption[]; onClose: () => void; onSave: (input: NewReservationInput) => Promise<void> }) {
  const today = new Date()
  const defaultCheckIn = today.toISOString().slice(0, 10)
  const defaultCheckOut = new Date(today.getTime() + 86400000).toISOString().slice(0, 10)
  const [form, setForm] = useState({ fullName: '', phone: '', checkIn: defaultCheckIn, checkOut: defaultCheckOut, roomId: '', origin: 'Balcão', adults: '1', children: '0' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedRoom = roomOptions.find((room) => room.id === form.roomId)
  const nights = Math.max(1, Math.ceil((new Date(`${form.checkOut}T12:00:00`).getTime() - new Date(`${form.checkIn}T12:00:00`).getTime()) / 86400000))
  const totalAmount = selectedRoom ? selectedRoom.basePrice * nights : 0
  const setField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!form.fullName.trim()) {
      setError('Informe o nome do hóspede.')
      return
    }
    if (!form.checkIn || !form.checkOut || form.checkOut <= form.checkIn) {
      setError('A data de saída deve ser posterior à entrada.')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        fullName: form.fullName,
        phone: form.phone,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        roomId: form.roomId || null,
        origin: form.origin,
        totalAmount,
        adults: Math.max(1, Number(form.adults) || 1),
        children: Math.max(0, Number(form.children) || 0),
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar a reserva.')
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="fixed inset-0 z-40 grid place-items-center bg-[#071d32]/45 p-6 backdrop-blur-[2px]"><div className="w-full max-w-[610px] rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0b74c9]"><Plus size={14} /> Nova reserva</div><h2 className="text-xl font-extrabold text-[#10253f]">Adicionar uma reserva</h2><p className="mt-1 text-xs text-slate-500">Os dados serão salvos no Supabase quando houver uma sessão autenticada.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Fechar"><X size={18} /></button></div><form onSubmit={handleSubmit} className="mt-6"><div className="grid grid-cols-2 gap-4"><Field label="Nome do hóspede" placeholder="Ex.: Ana Souza" value={form.fullName} onChange={(value) => setField('fullName', value)} /><Field label="Telefone" placeholder="(00) 00000-0000" value={form.phone} onChange={(value) => setField('phone', value)} /><Field label="Check-in" type="date" value={form.checkIn} onChange={(value) => setField('checkIn', value)} /><Field label="Check-out" type="date" value={form.checkOut} onChange={(value) => setField('checkOut', value)} /><Field label="Quarto" placeholder="Sem quarto definido" select value={form.roomId} onChange={(value) => setField('roomId', value)} options={[{ value: '', label: 'Sem quarto definido' }, ...roomOptions.map((room) => ({ value: room.id, label: `${room.number} · ${room.roomType} — ${formatCurrency(room.basePrice)}/noite` }))]} /><Field label="Origem" select value={form.origin} onChange={(value) => setField('origin', value)} options={['WhatsApp', 'Telefone', 'Booking', 'Site', 'Balcão'].map((origin) => ({ value: origin, label: origin }))} /><Field label="Adultos" type="number" value={form.adults} onChange={(value) => setField('adults', value)} /><Field label="Crianças" type="number" value={form.children} onChange={(value) => setField('children', value)} /></div><div className="mt-4 flex items-center justify-between rounded-xl bg-[#f5f9fd] px-4 py-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Resumo da reserva</div><div className="mt-1 text-xs font-semibold text-[#31516e]">{nights} {nights === 1 ? 'diária' : 'diárias'}{selectedRoom ? ` · Quarto ${selectedRoom.number}` : ''}</div></div><strong className="text-lg font-extrabold text-[#10253f]">{formatCurrency(totalAmount)}</strong></div>{error && <div className="mt-4 rounded-xl border border-[#ffd3d3] bg-[#fff3f3] px-3 py-2.5 text-xs font-semibold text-[#c74d4d]">{error}</div>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-[#0b74c9] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#0b74c9]/20 hover:bg-[#095fa5] disabled:cursor-wait disabled:opacity-60"><Check size={15} /> {isSaving ? 'Salvando...' : 'Salvar reserva'}</button></div></form></div></div>
}

function Field({ label, placeholder, type = 'text', value, onChange, select, options }: { label: string; placeholder?: string; type?: string; value: string; onChange: (value: string) => void; select?: boolean; options?: Array<{ value: string; label: string }> }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#3b5772]">{label}</span>{select ? <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce5ef] bg-white px-3 text-xs text-slate-600 outline-none transition focus:border-[#0b74c9]">{placeholder && <option value="" disabled>{placeholder}</option>}{options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} min={type === 'number' ? 0 : undefined} className="h-10 w-full rounded-xl border border-[#dce5ef] bg-white px-3 text-xs text-slate-600 outline-none transition placeholder:text-slate-300 focus:border-[#0b74c9]" />}</label>
}

function SearchModal({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-40 bg-[#071d32]/35 p-6 backdrop-blur-[2px]" onMouseDown={onClose}><div className="mx-auto mt-[14vh] w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#e3eaf2] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-[#edf1f5] px-4 py-3"><Search size={18} className="text-[#0b74c9]" /><input autoFocus className="min-w-0 flex-1 text-sm text-[#18324d] outline-none" placeholder="Buscar hóspede, reserva ou quarto..." /><kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">ESC</kbd></div><div className="p-4"><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Sugestões rápidas</div><div className="grid grid-cols-2 gap-2">{['Ana Souza · R0018', 'Carlos Lima · 201', 'Quarto 305 · Suíte', 'Pagamento pendente'].map((item) => <button key={item} onClick={onClose} className="rounded-xl border border-[#edf1f5] px-3 py-3 text-left text-xs font-semibold text-[#31516e] hover:border-[#b9d7ee] hover:bg-[#f7fbff]">{item}</button>)}</div></div></div></div>
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="fixed bottom-6 right-6 z-50 flex max-w-[370px] items-center gap-3 rounded-2xl bg-[#102c47] px-4 py-3 text-xs font-semibold text-white shadow-2xl"><div className="grid size-7 place-items-center rounded-full bg-[#18b7a0]"><Check size={14} /></div><span className="flex-1">{message}</span><button onClick={onClose} className="rounded-md p-1 text-slate-300 hover:bg-white/10 hover:text-white"><X size={14} /></button></div>
}

