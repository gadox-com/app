import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Beef, TrendingUp, ShoppingCart, Weight, MapPin, Tag, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const COLORS = ['#F97316', '#374151', '#6B7280', '#D1D5DB', '#FED7AA', '#FB923C', '#9CA3AF']

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const { data: animais, error } = await supabase
        .from('animais')
        .select('*')

      if (error) throw error

      const ativos = animais.filter(a => a.status === 'ATIVO')
      const vendidos = animais.filter(a => a.status === 'VENDIDO')
      const comPeso = ativos.filter(a => a.peso)
      const pesoMedio = comPeso.length
        ? comPeso.reduce((sum, a) => sum + (a.peso || 0), 0) / comPeso.length
        : 0

      // Por categoria
      const porCategoria = {}
      ativos.forEach(a => {
        porCategoria[a.categoria] = (porCategoria[a.categoria] || 0) + 1
      })
      const categoriaData = Object.entries(porCategoria).map(([name, value]) => ({ name, value }))

      // Por local
      const porLocal = {}
      ativos.forEach(a => {
        porLocal[a.local] = (porLocal[a.local] || 0) + 1
      })
      const localData = Object.entries(porLocal).map(([name, value]) => ({ name, value }))

      setData({ total: animais.length, ativos: ativos.length, vendidos: vendidos.length, pesoMedio, categoriaData, localData })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="p-6 lg:p-8">
      <LoadingSpinner text="Carregando dashboard..." />
    </div>
  )

  if (error) return (
    <div className="p-6 lg:p-8">
      <div className="card p-8 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-900 mb-1">Erro ao conectar com Supabase</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <p className="text-xs text-gray-400">Verifique o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY</p>
      </div>
    </div>
  )

  const metrics = [
    { label: 'Total de Animais', value: data.total, icon: Beef, color: 'text-gray-900', bg: 'bg-gray-50' },
    { label: 'Animais Ativos', value: data.ativos, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Vendidos', value: data.vendidos, icon: ShoppingCart, color: 'text-gray-500', bg: 'bg-gray-50' },
    { label: 'Peso Médio (kg)', value: data.pesoMedio.toFixed(1), icon: Weight, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do rebanho</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="card p-5">
              <div className={`w-9 h-9 ${m.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className={m.color} />
              </div>
              <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{m.label}</div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por Categoria */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={15} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Animais por Categoria</h3>
          </div>
          {data.categoriaData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nenhum dado disponível</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.categoriaData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(v) => [v, 'Animais']}
                />
                <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por Local */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={15} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Distribuição por Local</h3>
          </div>
          {data.localData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nenhum dado disponível</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.localData}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {data.localData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(v) => [v, 'Animais']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Cadastrar Animal', page: 'animais', color: 'bg-orange-500 text-white' },
          { label: 'Ver Confinamento', page: 'confinamento', color: 'bg-white text-gray-700 border border-gray-200' },
          { label: 'Reprodução', page: 'reproducao', color: 'bg-white text-gray-700 border border-gray-200' },
          { label: 'Relatórios', page: 'relatorios', color: 'bg-white text-gray-700 border border-gray-200' },
        ].map(item => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`${item.color} rounded-xl p-3.5 text-sm font-semibold text-left hover:opacity-90 transition-opacity`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
