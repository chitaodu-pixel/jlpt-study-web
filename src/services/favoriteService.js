import { supabase } from './supabase'

export async function listFavorites(userId) {
  if (!supabase) return []
  const { data, error } = await supabase.from('favorites').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addFavorite(userId, type, source) {
  const payload = {
    user_id: userId,
    type,
    source_id: source.id,
    level: source.level,
    title: source.word || source.grammar,
    subtitle: source.kana || source.meaning,
  }
  if (!supabase) return payload
  const { data, error } = await supabase.from('favorites').upsert(payload, { onConflict: 'user_id,type,source_id' }).select().single()
  if (error) throw error
  return data
}

export async function removeFavorite(userId, type, sourceId) {
  if (!supabase) return
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('type', type).eq('source_id', sourceId)
  if (error) throw error
}
