<template>
  <section>
    <AppHeader title="单词学习" :label="settings.target_level || '今日单词'" />
    <p v-if="cacheWarning" class="notice success">{{ cacheWarning }}</p>
    <p v-if="speechError" class="notice error">{{ speechError }}</p>
    <div v-if="loading" class="empty-state">正在准备今日单词...</div>
    <div v-else-if="error" class="empty-state">
      <p class="notice error">{{ error }}</p>
      <button type="button" @click="load">重试</button>
    </div>
    <template v-else>
      <section class="section-block">
        <h2>今日单词</h2>
        <p class="muted">{{ todayWords.length }} 个，当前进度 {{ progress.word_index || 0 }}</p>
      </section>

      <div v-if="todayWords.length" class="card-list">
        <LearningCard v-for="word in todayWords" :key="word.id" type="word" :item="word" @favorite="favorite" @speak="speak" />
      </div>
      <div v-else class="empty-state">今天没有新的单词任务。</div>
      <button class="wide-button" type="button" :disabled="completed || finishing" @click="finishWords">
        {{ completed ? '今日单词已完成' : '完成今日单词' }}
      </button>
      <p v-if="message" class="notice success">{{ message }}</p>

      <section class="section-block">
        <div class="card-topline">
          <h2>全部单词</h2>
          <button class="secondary-button small" type="button" @click="showAll = !showAll">
            {{ showAll ? '收起' : '查看全部单词' }}
          </button>
        </div>
        <template v-if="showAll">
          <input v-model.trim="searchText" type="search" placeholder="搜索单词、假名、中文意思" />
          <div class="card-list list-mode">
            <article v-for="word in visibleWords" :key="word.id" class="study-card compact-card">
              <div class="card-topline">
                <span class="level-pill">{{ word.level }}</span>
                <button class="ghost-button small" type="button" @click="favorite(word)">收藏</button>
              </div>
              <h2>{{ word.word }}</h2>
              <p class="kana">{{ word.kana }}</p>
              <p>{{ word.meaning }}</p>
            </article>
          </div>
          <button v-if="canLoadMore" class="wide-button secondary-button" type="button" @click="visibleCount += pageSize">加载更多</button>
          <p v-if="!visibleWords.length" class="empty-state">没有匹配的单词。</p>
        </template>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import LearningCard from '../components/LearningCard.vue'
import { getCurrentUser } from '../services/authService'
import { findByIds, getWordsWithMeta } from '../services/dataService'
import { addFavorite } from '../services/favoriteService'
import { completeWords, ensureTodayPlan } from '../services/planService'
import { advanceWordIndex, getOrCreateProgress, getOrCreateSettings } from '../services/progressService'
import { speakJapanese } from '../services/speechService'

const pageSize = 30
const loading = ref(true)
const finishing = ref(false)
const message = ref('')
const error = ref('')
const cacheWarning = ref('')
const speechError = ref('')
const user = ref(null)
const settings = ref({})
const progress = ref({})
const plan = ref({})
const words = ref([])
const showAll = ref(false)
const searchText = ref('')
const visibleCount = ref(pageSize)
const todayWords = computed(() => findByIds(words.value, plan.value.word_ids || []))
const completed = computed(() => (plan.value.word_ids || []).length > 0 && (plan.value.completed_word_ids || []).length >= (plan.value.word_ids || []).length)
const filteredWords = computed(() => {
  const keyword = searchText.value.toLowerCase()
  const source = keyword
    ? words.value.filter((item) =>
        [item.word, item.kana, item.meaning, item.meaning_cn].some((value) => String(value || '').toLowerCase().includes(keyword)),
      )
    : words.value
  return keyword ? source.slice(0, 50) : source
})
const visibleWords = computed(() => filteredWords.value.slice(0, searchText.value ? 50 : visibleCount.value))
const canLoadMore = computed(() => !searchText.value && visibleCount.value < filteredWords.value.length)

async function load() {
  loading.value = true
  error.value = ''
  cacheWarning.value = ''
  try {
    user.value = await getCurrentUser()
    settings.value = await getOrCreateSettings(user.value.id)
    const { data, warning } = await getWordsWithMeta(settings.value.target_level)
    words.value = data
    cacheWarning.value = warning || ''
    progress.value = await getOrCreateProgress(user.value.id, settings.value.target_level)
    plan.value = await ensureTodayPlan(user.value.id, settings.value, progress.value, data, [])
  } catch (err) {
    error.value = err.message || '单词加载失败'
  } finally {
    loading.value = false
  }
}

async function finishWords() {
  if (completed.value || finishing.value) return
  finishing.value = true
  message.value = ''
  try {
    plan.value = await completeWords(plan.value)
    progress.value = await advanceWordIndex(user.value.id, progress.value, plan.value.word_ids.length)
    message.value = '今日单词已完成，进度已推进。'
  } catch (err) {
    error.value = err.message || '保存单词进度失败'
  } finally {
    finishing.value = false
  }
}

async function favorite(word) {
  await addFavorite(user.value.id, 'word', word)
  message.value = '已加入收藏。'
}

async function speak(text) {
  speechError.value = ''
  try {
    await speakJapanese(text)
  } catch (err) {
    speechError.value = err.message
  }
}

onMounted(load)
</script>
