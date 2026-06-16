import { supabase } from './supabase'

const favoriteFields = 'id,user_id,type,source_id,level,title,created_at'

export async function countFavorites(userId, level = '') {
  if (!supabase) return 0
  let query = supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  if (level) query = query.eq('level', level)
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

export async function listFavorites(userId, filters = {}) {
  if (!supabase) return []
  let query = supabase.from('favorites').select(favoriteFields).eq('user_id', userId).order('created_at', { ascending: false })
  if (filters.level) query = query.eq('level', filters.level)
  if (filters.type) query = query.eq('type', filters.type)
  const { data, error } = await query
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
  }
  if (!supabase) return payload
  const { data, error } = await supabase
    .from('favorites')
    .upsert(payload, { onConflict: 'user_id,type,source_id' })
    .select(favoriteFields)
    .single()
  if (error) throw error
  return data
}

export async function removeFavorite(userId, type, sourceId) {
  if (!supabase) return
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('type', type).eq('source_id', sourceId)
  if (error) throw error
}
