<template>
  <section>
    <AppHeader title="语法学习" :label="settings.target_level || '今日语法'" />
    <p v-if="speechError" class="notice error">{{ speechError }}</p>
    <div v-if="loading" class="empty-state">正在准备今日语法...</div>
    <template v-else>
      <div v-if="todayGrammar.length" class="card-list">
        <LearningCard v-for="item in todayGrammar" :key="item.id" type="grammar" :item="item" @favorite="favorite" @speak="speak" />
      </div>
      <div v-else class="empty-state">今天没有新的语法任务。</div>
      <button class="wide-button" type="button" :disabled="completed" @click="finishGrammar">
        {{ completed ? '今日语法已完成' : '完成今日语法' }}
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
import { findByIds, getLevelData } from '../services/dataService'
import { addFavorite } from '../services/favoriteService'
import { completeGrammar, ensureTodayPlan } from '../services/planService'
import { advanceGrammarIndex, getOrCreateProgress, getOrCreateSettings } from '../services/progressService'
import { speakJapanese } from '../services/speechService'

const loading = ref(true)
const message = ref('')
const speechError = ref('')
const user = ref(null)
const settings = ref({})
const progress = ref({})
const plan = ref({})
const grammar = ref([])
const todayGrammar = computed(() => findByIds(grammar.value, plan.value.grammar_ids || []))
const completed = computed(() => (plan.value.completed_grammar_ids || []).length >= (plan.value.grammar_ids || []).length && (plan.value.grammar_ids || []).length > 0)

onMounted(async () => {
  user.value = await getCurrentUser()
  settings.value = await getOrCreateSettings(user.value.id)
  const data = await getLevelData(settings.value.target_level)
  grammar.value = data.grammar
  progress.value = await getOrCreateProgress(user.value.id, settings.value.target_level)
  plan.value = await ensureTodayPlan(user.value.id, settings.value, progress.value, data.words, data.grammar)
  loading.value = false
})

async function finishGrammar() {
  if (completed.value) return
  plan.value = await completeGrammar(plan.value)
  progress.value = await advanceGrammarIndex(user.value.id, progress.value, plan.value.grammar_ids.length)
  message.value = '今日语法已完成，进度已推进'
}

async function favorite(item) {
  await addFavorite(user.value.id, 'grammar', item)
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
