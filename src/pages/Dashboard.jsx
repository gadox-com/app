import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MapPin, RefreshCw, AlertCircle, ChevronRight, Clock, Beef } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimalModal from '../components/AnimalModal'

const FAZENDAS = [
  { key: 'SARANDI', label: 'Sarandi' },
  { key: 'CASA', label: 'Casa' },
  { key: 'CAPANEMA', label: 'Capanema' },
]

const CATEGORIAS_ORDER = ['BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI']

function contarCategorias(lista) {
  const map = {}
  lista.forEach(a => { map[a.categoria] = (map[a.categoria] || 0) + 1 })
  return CATEGORIAS_ORDER
    .filter(c => map[c])
    .map(c => `${map[c]} ${c.charAt(0) + c.slice(1).toLowerCase()}`)
    .join(' · ')
}

export default function Dashboard({ onNavigate }) {
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalAnimal, setModalAnimal] = useState({ open: false, data: null })

  useEffect(() => { fetchData() }, [])

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

  if (loading) return <div className="p-6 lg:p-8"><LoadingSpinner text="Carregando..." /></div>
  if (error) return (
    <div className="p-6 lg:p-8">
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
  const totalVendas = vendidos.reduce((s, a) => s + (a.preco_venda || 0), 0)

  const recentes = [...animais]
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 8)

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const metricas = [
    { label: 'Total', value: animais.length, color: 'text-gray-900' },
    { label: 'Ativos', value: ativos.length, color: 'text-green-600' },
    { label: 'Vendidos', value: vendidos.length, color: 'text-gray-400' },
    { label: 'Machos', value: machos.length, color: 'text-blue-600' },
    { label: 'Fêmeas', value: femeas.length, color: 'text-pink-500' },
    { label: 'Bezerros', value: bezerros.length, color: 'text-orange-500' },
    { label: 'Novilhos', value: novilhos.length, color: 'text-gray-700' },
    { label: 'Vacas', value: vacas.length, color: 'text-gray-700' },
    { label: 'Touros', value: touros.length, color: 'text-gray-700' },
    { label: 'Bois', value: bois.length, color: 'text-gray-700' },
    { label: 'Total Vendas', value: totalVendas > 0 ? `R$ ${totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '—', color: 'text-green-700' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral do rebanho</p>
        </div>
        <button onClick={fetchData} className="btn-secondary p-2">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Totais gerais */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Beef size={15} className="text-orange-500" />
          <span className="text-sm font-bold text-gray-900">Totais do Rebanho</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-x-4 gap-y-4">
          {metricas.map(m => (
            <div key={m.label} className="text-center">
              <div className={`text-2xl font-bold leading-tight ${m.color}`}>{m.value}</div>
              <div className="text-xs text-gray-400 mt-0.5 font-medium">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards por fazenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {FAZENDAS.map(({ key, label }) => {
          const lista = ativos.filter(a => a.local === key)
          const ultimos = [...lista]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 6)
          const resumo = contarCategorias(lista)

          return (
            <div key={key} className="card flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-orange-500" />
                    <span className="font-bold text-gray-900 text-sm">{label}</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-500">{lista.length}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {resumo || 'Nenhum animal ativo'}
                </p>
              </div>

              {/* Lista */}
              <div className="flex-1 divide-y divide-gray-50">
                {ultimos.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-gray-400">
                    Nenhum animal nesta fazenda
                  </div>
                ) : (
                  ultimos.map(animal => (
                    <button
                      key={animal.id}
                      onClick={() => setModalAnimal({ open: true, data: animal })}
                      className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-gray-400 w-8 flex-shrink-0">#{animal.brinco}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{animal.raca}</div>
                          <div className="text-xs text-gray-400">{animal.categoria} · {animal.sexo === 'MACHO' ? 'Macho' : 'Fêmea'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {animal.peso && (
                          <span className="text-xs font-semibold text-gray-600">{animal.peso} kg</span>
                        )}
                        <ChevronRight size={13} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Ver todos */}
              {lista.length > 6 && (
                <button
                  onClick={() => onNavigate('animais')}
                  className="px-5 py-3 border-t border-gray-100 text-xs font-semibold text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors text-center"
                >
                  Ver todos os {lista.length} animais →
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Últimas alterações */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-orange-500" />
            <span className="font-bold text-gray-900 text-sm">Últimas Alterações</span>
          </div>
          <button onClick={() => onNavigate('animais')} className="text-xs text-orange-500 hover:text-orange-600 font-semibold">
            Ver todos →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recentes.map(animal => (
            <button
              key={animal.id}
              onClick={() => setModalAnimal({ open: true, data: animal })}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-gray-400 w-10 flex-shrink-0">#{animal.brinco}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{animal.raca} · {animal.categoria}</div>
                  <div className="text-xs text-gray-400">
                    {animal.local} · {animal.sexo}
                    {animal.peso ? ` · ${animal.peso} kg` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${animal.status === 'ATIVO' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {animal.status}
                  </span>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(animal.updated_at || animal.created_at)}</div>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimalModal
        isOpen={modalAnimal.open}
        onClose={() => setModalAnimal({ open: false, data: null })}
        animal={modalAnimal.data}
        onSaved={fetchData}
      />
    </div>
  )
}
