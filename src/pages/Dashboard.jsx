import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, AlertCircle, ChevronRight, ArrowUpRight, ArrowDownRight, TrendingUp, Plus, Syringe } from 'lucide-react'
import IconeGado from '../components/IconeGado.jsx'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimalModal from '../components/AnimalModal'
import AnimalPerfil from '../components/AnimalPerfil'


const CATEGORIAS_ORDER = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']

// Gauge estilo "notch" (arco de 270° com 40 segmentos radiais) — proporção de machos.
function GaugeMachosFemeas({ machos, femeas }) {
  const total = machos + femeas
  const pct = total ? machos / total : 0
  const N = 40
  const active = Math.round(pct * N)
  const cx = 75, cy = 72, r1 = 54, r2 = 68
  const notches = []
  for (let i = 0; i < N; i++) {
    const a = (135 + (i * 270) / (N - 1)) * (Math.PI / 180)
    notches.push({
      x1: cx + r1 * Math.cos(a), y1: cy + r1 * Math.sin(a),
      x2: cx + r2 * Math.cos(a), y2: cy + r2 * Math.sin(a),
      ativo: i < active,
    })
  }
  return (
    <svg width="150" height="126" viewBox="0 0 150 126">
      {notches.map((n, i) => (
        <line key={i} x1={n.x1} y1={n.y1} x2={n.x2} y2={n.y2}
          stroke={n.ativo ? '#f97316' : '#e2e4e8'} strokeWidth="5" strokeLinecap="round" />
      ))}
      <text x="75" y="76" textAnchor="middle" className="fill-gray-900" fontSize="24" fontWeight="700">
        {Math.round(pct * 100)}%
      </text>
      <text x="75" y="91" textAnchor="middle" className="fill-gray-400" fontSize="10">machos</text>
    </svg>
  )
}

