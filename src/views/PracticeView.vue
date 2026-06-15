<template>
  <section>
    <AppHeader title="今日练习" :label="settings.target_level || '练习'" />
    <div v-if="loading" class="empty-state">正在生成题目...</div>
    <template v-else>
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
      <div v-else class="empty-state">今日单词和语法完成后，这里会生成练习题。</div>
      <p v-if="message" class="notice success">{{ message }}</p>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser } from '../services/authService'
import { findByIds, getLevelData } from '../services/dataService'
import { ensureTodayPlan, completeQuestions } from '../services/planService'
import { getOrCreateProgress, getOrCreateSettings } from '../services/progressService'
import { generateQuestions } from '../services/questionService'
import { recordCorrectAfterWrong, recordWrongQuestion } from '../services/wrongQuestionService'

const loading = ref(true)
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

onMounted(async () => {
  user.value = await getCurrentUser()
  settings.value = await getOrCreateSettings(user.value.id)
  const data = await getLevelData(settings.value.target_level)
  const progress = await getOrCreateProgress(user.value.id, settings.value.target_level)
  plan.value = await ensureTodayPlan(user.value.id, settings.value, progress, data.words, data.grammar)
  const todayWords = findByIds(data.words, plan.value.word_ids || [])
  const todayGrammar = findByIds(data.grammar, plan.value.grammar_ids || [])
  questions.value = generateQuestions(todayWords, todayGrammar, data.words, data.grammar, settings.value.daily_questions)
  loading.value = false
})

async function answer(option) {
  selected.value = option
  answered.value = true
  if (option === current.value.answer) {
    await recordCorrectAfterWrong(user.value.id, current.value.id)
  } else {
    await recordWrongQuestion(user.value.id, current.value, option)
  }
}

async function nextQuestion() {
  if (isLast.value) {
    plan.value = await completeQuestions(plan.value, questions.value.map((item) => item.id))
    message.value = '今日练习已完成'
    return
  }
  index.value += 1
  selected.value = ''
  answered.value = false
}
</script>
