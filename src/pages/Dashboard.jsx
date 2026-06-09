import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, AlertCircle, ChevronRight, ArrowUpRight, Beef, TrendingUp, Package, Plus, Bell, Syringe, X } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimalModal from '../components/AnimalModal'
import AnimalPerfil from '../components/AnimalPerfil'


const CATEGORIAS_ORDER = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']

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
          <div className="text-xs text-orange-200 mt-0.5">{animais.length ? ((ativos.length / animais.length) * 100).toFixed(0) : 0}% do rebanho</div>
        </div>

        {/* Vendidos */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <Package size={16} className="text-gray-500 mb-3" />
          <div className="text-4xl font-bold text-gray-500 leading-none">{vendidos.length}</div>
          <div className="text-sm font-semibold text-gray-500 mt-1">Vendidos</div>
          <div className="text-xs text-gray-500 mt-0.5">saídas registradas</div>
        </div>

        {/* Total */}
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <Beef size={16} className="text-orange-400 mb-3" />
          <div className="text-4xl font-bold text-gray-900 leading-none">{animais.length}</div>
          <div className="text-sm font-semibold text-gray-700 mt-1">Total do Rebanho</div>
          <div className="text-xs text-gray-500 mt-0.5">animais cadastrados</div>
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

      {/* Sexo + Confinados + Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Sexo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Distribuição por Sexo</p>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Machos</span>
                <span className="text-sm font-bold text-gray-900">{machos.length} <span className="text-xs font-normal text-gray-500">({pctMachos}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-300 rounded-full transition-all" style={{ width: `${pctMachos}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Fêmeas</span>
                <span className="text-sm font-bold text-gray-900">{femeas.length} <span className="text-xs font-normal text-gray-500">({pctFemeas}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: `${pctFemeas}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Confinados / Soltos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Confinamento</p>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Confinados</span>
                <span className="text-sm font-bold text-gray-900">{confinados.length} <span className="text-xs font-normal text-gray-500">({ativos.length ? ((confinados.length/ativos.length)*100).toFixed(0) : 0}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" style={{ width: ativos.length ? `${(confinados.length/ativos.length)*100}%` : '0%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">Soltos</span>
                <span className="text-sm font-bold text-gray-900">{soltos.length} <span className="text-xs font-normal text-gray-500">({ativos.length ? ((soltos.length/ativos.length)*100).toFixed(0) : 0}%)</span></span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: ativos.length ? `${(soltos.length/ativos.length)*100}%` : '0%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por Categoria</p>
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
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards por fazenda — só contagem */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Animais por Fazenda</p>
        <div className="grid grid-cols-3 gap-4">
          {locais.length === 0 ? (
            <div className="col-span-3 text-center py-6 text-gray-400 text-sm">Nenhum local cadastrado — cadastre em Fazendas</div>
          ) : locais.map((nome) => {
            const lista = ativos.filter(a => a.local === nome)
            const cats = CATEGORIAS_ORDER
              .map(c => ({ cat: c, count: lista.filter(a => a.categoria === c).length }))
              .filter(x => x.count > 0)
            return (
              <div key={nome} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-gray-900">{nome.charAt(0) + nome.slice(1).toLowerCase()}</span>
                  <span className="text-2xl font-black text-orange-500">{lista.length}</span>
                </div>
                {cats.length === 0
                  ? <p className="text-xs text-gray-500">Nenhum animal ativo</p>
                  : <div className="space-y-1.5">
                      {cats.map(({ cat, count }) => (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                          <span className="text-xs font-bold text-gray-800">{count}</span>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )
          })}
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