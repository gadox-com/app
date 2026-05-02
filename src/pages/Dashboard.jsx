import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, AlertCircle, ChevronRight, ArrowUpRight, Beef, TrendingUp, Package } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimalModal from '../components/AnimalModal'
import AnimalPerfil from '../components/AnimalPerfil'

const FAZENDAS = [
  { key: 'SARANDI', label: 'Sarandi' },
  { key: 'CASA', label: 'Casa' },
  { key: 'CAPANEMA', label: 'Capanema' },
]

const CATEGORIAS_ORDER = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']

export default function Dashboard({ onNavigate }) {
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [perfilId, setPerfilId] = useState(null)
  const [logs, setLogs] = useState([])

  const [userName, setUserName] = useState('')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  useEffect(() => { fetchData() }, [])
  useEffect(() => { fetchLogs() }, [])
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
          <p className="text-sm text-gray-400">{greeting}{userName ? `, ${userName}` : ''}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Fazenda São Brás</h1>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Total — destaque laranja */}
        <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-orange-400 text-white">
          <Beef size={16} className="text-orange-200 mb-3" />
          <div className="text-4xl font-bold leading-none">{animais.length}</div>
          <div className="text-sm font-semibold mt-1 text-white/90">Total do Rebanho</div>
          <div className="text-xs text-orange-200 mt-0.5">animais cadastrados</div>
        </div>

        {/* Ativos */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <TrendingUp size={16} className="text-orange-400 mb-3" />
          <div className="text-4xl font-bold text-gray-900 leading-none">{ativos.length}</div>
          <div className="text-sm font-semibold text-gray-700 mt-1">Ativos</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {animais.length ? ((ativos.length / animais.length) * 100).toFixed(0) : 0}% do total
          </div>
        </div>

        {/* Vendidos */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <Package size={16} className="text-gray-300 mb-3" />
          <div className="text-4xl font-bold text-gray-400 leading-none">{vendidos.length}</div>
          <div className="text-sm font-semibold text-gray-500 mt-1">Vendidos</div>
          <div className="text-xs text-gray-400 mt-0.5">saídas registradas</div>
        </div>

        {/* Clima — Pinhal de São Bento */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest leading-tight">Pinhal de S. Bento</p>
              <p className="text-xs text-gray-300">Paraná · Brasil</p>
            </div>
            <span className="text-2xl leading-none">{clima ? clima.icon : '🌡️'}</span>
          </div>
          {!clima ? (
            <div className="text-sm text-gray-300 mt-3">Carregando...</div>
          ) : clima.temp !== null ? (
            <>
              <div className="text-4xl font-bold text-gray-900 leading-none mt-2">{clima.temp}°<span className="text-2xl">C</span></div>
              <div className="text-sm text-gray-500 mt-1">{clima.desc}</div>
              {clima.wind !== null && <div className="text-xs text-gray-400 mt-0.5">Vento {clima.wind} km/h</div>}
            </>
          ) : (
            <div className="text-sm text-gray-400 mt-2">Indisponível</div>
          )}
          <p className="text-xs text-gray-300 mt-2 capitalize">{new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })}</p>
        </div>

      </div>

      {/* Sexo + Confinados + Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Sexo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Distribuição por Sexo</p>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Machos</span>
                <span className="text-sm font-bold text-gray-900">{machos.length} <span className="text-xs font-normal text-gray-400">({pctMachos}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-300 rounded-full transition-all" style={{ width: `${pctMachos}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Fêmeas</span>
                <span className="text-sm font-bold text-gray-900">{femeas.length} <span className="text-xs font-normal text-gray-400">({pctFemeas}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: `${pctFemeas}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Confinados / Soltos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Confinamento</p>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Confinados</span>
                <span className="text-sm font-bold text-gray-900">{confinados.length} <span className="text-xs font-normal text-gray-400">({ativos.length ? ((confinados.length/ativos.length)*100).toFixed(0) : 0}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: ativos.length ? `${(confinados.length/ativos.length)*100}%` : '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Soltos</span>
                <span className="text-sm font-bold text-gray-900">{soltos.length} <span className="text-xs font-normal text-gray-400">({ativos.length ? ((soltos.length/ativos.length)*100).toFixed(0) : 0}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: ativos.length ? `${(soltos.length/ativos.length)*100}%` : '0%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Por Categoria</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Bezerros', value: bezerros.length },
              { label: 'Novilhos', value: novilhos.length },
              { label: 'Vacas', value: vacas.length },
              { label: 'Touros', value: touros.length },
              { label: 'Bois', value: bois.length },
            ].map(c => (
              <div key={c.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{c.value}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-tight">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards por fazenda */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Por Fazenda</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {FAZENDAS.map(({ key, label }) => {
            const lista = ativos.filter(a => a.local === key)
            const ultimos = [...lista]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5)
            const cats = CATEGORIAS_ORDER
              .map(c => ({ cat: c, count: lista.filter(a => a.categoria === c).length }))
              .filter(x => x.count > 0)

            return (
              <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{label}</span>
                    <span className="text-2xl font-bold text-orange-500">{lista.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cats.length === 0
                      ? <span className="text-xs text-gray-300">Nenhum ativo</span>
                      : cats.map(({ cat, count }) => (
                        <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                          <span className="font-bold text-gray-700">{count}</span>
                          {cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </span>
                      ))
                    }
                  </div>
                </div>

                {/* Lista */}
                <div className="divide-y divide-gray-50">
                  {ultimos.length === 0
                    ? <div className="px-5 py-5 text-center text-sm text-gray-300">Nenhum animal</div>
                    : ultimos.map(animal => (
                      <button
                        key={animal.id}
                        onClick={() => setPerfilId(animal.id)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <span className="font-mono text-xs text-gray-300 w-6 flex-shrink-0">{animal.brinco}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800">{animal.raca}</span>
                          <span className="text-xs text-gray-400 ml-2">{animal.categoria} · {animal.sexo === 'MACHO' ? '♂' : '♀'}</span>
                        </div>
                        {animal.peso && <span className="text-xs text-gray-400">{animal.peso}kg</span>}
                        <ChevronRight size={13} className="text-gray-200 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                      </button>
                    ))
                  }
                </div>

                {lista.length > 5 && (
                  <button
                    onClick={() => onNavigate('animais')}
                    className="w-full py-2.5 text-xs font-bold text-orange-500 hover:bg-orange-50 transition-colors border-t border-gray-100 text-center"
                  >
                    Ver todos os {lista.length} →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Últimas alterações */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Últimas Alterações</p>
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
                  <span className="text-xs text-gray-400 ml-2 hidden sm:inline">{animal.categoria} · {animal.local}</span>
                  {animal.peso && <span className="text-xs text-gray-400 ml-2 hidden sm:inline">· {animal.peso}kg</span>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full ${
                    animal.status === 'ATIVO' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {animal.status === 'ATIVO' ? 'Ativo' : 'Vendido'}
                  </span>
                  <span className="text-xs text-gray-300 w-6 text-right">{formatRelative(animal.updated_at || animal.created_at)}</span>
                  <ChevronRight size={13} className="text-gray-200 group-hover:text-orange-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Histórico de Atividades ─────────────────────────────── */}
      {logs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Histórico de Atividades</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {logs.map((log) => {
                const usuario = log.usuario_email
                  ? log.usuario_email.split('@')[0]
                  : 'Sistema'
                const inicial = usuario.charAt(0).toUpperCase()
                return (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors">
                    {/* Avatar inicial */}
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {inicial}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-700">{usuario}</span>
                        <span className="text-xs text-gray-400">{log.acao}</span>
                        {log.animal_brinco && (
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            #{log.animal_brinco}
                          </span>
                        )}
                      </div>
                      {log.detalhes && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{log.detalhes}</p>
                      )}
                    </div>
                    {/* Tempo */}
                    <span className="text-[10px] text-gray-300 flex-shrink-0">
                      {(() => {
                        const diff = Math.floor((new Date() - new Date(log.created_at)) / 1000)
                        if (diff < 60) return 'agora'
                        if (diff < 3600) return `${Math.floor(diff/60)}m`
                        if (diff < 86400) return `${Math.floor(diff/3600)}h`
                        if (diff < 604800) return `${Math.floor(diff/86400)}d`
                        return new Date(log.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
                      })()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <AnimalPerfil
        isOpen={!!perfilId}
        onClose={() => setPerfilId(null)}
        animalId={perfilId}
        onSaved={() => { fetchData(); fetchLogs() }}
      />
    </div>
  )
}
