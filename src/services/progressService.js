import { supabase } from './supabase'

export const levels = ['N5', 'N4', 'N3', 'N2', 'N1']

export const defaultSettings = {
  target_level: 'N2',
  daily_words: 20,
  daily_grammar: 5,
  daily_questions: 25,
  exam_date: null,
}

export const defaultProgress = {
  level: 'N2',
  word_index: 0,
  grammar_index: 0,
  question_index: 0,
}

function normalizeLevel(level = 'N2') {
  const value = String(level).toUpperCase()
  return levels.includes(value) ? value : 'N2'
}

export async function getOrCreateSettings(userId) {
  if (!supabase) return { ...defaultSettings, user_id: userId }
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id,target_level,daily_words,daily_grammar,daily_questions,exam_date,updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (data) return { ...defaultSettings, ...data, target_level: normalizeLevel(data.target_level) }
  return saveSettings(userId, defaultSettings)
}

export async function saveSettings(userId, settings) {
  const payload = {
    ...settings,
    target_level: normalizeLevel(settings.target_level),
    exam_date: settings.exam_date || null,
    user_id: userId,
    updated_at: new Date().toISOString(),
  }
  if (!supabase) return payload
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select('user_id,target_level,daily_words,daily_grammar,daily_questions,exam_date,updated_at')
    .single()
  if (error) throw error
  return { ...defaultSettings, ...data, target_level: normalizeLevel(data.target_level) }
}

export async function getOrCreateProgress(userId, level = 'N2') {
  const normalized = normalizeLevel(level)
  if (!supabase) return { ...defaultProgress, user_id: userId, level: normalized }
  const { data, error } = await supabase
    .from('study_progress')
    .select('id,user_id,level,word_index,grammar_index,question_index,updated_at')
    .eq('user_id', userId)
    .eq('level', normalized)
    .maybeSingle()
  if (error) throw error
  if (data) return { ...defaultProgress, ...data, level: normalized }
  return saveProgress(userId, { ...defaultProgress, level: normalized })
}

export async function saveProgress(userId, progress) {
  const payload = {
    ...defaultProgress,
    ...progress,
    user_id: userId,
    level: normalizeLevel(progress.level),
    updated_at: new Date().toISOString(),
  }
  if (!supabase) return payload
  const { data, error } = await supabase
    .from('study_progress')
    .upsert(payload, { onConflict: 'user_id,level' })
    .select('id,user_id,level,word_index,grammar_index,question_index,updated_at')
    .single()
  if (error) throw error
  return { ...defaultProgress, ...data, level: normalizeLevel(data.level) }
}

export async function advanceWordIndex(userId, progress, count) {
  return saveProgress(userId, { ...progress, word_index: Number(progress.word_index || 0) + count })
}

export async function advanceGrammarIndex(userId, progress, count) {
  return saveProgress(userId, { ...progress, grammar_index: Number(progress.grammar_index || 0) + count })
}
