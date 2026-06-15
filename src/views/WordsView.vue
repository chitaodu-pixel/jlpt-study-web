<template>
  <section>
    <AppHeader title="单词学习" :label="settings.target_level || '今日单词'" />
    <p v-if="speechError" class="notice error">{{ speechError }}</p>
    <div v-if="loading" class="empty-state">正在准备今日单词...</div>
    <template v-else>
      <div v-if="todayWords.length" class="card-list">
        <LearningCard v-for="word in todayWords" :key="word.id" type="word" :item="word" @favorite="favorite" @speak="speak" />
      </div>
      <div v-else class="empty-state">今天没有新的单词任务。</div>
      <button class="wide-button" type="button" :disabled="completed" @click="finishWords">
        {{ completed ? '今日单词已完成' : '完成今日单词' }}
      </button>
      <p v-if="message" class="notice success">{{ message }}</p>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import LearningCard from '../components/LearningCard.vue'
import { getCurrentUser } from '../services/authService'
import { getLevelData, findByIds } from '../services/dataService'
import { addFavorite } from '../services/favoriteService'
import { completeWords, ensureTodayPlan } from '../services/planService'
import { advanceWordIndex, getOrCreateProgress, getOrCreateSettings } from '../services/progressService'
import { speakJapanese } from '../services/speechService'

const loading = ref(true)
const message = ref('')
const speechError = ref('')
const user = ref(null)
const settings = ref({})
const progress = ref({})
const plan = ref({})
const words = ref([])
const todayWords = computed(() => findByIds(words.value, plan.value.word_ids || []))
const completed = computed(() => (plan.value.completed_word_ids || []).length >= (plan.value.word_ids || []).length && (plan.value.word_ids || []).length > 0)

onMounted(async () => {
  user.value = await getCurrentUser()
  settings.value = await getOrCreateSettings(user.value.id)
  const data = await getLevelData(settings.value.target_level)
  words.value = data.words
  progress.value = await getOrCreateProgress(user.value.id, settings.value.target_level)
  plan.value = await ensureTodayPlan(user.value.id, settings.value, progress.value, data.words, data.grammar)
  loading.value = false
})

async function finishWords() {
  if (completed.value) return
  plan.value = await completeWords(plan.value)
  progress.value = await advanceWordIndex(user.value.id, progress.value, plan.value.word_ids.length)
  message.value = '今日单词已完成，进度已推进'
}

async function favorite(word) {
  await addFavorite(user.value.id, 'word', word)
  message.value = '已加入收藏'
}

function speak(text) {
  speechError.value = ''
  try {
    speakJapanese(text)
  } catch (err) {
    speechError.value = err.message
  }
}
</script>
