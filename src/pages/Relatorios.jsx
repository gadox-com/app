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

      // A4 Landscape
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth() // 297mm
      const pageH = doc.internal.pageSize.getHeight() // 210mm
      const marginX = 10
      const marginTop = 26
      const gap = 8 // espaço entre as duas colunas
      const colW = (pageW - marginX * 2 - gap) / 2 // ~129mm cada coluna

      const hoje = new Date().toLocaleDateString('pt-BR')
      const dataISO = new Date().toISOString().split('T')[0]

      // Widths fixas dentro de cada coluna (total ~129mm)
      const brincoW = 18
      const sexoW   = 8
      const catW    = 28
      const localW  = 24
      const racaW   = colW - brincoW - sexoW - catW - localW // restante

      function drawHeader() {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(0, 0, 0)
        doc.text('FAZENDA SÃO BRÁS', marginX, 10)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(80, 80, 80)
        doc.text(`Controle de Gado  |  Emitido em: ${hoje}  |  Total: ${filtered.length} animais`, marginX, 15)
        doc.setDrawColor(0)
        doc.setLineWidth(0.4)
        doc.line(marginX, 18, pageW - marginX, 18)
      }

      // ── Preparar dados ────────────────────────────────────────────
      // Dividir lista em páginas de duas colunas
      // Calcular quantas linhas cabem por coluna por página
      const rowH = 7.5 // altura estimada por linha (mm)
      const headerH = 8 // altura do cabeçalho da tabela
      const availH = pageH - marginTop - 8 // altura disponível por coluna
      const rowsPerCol = Math.floor((availH - headerH) / rowH)
      const rowsPerPage = rowsPerCol * 2

      const rows = filtered.map(a => [
        a.brinco,
        a.sexo === 'MACHO' ? 'M' : 'F',
        (a.raca || '').length > 12 ? (a.raca || '').substring(0, 12) : (a.raca || ''),
        a.categoria || '',
        a.local || '',
      ])

      const tableStyle = (xLeft) => ({
        startY: marginTop,
        margin: { left: xLeft, right: 0, top: marginTop, bottom: 8 },
        tableWidth: colW,
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          overflow: 'hidden',
          font: 'helvetica',
          minCellHeight: 0,
        },
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
          minCellHeight: 0,
          valign: 'middle',
        },
        alternateRowStyles: { fillColor: [242, 242, 242] },
        columnStyles: {
          0: { cellWidth: brincoW, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: sexoW,   halign: 'center' },
          2: { cellWidth: racaW },
          3: { cellWidth: catW },
          4: { cellWidth: localW },
        },
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
        didDrawPage: () => { drawHeader() },
      })

      const head = [['Brinco', 'S', 'Raça', 'Categoria', 'Local']]

      // Desenha página por página manualmente
      const totalPages = Math.ceil(rows.length / rowsPerPage)

      for (let pg = 0; pg < totalPages; pg++) {
        if (pg > 0) doc.addPage()
        drawHeader()

        const pageRows = rows.slice(pg * rowsPerPage, (pg + 1) * rowsPerPage)
        const leftRows = pageRows.slice(0, rowsPerCol)
        const rightRows = pageRows.slice(rowsPerCol)

        // Coluna esquerda
        if (leftRows.length > 0) {
          autoTable(doc, {
            ...tableStyle(marginX),
            head,
            body: leftRows,
            didDrawPage: () => {},  // não redesenha header aqui, já fizemos acima
          })
        }

        // Coluna direita
        if (rightRows.length > 0) {
          autoTable(doc, {
            ...tableStyle(marginX + colW + gap),
            head,
            body: rightRows,
            startY: marginTop,
            didDrawPage: () => {},
          })
        }

        // Rodapé
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Página ${pg + 1} de ${totalPages}`, pageW - marginX, pageH - 4, { align: 'right' })
        doc.setTextColor(180)
        doc.text('Fazenda São Brás', marginX, pageH - 4)
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
