import { supabase } from './supabase'
import { findByIds } from './dataService'

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayPlan(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('today_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('study_date', todayKey())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function ensureTodayPlan(userId, settings, progress, words, grammar) {
  const existing = await getTodayPlan(userId)
  if (existing && existing.level === settings.target_level) return existing

  const wordStart = Number(progress.word_index || 0)
  const grammarStart = Number(progress.grammar_index || 0)
  const word_ids = words.slice(wordStart, wordStart + Number(settings.daily_words || 20)).map((item) => item.id)
  const grammar_ids = grammar.slice(grammarStart, grammarStart + Number(settings.daily_grammar || 5)).map((item) => item.id)
  const payload = {
    user_id: userId,
    study_date: todayKey(),
    level: settings.target_level,
    word_ids,
    grammar_ids,
    completed_word_ids: [],
    completed_grammar_ids: [],
    completed_question_ids: [],
  }
  if (!supabase) return payload
  const { data, error } = await supabase.from('today_plans').upsert(payload, { onConflict: 'user_id,study_date' }).select().single()
  if (error) throw error
  return data
}

export async function updateTodayPlan(plan) {
  if (!supabase) return plan
  const { data, error } = await supabase.from('today_plans').update(plan).eq('id', plan.id).select().single()
  if (error) throw error
  return data
}

export async function completeWords(plan) {
  const next = { ...plan, completed_word_ids: [...new Set([...(plan.completed_word_ids || []), ...(plan.word_ids || [])])] }
  return updateTodayPlan(next)
}

export async function completeGrammar(plan) {
  const next = { ...plan, completed_grammar_ids: [...new Set([...(plan.completed_grammar_ids || []), ...(plan.grammar_ids || [])])] }
  return updateTodayPlan(next)
}

export async function completeQuestions(plan, questionIds) {
  const next = { ...plan, completed_question_ids: [...new Set([...(plan.completed_question_ids || []), ...questionIds])] }
  return updateTodayPlan(next)
}

export function planWords(plan, words) {
  return findByIds(words, plan?.word_ids || [])
}

export function planGrammar(plan, grammar) {
  return findByIds(grammar, plan?.grammar_ids || [])
}
