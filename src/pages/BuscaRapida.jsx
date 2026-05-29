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

  // Listener para abrir animal por brinco (ex: clique na matriz)
  useEffect(() => {
    const openByBrinco = async (e) => {
      const norm = String(parseInt(e.detail, 10))
      const found = todos.find(a => String(parseInt(a.brinco, 10)) === norm)
      if (found) setPerfilId(found.id)
    }
    document.addEventListener('openAnimalByBrinco', openByBrinco)
    return () => document.removeEventListener('openAnimalByBrinco', openByBrinco)
  }, [todos])

  useEffect(() => {
    async function load() {
      let all = [], from = 0
      while (true) {
        const { data } = await supabase
          .from('animais')
          .select('id, brinco, raca, sexo, nascimento, peso, local, status, confinado, matriz, categoria, cor')
          .order('brinco')
          .range(from, from + 999)
        all = [...all, ...(data || [])]
        if (!data || data.length < 1000) break
        from += 1000
      }
      setTodos(all)
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
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

        {/* HEADER — estilo Apple */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100">
          {/* Barra superior com título */}
          <div className="px-8 pt-8 pb-4">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Rebanho</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Busca Rápida</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {carregou ? `${todos.length} animais disponíveis` : 'Carregando...'}
            </p>
          </div>

          {/* Campo de busca — estilo iOS */}
          <div className="px-6 pb-5">
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full pl-11 pr-11 py-3.5 text-xl font-black font-mono rounded-2xl bg-gray-100 border-0 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                placeholder="Número do brinco..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
              />
              {query && (
                <button onClick={limpar} className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center transition-colors hover:bg-gray-500">
                  <X size={11} className="text-white" />
                </button>
              )}
            </div>
            {query && (
              <p className="text-xs text-gray-500 mt-2 ml-1">
                {resultados.length === 0 ? 'Nenhum resultado' : `${resultados.length} resultado${resultados.length > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="flex-1 overflow-y-auto">

          {/* Estado vazio */}
          {!query && (
            <div className="flex flex-col items-center justify-center h-full pb-20">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                <Search size={24} className="text-orange-300" />
              </div>
              <p className="text-base font-semibold text-gray-500">Digite o brinco</p>
              <p className="text-sm text-gray-500 mt-1">A busca acontece enquanto você digita</p>
            </div>
          )}

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="px-6 py-4 space-y-2 pb-24">
              {resultados.map((animal, idx) => {
                const cat = calcularCategoria(animal.nascimento, animal.sexo) || animal.categoria
                const ativo = animal.status === 'ATIVO'
                const id = idade(animal.nascimento)

                return (
                  <button
                    key={animal.id}
                    onClick={() => setPerfilId(animal.id)}
                    className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left transition-all hover:border-orange-200 hover:shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        {/* Número do brinco em destaque */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xl font-black text-gray-900 leading-none">
                            #{animal.brinco}
                          </span>
                          {animal.descarte && (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
                              <svg width="8" height="10" viewBox="0 0 10 12" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0h10v8L5 6 0 8V0z"/>
                                <rect x="0" y="0" width="1.5" height="12" fill="#ef4444"/>
                              </svg>
                              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Descarte</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {ativo ? '● Ativo' : '○ Inativo'}
                          </span>
                          {animal.confinado && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Conf.</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-500" />
                    </div>

                    {/* Raça + categoria */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <span className="text-sm font-bold text-gray-800">{animal.raca}</span>
                      <span className="text-gray-500 text-sm">·</span>
                      <span className="text-sm font-semibold text-orange-500">{cat}</span>
                      <span className="text-gray-500 text-sm">·</span>
                      <span className="text-sm text-gray-500">{animal.sexo === 'MACHO' ? '♂' : '♀'}</span>
                      {animal.cor && <><span className="text-gray-500 text-sm">·</span><span className="text-sm text-gray-500">{animal.cor}</span></>}
                    </div>

                    {/* Pills de info */}
                    <div className="flex gap-2 flex-wrap">
                      {animal.local && (
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                          <MapPin size={10} className="text-gray-500" />
                          <span className="text-xs font-semibold text-gray-600">{animal.local}</span>
                        </div>
                      )}
                      {animal.peso && (
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                          <Weight size={10} className="text-gray-500" />
                          <span className="text-xs font-semibold text-gray-600">{animal.peso} kg</span>
                        </div>
                      )}
                      {id && (
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                          <Calendar size={10} className="text-gray-500" />
                          <span className="text-xs font-semibold text-gray-600">{id}</span>
                        </div>
                      )}
                      {animal.matriz && (
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                          <span className="text-xs text-gray-500">Mãe</span>
                          <span className="text-xs font-mono font-bold text-gray-600">#{animal.matriz}</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Não encontrado */}
          {query && resultados.length === 0 && carregou && (
            <div className="flex flex-col items-center justify-center h-48 text-center px-8">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-base font-semibold text-gray-500">Brinco {query} não encontrado</p>
              <p className="text-sm text-gray-500 mt-1">Verifique o número</p>
            </div>
          )}
        </div>
      </div>

      <AnimalPerfil
        isOpen={!!perfilId}
        onClose={() => setPerfilId(null)}
        animalId={perfilId}
        onSaved={() => {}}
      />
    </>
  )
}