export default function Dashboard({ onNavigate }) {
  // On mobile screens, redirect to Busca Rápida automatically
  useEffect(() => {
    if (window.innerWidth < 1024) {
      onNavigate('busca')
    }
  }, [])

  const [animais, setAnimais] = useState([])
  const [locais, setLocais] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalCadastro, setModalCadastro] = useState(false)
  const [error, setError] = useState(null)
  const [perfilId, setPerfilId] = useState(null)
  const [logs, setLogs] = useState([])
  const [alertas, setAlertas] = useState([])

  const [userName, setUserName] = useState('')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => { fetchData() }, [])
  useEffect(() => { fetchLogs() }, [])
  useEffect(() => { fetchAlertas() }, [])

  async function fetchAlertas() {
    const hoje = new Date().toISOString().split('T')[0]
    const limite = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase
      .from('vacinas')
      .select('*, animais(brinco, raca)')
      .not('proxima_data', 'is', null)
      .lte('proxima_data', limite)
      .order('proxima_data', { ascending: true })
    setAlertas(data || [])
  }

  async function fetchLogs() {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setLogs(data || [])
  }
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email || ''
      const name = email.split('@')[0].split('.')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    })
  }, [])

  const [clima, setClima] = useState(null)
  useEffect(() => {
    // Pinhal de São Bento - PR: lat -26.08, lon -53.79
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-26.08&longitude=-53.79&current=temperature_2m,weathercode,wind_speed_10m&timezone=America/Sao_Paulo')
      .then(r => r.json())
      .then(d => {
        const code = d.current?.weathercode
        const icons = { 0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️', 45:'🌫️', 48:'🌫️', 51:'🌦️', 53:'🌦️', 55:'🌧️', 61:'🌧️', 63:'🌧️', 65:'🌧️', 71:'🌨️', 73:'🌨️', 75:'🌨️', 80:'🌦️', 81:'🌧️', 82:'⛈️', 95:'⛈️', 96:'⛈️', 99:'⛈️' }
        const desc = { 0:'Céu aberto', 1:'Poucas nuvens', 2:'Nublado', 3:'Encoberto', 45:'Névoa', 48:'Névoa', 51:'Garoa leve', 53:'Garoa', 55:'Garoa forte', 61:'Chuva leve', 63:'Chuva', 65:'Chuva forte', 80:'Chuva leve', 81:'Chuva', 82:'Chuva forte', 95:'Trovoada', 96:'Trovoada', 99:'Trovoada' }
        setClima({
          temp: Math.round(d.current?.temperature_2m),
          wind: Math.round(d.current?.wind_speed_10m),
          icon: icons[code] || '🌡️',
          desc: desc[code] || 'Variável',
        })
      }).catch(() => setClima({ temp: null, icon: '🌡️', desc: 'Indisponível', wind: null }))
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      let all = []
      let from = 0
      while (true) {
        const { data, error } = await supabase.from('animais').select('*').range(from, from + 999)
        if (error) throw error
        all = [...all, ...(data || [])]
        if (!data || data.length < 1000) break
        from += 1000
      }
      setAnimais(all)
      // Buscar locais dinâmicos
      const { data: locaisData } = await supabase.from('locais').select('nome').order('nome')
      if (locaisData && locaisData.length > 0) {
        setLocais(locaisData.map(l => l.nome))
      } else {
        // Fallback: locais distintos dos animais cadastrados
        const distintos = [...new Set(all.map(a => a.local).filter(Boolean))].sort()
        setLocais(distintos)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8"><LoadingSpinner text="Carregando..." /></div>
  if (error) return (
    <div className="p-8">
      <div className="card p-8 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-900">{error}</p>
      </div>
    </div>
  )

  const ativos = animais.filter(a => a.status === 'ATIVO')
  const vendidos = animais.filter(a => a.status === 'VENDIDO')
  const machos = ativos.filter(a => a.sexo === 'MACHO')
  const femeas = ativos.filter(a => a.sexo === 'FÊMEA')
  const bezerros = ativos.filter(a => ['BEZERRO', 'BEZERRA'].includes(a.categoria))
  const novilhos = ativos.filter(a => ['NOVILHO', 'NOVILHA'].includes(a.categoria))
  const vacas = ativos.filter(a => a.categoria === 'VACA')
  const touros = ativos.filter(a => a.categoria === 'TOURO')
  const bois = ativos.filter(a => a.categoria === 'BOI')
  const confinados = ativos.filter(a => a.confinado)
  const soltos = ativos.filter(a => !a.confinado)
  const totalVendas = vendidos.reduce((s, a) => s + (a.preco_venda || 0), 0)
  const pctMachos = ativos.length ? Math.round((machos.length / ativos.length) * 100) : 0
  const pctFemeas = ativos.length ? Math.round((femeas.length / ativos.length) * 100) : 0

  // Saídas agrupadas por motivo (venda, morte, etc.) — motivo vazio conta como venda
  const motivos = {}
  vendidos.forEach(a => {
    const m = (a.motivo_saida || 'venda').trim().toLowerCase()
    motivos[m] = (motivos[m] || 0) + 1
  })
  const motivosResumo = Object.entries(motivos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, c]) => `${c} ${m}${c > 1 && !m.endsWith('s') ? 's' : ''}`)
    .join(' · ')

  // Variação do mês: entradas (created_at) menos saídas (saida) no mês corrente
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const entradasMes = animais.filter(a => a.created_at && new Date(a.created_at) >= inicioMes).length
  const saidasMes = vendidos.filter(a => a.saida && new Date(a.saida + 'T12:00:00') >= inicioMes).length
  const deltaMes = entradasMes - saidasMes

  // Evolução dos últimos 12 meses: quantos animais estavam ativos ao fim de cada mês
  const evolucao = []
  for (let i = 11; i >= 0; i--) {
    const fim = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59)
    const count = animais.filter(a => {
      if (!a.created_at || new Date(a.created_at) > fim) return false
      if (a.status === 'ATIVO') return true
      const saidaEm = a.saida ? new Date(a.saida + 'T12:00:00') : (a.updated_at ? new Date(a.updated_at) : null)
      return saidaEm ? saidaEm > fim : false
    }).length
    evolucao.push({ mes: fim.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), count })
  }
  const evolucaoBase = evolucao[0]?.count || 0
  const evolucaoPct = evolucaoBase ? Math.round(((evolucao[11].count - evolucaoBase) / evolucaoBase) * 100) : null

  const categoriasBarras = [
    { label: 'Bezerros', value: bezerros.length },
    { label: 'Novilhos', value: novilhos.length },
    { label: 'Vacas', value: vacas.length },
    { label: 'Touros', value: touros.length },
    { label: 'Bois', value: bois.length },
  ]
  const maxCategoria = Math.max(1, ...categoriasBarras.map(c => c.value))

  const recentes = [...animais]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 8)

  const formatRelative = (d) => {
    if (!d) return '—'
    const diff = Math.floor((new Date() - new Date(d)) / 1000)
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{greeting}{userName ? `, ${userName}` : ''}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">GadoX</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalCadastro(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Cadastrar animal
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-600 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Ativos — destaque laranja */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-orange-400 text-white">
          <TrendingUp size={16} className="text-orange-200 mb-3" />
          <div className="text-4xl font-bold leading-none">{ativos.length}</div>
          <div className="text-sm font-semibold mt-1 text-white/90">Animais Ativos</div>
          <div className="text-xs text-orange-200 mt-0.5">
            {deltaMes >= 0 ? '+' : ''}{deltaMes} este mês · {animais.length ? ((ativos.length / animais.length) * 100).toFixed(0) : 0}% do rebanho
          </div>
        </div>

        {/* Saídas do rebanho */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <ArrowDownRight size={16} className="text-gray-400 mb-3" />
          <div className="text-4xl font-bold text-gray-500 leading-none">{vendidos.length}</div>
          <div className="text-sm font-semibold text-gray-500 mt-1">Saídas do Rebanho</div>
          <div className="text-xs text-gray-500 mt-0.5">{motivosResumo || 'nenhuma saída registrada'}</div>
        </div>

        {/* Total */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <IconeGado size={16} className="text-orange-400 mb-3" />
          <div className="text-4xl font-bold text-gray-900 leading-none">{animais.length}</div>
          <div className="text-sm font-semibold text-gray-700 mt-1">Total do Rebanho</div>
          <div className="text-xs text-gray-500 mt-0.5">{ativos.length} ativos · {vendidos.length} saídas</div>
        </div>

        {/* Clima — Pinhal de São Bento */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest leading-tight">Pinhal de S. Bento</p>
              <p className="text-xs text-gray-500">Paraná · Brasil</p>
            </div>
            <span className="text-2xl leading-none">{clima ? clima.icon : '🌡️'}</span>
          </div>
          {!clima ? (
            <div className="text-sm text-gray-500 mt-3">Carregando...</div>
          ) : clima.temp !== null ? (
            <>
              <div className="text-4xl font-bold text-gray-900 leading-none mt-2">{clima.temp}°<span className="text-2xl">C</span></div>
              <div className="text-sm text-gray-500 mt-1">{clima.desc}</div>
              {clima.wind !== null && <div className="text-xs text-gray-500 mt-0.5">Vento {clima.wind} km/h</div>}
            </>
          ) : (
            <div className="text-sm text-gray-500 mt-2">Indisponível</div>
          )}
          <p className="text-xs text-gray-500 mt-2 capitalize">{new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })}</p>
        </div>

      </div>



      {/* Evolução + Gauge + Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

        {/* Evolução do rebanho */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Evolução do Rebanho</p>
              <p className="text-xs text-gray-400 mt-0.5">Animais ativos · últimos 12 meses</p>
            </div>
            {evolucaoPct !== null && (
              <p className="text-xs">
                <span className={`font-semibold ${evolucaoPct >= 0 ? 'text-green-700' : 'text-red-600'}`}>{evolucaoPct >= 0 ? '+' : ''}{evolucaoPct}%</span>
                <span className="text-gray-400"> vs. {evolucao[0].mes}</span>
              </p>
            )}
          </div>
          <div className="h-48 mt-3 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucao} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="evolucaoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#f0f1f3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#8f96a3' }} axisLine={{ stroke: '#e2e4e8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8f96a3' }} axisLine={false} tickLine={false} width={34} domain={['auto', 'auto']} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [`${v} animais`, 'Ativos']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e4e8', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} fill="url(#evolucaoFill)" dot={false} activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gauge machos × fêmeas */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Machos × Fêmeas</p>
          <p className="text-xs text-gray-400 mt-0.5">Proporção do rebanho ativo</p>
          <div className="flex justify-center my-2 flex-1 items-center">
            <GaugeMachosFemeas machos={machos.length} femeas={femeas.length} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
              <span className="text-xs text-gray-700">Machos</span>
              <span className="ml-auto text-xs font-bold text-gray-900">
                {machos.length} <span className="font-normal text-gray-400">({pctMachos}%)</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
              <span className="text-xs text-gray-700">Fêmeas</span>
              <span className="ml-auto text-xs font-bold text-gray-900">
                {femeas.length} <span className="font-normal text-gray-400">({pctFemeas}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Por categoria */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por Categoria</p>
          <div className="space-y-2.5">
            {categoriasBarras.map(c => (
              <div key={c.label} className="flex items-center gap-2.5">
                <span className="w-16 text-xs text-gray-700 flex-shrink-0">{c.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(c.value / maxCategoria) * 100}%` }} />
                </div>
                <span className="w-7 text-xs font-bold text-gray-900 text-right flex-shrink-0">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Confinamento · Por Fazenda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Confinamento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Confinamento</p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Confinados</span>
                <span className="text-sm font-bold text-gray-900">{confinados.length} <span className="text-xs font-normal text-gray-400">({ativos.length ? ((confinados.length/ativos.length)*100).toFixed(0) : 0}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: ativos.length ? `${(confinados.length/ativos.length)*100}%` : '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Soltos</span>
                <span className="text-sm font-bold text-gray-900">{soltos.length} <span className="text-xs font-normal text-gray-400">({ativos.length ? ((soltos.length/ativos.length)*100).toFixed(0) : 0}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: ativos.length ? `${(soltos.length/ativos.length)*100}%` : '0%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Por Fazenda/Local */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por Fazenda</p>
          {locais.length === 0
            ? <p className="text-xs text-gray-400">Nenhum local cadastrado</p>
            : <div className="space-y-2">
                {locais.map(nome => {
                  const count = ativos.filter(a => a.local === nome).length
                  const pct = ativos.length ? Math.round((count / ativos.length) * 100) : 0
                  return (
                    <div key={nome}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 truncate">{nome.charAt(0) + nome.slice(1).toLowerCase()}</span>
                        <span className="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-orange-200 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </div>

      </div>



      {/* Painel de Alertas */}
      {alertas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Alertas</p>
              <span className="bg-red-100 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">{alertas.length}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {alertas.map(a => {
                const dias = Math.ceil((new Date(a.proxima_data) - new Date()) / (1000 * 60 * 60 * 24))
                const vencida = dias < 0
                const urgente = dias <= 7
                return (
                  <div key={a.id} className={`flex items-center gap-4 px-5 py-3.5 ${vencida ? 'bg-red-50' : urgente ? 'bg-yellow-50' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${vencida ? 'bg-red-100' : urgente ? 'bg-yellow-100' : 'bg-orange-50'}`}>
                      <Syringe size={14} className={vencida ? 'text-red-500' : urgente ? 'text-yellow-600' : 'text-orange-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">#{a.animais?.brinco}</span>
                        <span className="text-sm font-semibold text-gray-900 truncate">{a.nome}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{a.animais?.raca} · próxima dose: {new Date(a.proxima_data).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-xl flex-shrink-0 ${vencida ? 'bg-red-100 text-red-600' : urgente ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-50 text-orange-500'}`}>
                      {vencida ? `Atrasada ${Math.abs(dias)}d` : dias === 0 ? 'Hoje' : `Em ${dias}d`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Últimas alterações */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Últimas Alterações</p>
          <button onClick={() => onNavigate('animais')} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
            Ver todos <ArrowUpRight size={11} />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {recentes.map((animal, i) => (
              <button
                key={animal.id}
                onClick={() => setPerfilId(animal.id)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
              >
                <span className="text-xs text-gray-200 w-4 flex-shrink-0 font-medium">{i + 1}</span>
                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex-shrink-0">
                  {animal.brinco}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900">{animal.raca}</span>
                  <span className="text-xs text-gray-500 ml-2 hidden sm:inline">{animal.categoria} · {animal.local}</span>
                  {animal.peso && <span className="text-xs text-gray-500 ml-2 hidden sm:inline">· {animal.peso}kg</span>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full ${
                    animal.status === 'ATIVO' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {animal.status === 'ATIVO' ? 'Ativo' : 'Vendido'}
                  </span>
                  <span className="text-xs text-gray-500 w-6 text-right">{formatRelative(animal.updated_at || animal.created_at)}</span>
                  <ChevronRight size={13} className="text-gray-200 group-hover:text-orange-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>



      <AnimalPerfil
        isOpen={!!perfilId}
        onClose={() => setPerfilId(null)}
        animalId={perfilId}
        onSaved={() => { fetchData(); fetchLogs() }}
      />
      {modalCadastro && (
        <AnimalModal
          isOpen={modalCadastro}
          onClose={() => setModalCadastro(false)}
          animal={null}
          onSaved={() => { setModalCadastro(false); fetchData() }}
        />
      )}
    </div>
  )
}