import { supabase } from './supabase'

const wrongFields =
  'id,user_id,type,level,source_id,question,answer,wrong_count,correct_count_after_wrong,updated_at'

export async function countWrongQuestions(userId, level = '') {
  if (!supabase) return 0
  let query = supabase.from('wrong_questions').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  if (level) query = query.eq('level', level)
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

export async function listWrongQuestions(userId, filters = {}) {
  if (!supabase) return []
  let query = supabase.from('wrong_questions').select(wrongFields).eq('user_id', userId).order('updated_at', { ascending: false })
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
    question: question.prompt,
    answer: question.answer,
    wrong_count: 1,
    correct_count_after_wrong: 0,
    updated_at: new Date().toISOString(),
  }
  if (!supabase) return payload
  const { data: existing, error: readError } = await supabase
    .from('wrong_questions')
    .select('id,wrong_count')
    .eq('user_id', userId)
    .eq('type', question.type)
    .eq('source_id', question.source_id)
    .maybeSingle()
  if (readError) throw readError

  if (existing) {
    const next = {
      wrong_count: Number(existing.wrong_count || 0) + 1,
      correct_count_after_wrong: 0,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('wrong_questions')
      .update(next)
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select(wrongFields)
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase.from('wrong_questions').insert(payload).select(wrongFields).single()
  if (error) throw error
  return data
}

export async function recordCorrectAfterWrong(userId, question) {
  if (!supabase) return
  const query = supabase
    .from('wrong_questions')
    .select('id,correct_count_after_wrong')
    .eq('user_id', userId)
  const scopedQuery =
    typeof question === 'object' && question?.source_id && question?.type
      ? query.eq('source_id', question.source_id).eq('type', question.type)
      : query.eq('source_id', String(question).replace(/_(meaning|kana|reverse)$/, ''))
  const { data: existing, error: readError } = await scopedQuery.maybeSingle()
  if (readError) throw readError
  if (!existing) return
  const nextCount = Number(existing.correct_count_after_wrong || 0) + 1
  if (nextCount >= 3) return removeWrongQuestion(userId, existing.id)
  const { error } = await supabase.from('wrong_questions').update({ correct_count_after_wrong: nextCount }).eq('user_id', userId).eq('id', existing.id)
  if (error) throw error
}

export async function removeWrongQuestion(userId, id) {
  if (!supabase) return
  const { error } = await supabase.from('wrong_questions').delete().eq('user_id', userId).eq('id', id)
  if (error) throw error
}
