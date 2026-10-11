import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Hotel, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

type AuthMode = 'sign-in' | 'sign-up'

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return

    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() || email.split('@')[0] } },
        })

    setIsSubmitting(false)
    if (result.error) {
      setError(result.error.message)
      return
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Conta criada. Confira seu e-mail para confirmar o acesso.')
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7fb] px-5 py-10 text-[#10253f]">
      <section className="grid w-full max-w-[980px] overflow-hidden rounded-[28px] border border-[#e3eaf2] bg-white shadow-[0_24px_70px_rgba(20,52,83,0.12)] md:grid-cols-[0.92fr_1.08fr]">
        <div className="relative overflow-hidden bg-[#071d32] px-8 py-10 text-white md:px-10 md:py-12">
          <div className="absolute -right-20 -top-24 size-64 rounded-full bg-[#0b74c9]/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-[#18b7a0] shadow-lg shadow-[#18b7a0]/20"><Hotel size={23} /></div>
              <div><div className="text-[15px] font-extrabold">Hotel Aurora</div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Gestão de hospedagens</div></div>
            </div>
            <div className="mt-24 max-w-sm md:mt-32">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#55d8c3]">Acesso interno</p>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.04em]">Organize a operação do hotel em um só lugar.</h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">Reservas, hospedagens, quartos e financeiro com uma visão clara para a equipe.</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-10 md:px-12 md:py-12">
          <div className="max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0b74c9]">{mode === 'sign-in' ? 'Bem-vindo de volta' : 'Primeiro acesso'}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#10253f]">{mode === 'sign-in' ? 'Entrar no painel' : 'Criar conta de acesso'}</h2>
            <p className="mt-2 text-sm text-slate-500">{mode === 'sign-in' ? 'Use seu e-mail de trabalho para continuar.' : 'Crie o usuário inicial para testar o sistema.'}</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {mode === 'sign-up' && <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#3b5772]">Nome completo</span><div className="relative"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={name} onChange={(event) => setName(event.target.value)} required className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#0b74c9]" placeholder="Ex.: Mariana Silva" /></div></label>}
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#3b5772]">E-mail</span><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#0b74c9]" placeholder="voce@hotel.com" /></div></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#3b5772]">Senha</span><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} type="password" className="h-11 w-full rounded-xl border border-[#dce5ef] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#0b74c9]" placeholder="Mínimo de 6 caracteres" /></div></label>
              {error && <div className="rounded-xl border border-[#ffd4d4] bg-[#fff4f4] px-3 py-2.5 text-xs font-semibold text-[#c94d4d]">{error}</div>}
              {message && <div className="rounded-xl border border-[#b9e7df] bg-[#edfbf8] px-3 py-2.5 text-xs font-semibold text-[#177d71]">{message}</div>}
              <button disabled={isSubmitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b74c9] text-sm font-bold text-white shadow-lg shadow-[#0b74c9]/20 transition hover:bg-[#095fa5] disabled:cursor-wait disabled:opacity-70">{isSubmitting ? <LoaderCircle className="animate-spin" size={17} /> : <>{mode === 'sign-in' ? 'Entrar no painel' : 'Criar conta'}<ArrowRight size={17} /></>}</button>
            </form>

            <button onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(null); setMessage(null) }} className="mt-6 text-xs font-bold text-[#0b74c9] hover:underline">{mode === 'sign-in' ? 'Ainda não tenho uma conta' : 'Já tenho uma conta'}</button>
          </div>
        </div>
      </section>
    </main>
  )
}

