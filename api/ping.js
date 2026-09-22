/**
 * /api/ping — Vercel Cron Job
 *
 * Mantém o banco Supabase ativo fazendo uma query leve a cada 3 dias.
 * Configurado em vercel.json -> crons.
 *
 * Env vars necessárias (já devem existir no projeto Vercel):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */
export default async function handler(req, res) {
  // Vercel Cron envia GET com header Authorization no plano Hobby
  // Proteção básica: aceitar apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('[ping] Variáveis de ambiente do Supabase não encontradas')
    return res.status(500).json({ ok: false, error: 'Missing env vars' })
  }

  try {
    const start = Date.now()

    // Query leve: conta apenas 1 animal para manter conexão ativa
    const response = await fetch(
      `${supabaseUrl}/rest/v1/animais?select=id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const elapsed = Date.now() - start

    if (!response.ok) {
      const text = await response.text()
      console.error(`[ping] Supabase retornou ${response.status}: ${text}`)
      return res.status(502).json({
        ok: false,
        status: response.status,
        error: text,
      })
    }

    const data = await response.json()
    const ts = new Date().toISOString()

    console.log(`[ping] ✅ OK em ${elapsed}ms — ${ts}`)

    return res.status(200).json({
      ok: true,
      timestamp: ts,
      elapsed_ms: elapsed,
      rows: data.length,
    })
  } catch (err) {
    console.error('[ping] Erro inesperado:', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}
