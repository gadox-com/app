import { supabase } from './supabase'

export async function registrarLog(acao, detalhes = null, animalId = null, animalBrinco = null) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('activity_log').insert([{
      animal_id: animalId || null,
      animal_brinco: animalBrinco || null,
      acao,
      detalhes: detalhes || null,
      usuario_email: user?.email || null,
    }])
  } catch (e) {
    console.warn('Log error:', e)
  }
}
