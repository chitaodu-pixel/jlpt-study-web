import { supabase } from './supabase'

export const defaultSettings = {
  target_level: 'N2',
  daily_words: 20,
  daily_grammar: 5,
  daily_questions: 25,
  exam_date: '',
}

export const defaultProgress = {
  level: 'N2',
  word_index: 0,
  grammar_index: 0,
}

export async function getOrCreateSettings(userId) {
  if (!supabase) return { ...defaultSettings, user_id: userId }
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (data) return { ...defaultSettings, ...data }
  return saveSettings(userId, defaultSettings)
}

export async function saveSettings(userId, settings) {
  const payload = { ...settings, user_id: userId, updated_at: new Date().toISOString() }
  if (!supabase) return payload
  const { data, error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' }).select().single()
  if (error) throw error
  return data
}

export async function getOrCreateProgress(userId, level = 'N2') {
  if (!supabase) return { ...defaultProgress, user_id: userId, level }
  const { data, error } = await supabase
    .from('study_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('level', level)
    .maybeSingle()
  if (error) throw error
  if (data) return data
  return saveProgress(userId, { ...defaultProgress, level })
}

export async function saveProgress(userId, progress) {
  const payload = { ...progress, user_id: userId, updated_at: new Date().toISOString() }
  if (!supabase) return payload
  const { data, error } = await supabase
    .from('study_progress')
    .upsert(payload, { onConflict: 'user_id,level' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function advanceWordIndex(userId, progress, count) {
  return saveProgress(userId, { ...progress, word_index: Number(progress.word_index || 0) + count })
}

export async function advanceGrammarIndex(userId, progress, count) {
  return saveProgress(userId, { ...progress, grammar_index: Number(progress.grammar_index || 0) + count })
}
