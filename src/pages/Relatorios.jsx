import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart3, Download, FileText, Filter, RefreshCw } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Relatorios() {
  const [animais, setAnimais] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filters, setFilters] = useState({
    tipo: 'animais',
    status: 'Todos',
    local: 'Todos',
    categoria: 'Todas',
  })

  useEffect(() => { fetchAnimais() }, [])

  async function fetchAnimais() {
    setLoading(true)
    let all = []
    let from = 0
    while (true) {
      const { data } = await supabase.from('animais').select('*').order('brinco').range(from, from + 999)
      all = [...all, ...(data || [])]
      if (!data || data.length < 1000) break
      from += 1000
    }
    setAnimais(all)
    setLoading(false)
  }

  function applyFilters(list) {
    let r = [...list]
    if (filters.status !== 'Todos') r = r.filter(a => a.status === filters.status)
    if (filters.local !== 'Todos') r = r.filter(a => a.local === filters.local)
    if (filters.categoria !== 'Todas') r = r.filter(a => a.categoria === filters.categoria)
    return r
  }

  const filtered = applyFilters(animais)

  function exportCSV() {
    const headers = ['Brinco', 'Sexo', 'Raça', 'Categoria', 'Local', 'Nascimento', 'Peso (kg)', 'Data Peso', 'Status', 'Data Saída', 'Valor Venda', 'Motivo Saída', 'Observação']
    const rows = filtered.map(a => [
      a.brinco, a.sexo, a.raca, a.categoria, a.local,
      a.nascimento || '', a.peso || '', a.data_peso || '',
      a.status, a.saida || '', a.preco_venda || '',
      a.motivo_saida || '', (a.observacao || '').replace(/,/g, ';'),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fazenda-sao-bras-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 14
      const colW = (pageW - margin * 3) / 2  // duas colunas com margem entre elas
      const hoje = new Date().toLocaleDateString('pt-BR')
      const dataISO = new Date().toISOString().split('T')[0]

      // ── Função para desenhar cabeçalho em cada página ──
      function drawHeader(doc) {
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('FAZENDA SÃO BRÁS', margin, 12)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text('Controle de Gado', margin, 17)
        doc.text(`Emitido em: ${hoje}   Total: ${filtered.length} animais`, margin, 21)
        // linha separadora
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.3)
        doc.line(margin, 24, pageW - margin, 24)
      }

      // ── Dividir em duas colunas por página ──
      // Cada coluna tem sua própria tabela
      const leftData = []
      const rightData = []
      filtered.forEach((a, i) => {
        const row = [
          a.brinco,
          a.sexo === 'MACHO' ? 'M' : 'F',
          a.raca,
          a.categoria,
          a.local,
        ]
        if (i % 2 === 0) leftData.push(row)
        else rightData.push(row)
      })

      const tableStyle = {
        styles: {
          fontSize: 9,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.15,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },  // Brinco
          1: { cellWidth: 8,  halign: 'center' },                      // S
          2: { cellWidth: 'auto' },                                     // Raça
          3: { cellWidth: 22 },                                         // Categoria
          4: { cellWidth: 22 },                                         // Local
        },
        tableWidth: colW,
        rowPageBreak: 'avoid',
        showHead: 'everyPage',
      }

      const head = [['Brinco', 'S', 'Raça', 'Categoria', 'Local']]

      // Coluna esquerda
      drawHeader(doc)
      autoTable(doc, {
        ...tableStyle,
        head,
        body: leftData,
        startY: 28,
        margin: { left: margin, right: margin + colW + margin },
        didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(doc) },
      })

      // Coluna direita — mesma página, mesma startY
      const leftFinalY = doc.lastAutoTable.finalY
      autoTable(doc, {
        ...tableStyle,
        head,
        body: rightData,
        startY: 28,
        margin: { left: margin + colW + margin, right: margin },
        didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(doc) },
      })

      // Rodapé em todas as páginas
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' })
        doc.text('Fazenda São Brás — Controle de Gado', margin, pageH - 6)
      }

      doc.save(`fazenda-sao-bras-${dataISO}.pdf`)
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  // Summary stats
  const stats = (() => {
    const comPeso = filtered.filter(a => a.peso && a.status === 'ATIVO')
    const pesoTotal = comPeso.reduce((s, a) => s + a.peso, 0)
    const pesoMedio = comPeso.length ? pesoTotal / comPeso.length : 0

    const porCategoria = {}
    filtered.filter(a => a.status === 'ATIVO').forEach(a => {
      porCategoria[a.categoria] = (porCategoria[a.categoria] || 0) + 1
    })

    return { pesoMedio: pesoMedio.toFixed(1), pesoTotal: pesoTotal.toFixed(0), porCategoria }
  })()

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Exporte e analise os dados do rebanho</p>
        </div>
        <button onClick={fetchAnimais} className="btn-secondary p-2">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={15} className="text-orange-500" />
              <span className="font-semibold text-gray-900 text-sm">Filtros</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Status</label>
                <select className="input-field text-sm" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                  {['Todos', 'ATIVO', 'VENDIDO'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Local</label>
                <select className="input-field text-sm" value={filters.local} onChange={e => setFilters(f => ({ ...f, local: e.target.value }))}>
                  {['Todos', 'SARANDI', 'CASA', 'CAPANEMA', 'VENDIDO'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Categoria</label>
                <select className="input-field text-sm" value={filters.categoria} onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}>
                  {['Todas', 'BEZERRO', 'BEZERRA', 'NOVILHO', 'NOVILHA', 'VACA', 'TOURO', 'BOI'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Download size={15} className="text-orange-500" />
              <span className="font-semibold text-gray-900 text-sm">Exportar</span>
            </div>
            <div className="space-y-2">
              <button onClick={exportCSV} className="btn-secondary w-full justify-center">
                <FileText size={15} />
                Exportar CSV
              </button>
              <button onClick={exportPDF} disabled={generating} className="btn-primary w-full justify-center">
                <Download size={15} />
                {generating ? 'Gerando PDF...' : 'Exportar PDF'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">{filtered.length} registros serão exportados</p>
          </div>
        </div>

        {/* Preview / Stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={15} className="text-orange-500" />
              <span className="font-semibold text-gray-900 text-sm">Resumo do Filtro</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{filtered.length}</div>
                <div className="text-xs text-gray-500">Total Animais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{stats.pesoMedio} kg</div>
                <div className="text-xs text-gray-500">Peso Médio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.pesoTotal} kg</div>
                <div className="text-xs text-gray-500">Peso Total</div>
              </div>
            </div>

            {/* Por categoria */}
            {Object.keys(stats.porCategoria).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Por Categoria (ativos)</div>
                <div className="space-y-2">
                  {Object.entries(stats.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                    const total = Object.values(stats.porCategoria).reduce((s, v) => s + v, 0)
                    const pct = ((count / total) * 100).toFixed(0)
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cat}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Preview table */}
          {loading ? <LoadingSpinner /> : (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Prévia dos dados</span>
                <span className="text-xs text-gray-400">{filtered.length > 10 ? `Mostrando 10 de ${filtered.length}` : `${filtered.length} registros`}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Brinco', 'Raça', 'Cat.', 'Local', 'Peso', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.slice(0, 10).map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-900">{a.brinco}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{a.raca}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{a.categoria}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{a.local}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{a.peso ? `${a.peso} kg` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={a.status === 'ATIVO' ? 'badge-ativo text-xs' : 'badge-vendido text-xs'}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
