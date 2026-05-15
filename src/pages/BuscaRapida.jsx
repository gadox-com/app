import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Search, X, ChevronRight, MapPin, Weight, Calendar } from 'lucide-react'
import AnimalPerfil from '../components/AnimalPerfil'

function calcularCategoria(nascimento, sexo) {
  if (!nascimento) return null
  const meses = Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
  const m = sexo === 'MACHO'
  if (meses <= 12) return m ? 'BEZERRO' : 'BEZERRA'
  if (meses <= 24) return m ? 'NOVILHO' : 'NOVILHA'
  if (meses <= 36) return m ? 'BOI' : 'VACA'
  return m ? 'TOURO' : 'VACA'
}

const idade = (nascimento) => {
  if (!nascimento) return null
  const m = Math.floor((new Date() - new Date(nascimento)) / (1000 * 60 * 60 * 24 * 30.5))
  return m < 24 ? `${m}m` : `${Math.floor(m / 12)}a`
}

export default function BuscaRapida({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [todos, setTodos] = useState([])
  const [carregou, setCarregou] = useState(false)
  const [perfilId, setPerfilId] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('animais')
        .select('id, brinco, raca, sexo, nascimento, peso, local, status, confinado, matriz, categoria, cor')
        .order('brinco')
      setTodos(data || [])
      setCarregou(true)
    }
    load()
    setTimeout(() => inputRef.current?.focus(), 400)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResultados([]); return }
    const q = query.trim().toLowerCase()
    const norm = (b) => String(parseInt(b, 10) || b.toLowerCase())
    const found = todos.filter(a =>
      norm(String(a.brinco)).startsWith(norm(q)) ||
      String(a.brinco).toLowerCase().includes(q)
    ).slice(0, 20)
    setResultados(found)
  }, [query, todos])

  const limpar = () => { setQuery(''); setResultados([]); inputRef.current?.focus() }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">

        {/* TOPO — metade laranja com campo de busca */}
        <div className="flex-shrink-0 relative" style={{
          background: 'linear-gradient(160deg, #f97316 0%, #fb923c 100%)',
          paddingTop: 'env(safe-area-inset-top, 16px)',
        }}>
          {/* Círculos decorativos */}
          <div style={{ position:'absolute', width:220, height:220, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.12)', top:-80, right:-60, pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)', top:20, right:60, pointerEvents:'none' }} />

          <div className="px-5 pt-6 pb-8 relative z-10">
            {/* Header */}
            <div className="mb-6">
              <p className="text-orange-200 text-xs font-semibold uppercase tracking-widest mb-1">GadoX</p>
              <h1 className="text-white text-3xl font-black tracking-tight leading-none">Busca Rápida</h1>
              <p className="text-orange-200 text-sm mt-1">
                {carregou ? `${todos.length} animais carregados` : 'Carregando...'}
              </p>
            </div>

            {/* Campo de busca */}
            <div className="relative">
              <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 pointer-events-none" />
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full pl-12 pr-12 py-4 text-2xl font-black font-mono rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-orange-200 focus:outline-none focus:bg-white/30 focus:border-white/60 transition-all"
                placeholder="Digite o brinco..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
                style={{ caretColor: 'white' }}
              />
              {query && (
                <button onClick={limpar} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-200 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Contagem de resultados */}
            {query && (
              <p className="text-orange-200 text-xs mt-2.5 ml-1">
                {resultados.length === 0
                  ? 'Nenhum animal encontrado'
                  : `${resultados.length} animal${resultados.length > 1 ? 'is' : ''} encontrado${resultados.length > 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          {/* Curva na base do header */}
          <div style={{
            position: 'absolute', bottom: -24, left: 0, right: 0, height: 48,
            background: '#f8f9fa', borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            zIndex: 1,
          }} />
        </div>

        {/* CORPO — resultados */}
        <div className="flex-1 overflow-y-auto bg-gray-50 pt-4 pb-24">

          {/* Estado inicial */}
          {!query && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 pb-16">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-5">
                <Search size={32} className="text-orange-300" />
              </div>
              <p className="text-lg font-bold text-gray-400">Digite o número do brinco</p>
              <p className="text-sm text-gray-300 mt-1">A busca é instantânea</p>
            </div>
          )}

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="px-4 space-y-3">
              {resultados.map(animal => {
                const cat = calcularCategoria(animal.nascimento, animal.sexo) || animal.categoria
                const ativo = animal.status === 'ATIVO'
                const id = idade(animal.nascimento)

                return (
                  <button
                    key={animal.id}
                    onClick={() => setPerfilId(animal.id)}
                    className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left transition-all active:scale-95"
                  >
                    {/* Linha topo */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-2xl font-black text-gray-900">#{animal.brinco}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {ativo ? '● Ativo' : '○ Inativo'}
                        </span>
                        {animal.confinado && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Confinado</span>}
                      </div>
                      <ChevronRight size={18} className="text-orange-300 flex-shrink-0" />
                    </div>

                    {/* Raça + categoria + sexo + cor */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="text-sm font-bold text-gray-800">{animal.raca}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm font-bold text-orange-500">{cat}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{animal.sexo === 'MACHO' ? '♂' : '♀'}</span>
                      {animal.cor && <><span className="text-gray-300">·</span><span className="text-sm text-gray-400">{animal.cor}</span></>}
                    </div>

                    {/* Grid de info */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-orange-50 rounded-xl p-2.5">
                        <div className="text-[9px] font-bold text-orange-300 uppercase tracking-wider mb-0.5 flex items-center gap-0.5"><MapPin size={8} /> Local</div>
                        <div className="text-sm font-black text-gray-800">{animal.local || '—'}</div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2.5">
                        <div className="text-[9px] font-bold text-orange-300 uppercase tracking-wider mb-0.5 flex items-center gap-0.5"><Weight size={8} /> Peso</div>
                        <div className="text-sm font-black text-gray-800">{animal.peso ? `${animal.peso}kg` : '—'}</div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2.5">
                        <div className="text-[9px] font-bold text-orange-300 uppercase tracking-wider mb-0.5 flex items-center gap-0.5"><Calendar size={8} /> Idade</div>
                        <div className="text-sm font-black text-gray-800">{id || '—'}</div>
                      </div>
                    </div>

                    {animal.matriz && (
                      <div className="mt-2.5 text-xs text-gray-400">
                        Matriz: <span className="font-mono font-bold text-gray-600">#{animal.matriz}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Não encontrado */}
          {query && resultados.length === 0 && carregou && (
            <div className="flex flex-col items-center justify-center h-48 text-center px-8">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-base font-bold text-gray-400">Brinco {query} não encontrado</p>
              <p className="text-sm text-gray-300 mt-1">Verifique o número</p>
            </div>
          )}
        </div>
      </div>

      {/* Perfil completo ao clicar */}
      <AnimalPerfil
        isOpen={!!perfilId}
        onClose={() => setPerfilId(null)}
        animalId={perfilId}
        onSaved={() => {}}
      />
    </>
  )
}
