import { supabase } from './supabase'
import { findByIds } from './dataService'

export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayPlan(userId, level) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('today_plans')
    .select('id,user_id,study_date,level,word_ids,grammar_ids,completed_word_ids,completed_grammar_ids,completed_question_ids')
    .eq('user_id', userId)
    .eq('study_date', todayKey())
    .eq('level', level)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function ensureTodayPlan(userId, settings, progress, words = [], grammar = []) {
  const level = settings.target_level
  const existing = await getTodayPlan(userId, level)

  const wordStart = Number(progress.word_index || 0)
  const grammarStart = Number(progress.grammar_index || 0)
  const nextWordIds = words.length ? words.slice(wordStart, wordStart + Number(settings.daily_words || 20)).map((item) => item.id) : []
  const nextGrammarIds = grammar.length ? grammar.slice(grammarStart, grammarStart + Number(settings.daily_grammar || 5)).map((item) => item.id) : []

  if (existing) {
    const needsWords = !(existing.word_ids || []).length && nextWordIds.length
    const needsGrammar = !(existing.grammar_ids || []).length && nextGrammarIds.length
    if (!needsWords && !needsGrammar) return existing
    return updateTodayPlan({
      ...existing,
      word_ids: needsWords ? nextWordIds : existing.word_ids || [],
      grammar_ids: needsGrammar ? nextGrammarIds : existing.grammar_ids || [],
    })
  }

  const payload = {
    user_id: userId,
    study_date: todayKey(),
    level,
    word_ids: nextWordIds,
    grammar_ids: nextGrammarIds,
    completed_word_ids: [],
    completed_grammar_ids: [],
    completed_question_ids: [],
  }
  if (!supabase) return payload
  const { data, error } = await supabase
    .from('today_plans')
    .insert(payload)
    .select('id,user_id,study_date,level,word_ids,grammar_ids,completed_word_ids,completed_grammar_ids,completed_question_ids')
    .single()
  if (error) throw error
  return data
}

export async function updateTodayPlan(plan) {
  if (!supabase) return plan
  const payload = {
    word_ids: plan.word_ids || [],
    grammar_ids: plan.grammar_ids || [],
    completed_word_ids: plan.completed_word_ids || [],
    completed_grammar_ids: plan.completed_grammar_ids || [],
    completed_question_ids: plan.completed_question_ids || [],
  }
  const { data, error } = await supabase
    .from('today_plans')
    .update(payload)
    .eq('id', plan.id)
    .eq('user_id', plan.user_id)
    .select('id,user_id,study_date,level,word_ids,grammar_ids,completed_word_ids,completed_grammar_ids,completed_question_ids')
    .single()
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
