<template>
  <section>
    <AppHeader title="今日练习" :label="settings.target_level || '练习'" />
    <div v-if="loading" class="empty-state">正在生成题目...</div>
    <div v-else-if="error" class="empty-state">
      <p class="notice error">{{ error }}</p>
      <button type="button" @click="load">重试</button>
    </div>
    <template v-else>
      <p v-if="message" class="notice success">{{ message }}</p>
      <div v-if="current" class="question-card">
        <div class="card-topline">
          <span class="level-pill">{{ current.level }}</span>
          <span class="muted">{{ index + 1 }} / {{ questions.length }}</span>
        </div>
        <p class="muted">{{ current.prompt_hint }}</p>
        <h2>{{ current.prompt }}</h2>
        <div class="option-list">
          <button
            v-for="option in current.options"
            :key="option"
            type="button"
            :class="{ selected: selected === option, correct: answered && option === current.answer, wrong: answered && selected === option && option !== current.answer }"
            :disabled="answered"
            @click="answer(option)"
          >
            {{ option }}
          </button>
        </div>
        <div v-if="answered" class="answer-box">
          <strong>{{ selected === current.answer ? '回答正确' : '回答错误' }}</strong>
          <p>正确答案：{{ current.answer }}</p>
          <p>{{ current.explanation }}</p>
          <button type="button" @click="nextQuestion">{{ isLast ? '完成今日练习' : '下一题' }}</button>
        </div>
      </div>
      <div v-else class="empty-state">今日计划为空，请先完成今日单词或语法学习。</div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser } from '../services/authService'
import { findByIds, getGrammar, getWords } from '../services/dataService'
import { completeQuestions, getTodayPlan } from '../services/planService'
import { getOrCreateSettings } from '../services/progressService'
import { generateQuestions } from '../services/questionService'
import { recordCorrectAfterWrong, recordWrongQuestion } from '../services/wrongQuestionService'

const loading = ref(true)
const error = ref('')
const user = ref(null)
const settings = ref({})
const plan = ref({})
const questions = ref([])
const index = ref(0)
const selected = ref('')
const answered = ref(false)
const message = ref('')
const current = computed(() => questions.value[index.value])
const isLast = computed(() => index.value >= questions.value.length - 1)

async function load() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    user.value = await getCurrentUser()
    settings.value = await getOrCreateSettings(user.value.id)
    plan.value = (await getTodayPlan(user.value.id, settings.value.target_level)) || {}
    if (!(plan.value.word_ids || []).length && !(plan.value.grammar_ids || []).length) return

    const [words, grammar] = await Promise.all([getWords(settings.value.target_level), getGrammar(settings.value.target_level)])
    const todayWords = findByIds(words, plan.value.word_ids || [])
    const todayGrammar = findByIds(grammar, plan.value.grammar_ids || [])
    questions.value = generateQuestions(todayWords, todayGrammar, words, grammar, settings.value.daily_questions)
  } catch (err) {
    error.value = err.message || '练习加载失败'
  } finally {
    loading.value = false
  }
}

async function answer(option) {
  selected.value = option
  answered.value = true
  try {
    if (option === current.value.answer) {
      await recordCorrectAfterWrong(user.value.id, current.value)
    } else {
      await recordWrongQuestion(user.value.id, current.value, option)
    }
  } catch (err) {
    message.value = err.message || '错题同步失败，请稍后重试。'
  }
}

async function nextQuestion() {
  if (isLast.value) {
    plan.value = await completeQuestions(plan.value, questions.value.map((item) => item.id))
    message.value = '今日练习已完成。'
    return
  }
  index.value += 1
  selected.value = ''
  answered.value = false
}

onMounted(load)
</script>
