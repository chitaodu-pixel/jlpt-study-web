import { supabase } from './supabase'

export async function listWrongQuestions(userId, filters = {}) {
  if (!supabase) return []
  let query = supabase.from('wrong_questions').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (filters.level) query = query.eq('level', filters.level)
  if (filters.type) query = query.eq('type', filters.type)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function recordWrongQuestion(userId, question, selectedAnswer) {
  const payload = {
    user_id: userId,
    type: question.type,
    level: question.level,
    source_id: question.source_id,
    question_id: question.id,
    prompt: question.prompt,
    correct_answer: question.answer,
    last_wrong_answer: selectedAnswer,
    explanation: question.explanation,
    wrong_count: 1,
    correct_count_after_wrong: 0,
    updated_at: new Date().toISOString(),
  }
  if (!supabase) return payload
  const { data: existing, error: readError } = await supabase
    .from('wrong_questions')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', question.id)
    .maybeSingle()
  if (readError) throw readError
  const next = existing ? { ...payload, id: existing.id, wrong_count: Number(existing.wrong_count || 0) + 1 } : payload
  const { data, error } = await supabase.from('wrong_questions').upsert(next).select().single()
  if (error) throw error
  return data
}

export async function recordCorrectAfterWrong(userId, questionId) {
  if (!supabase) return
  const { data: existing, error: readError } = await supabase
    .from('wrong_questions')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle()
  if (readError) throw readError
  if (!existing) return
  const nextCount = Number(existing.correct_count_after_wrong || 0) + 1
  if (nextCount >= 3) return removeWrongQuestion(userId, existing.id)
  const { error } = await supabase.from('wrong_questions').update({ correct_count_after_wrong: nextCount }).eq('id', existing.id)
  if (error) throw error
}

export async function removeWrongQuestion(userId, id) {
  if (!supabase) return
  const { error } = await supabase.from('wrong_questions').delete().eq('user_id', userId).eq('id', id)
  if (error) throw error
}
