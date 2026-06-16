<template>
  <section>
    <AppHeader title="语法学习" :label="settings.target_level || '今日语法'" />
    <p v-if="cacheWarning" class="notice success">{{ cacheWarning }}</p>
    <p v-if="speechError" class="notice error">{{ speechError }}</p>
    <div v-if="loading" class="empty-state">正在准备今日语法...</div>
    <div v-else-if="error" class="empty-state">
      <p class="notice error">{{ error }}</p>
      <button type="button" @click="load">重试</button>
    </div>
    <template v-else>
      <section class="section-block">
        <h2>今日语法</h2>
        <p class="muted">{{ todayGrammar.length }} 条，当前进度 {{ progress.grammar_index || 0 }}</p>
      </section>

      <div v-if="todayGrammar.length" class="card-list">
        <LearningCard v-for="item in todayGrammar" :key="item.id" type="grammar" :item="item" @favorite="favorite" @speak="speak" />
      </div>
      <div v-else class="empty-state">今天没有新的语法任务。</div>
      <button class="wide-button" type="button" :disabled="completed || finishing" @click="finishGrammar">
        {{ completed ? '今日语法已完成' : '完成今日语法' }}
      </button>
      <p v-if="message" class="notice success">{{ message }}</p>

      <section class="section-block">
        <div class="card-topline">
          <h2>全部语法</h2>
          <button class="secondary-button small" type="button" @click="showAll = !showAll">
            {{ showAll ? '收起' : '查看全部语法' }}
          </button>
        </div>
        <template v-if="showAll">
          <input v-model.trim="searchText" type="search" placeholder="搜索语法、意思、接续、易错点" />
          <div class="card-list list-mode">
            <article v-for="item in visibleGrammar" :key="item.id" class="study-card compact-card">
              <div class="card-topline">
                <span class="level-pill">{{ item.level }}</span>
                <button class="ghost-button small" type="button" @click="favorite(item)">收藏</button>
              </div>
              <h2>{{ item.grammar }}</h2>
              <p>{{ item.meaning }}</p>
              <p class="muted">{{ item.usage }}</p>
            </article>
          </div>
          <button v-if="canLoadMore" class="wide-button secondary-button" type="button" @click="visibleCount += pageSize">加载更多</button>
          <p v-if="!visibleGrammar.length" class="empty-state">没有匹配的语法。</p>
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
import { findByIds, getGrammarWithMeta } from '../services/dataService'
import { addFavorite } from '../services/favoriteService'
import { completeGrammar, ensureTodayPlan } from '../services/planService'
import { advanceGrammarIndex, getOrCreateProgress, getOrCreateSettings } from '../services/progressService'
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
const grammar = ref([])
const showAll = ref(false)
const searchText = ref('')
const visibleCount = ref(pageSize)
const todayGrammar = computed(() => findByIds(grammar.value, plan.value.grammar_ids || []))
const completed = computed(() => (plan.value.grammar_ids || []).length > 0 && (plan.value.completed_grammar_ids || []).length >= (plan.value.grammar_ids || []).length)
const filteredGrammar = computed(() => {
  const keyword = searchText.value.toLowerCase()
  const source = keyword
    ? grammar.value.filter((item) =>
        [item.grammar, item.meaning, item.meaning_cn, item.usage, item.note].some((value) => String(value || '').toLowerCase().includes(keyword)),
      )
    : grammar.value
  return keyword ? source.slice(0, 50) : source
})
const visibleGrammar = computed(() => filteredGrammar.value.slice(0, searchText.value ? 50 : visibleCount.value))
const canLoadMore = computed(() => !searchText.value && visibleCount.value < filteredGrammar.value.length)

async function load() {
  loading.value = true
  error.value = ''
  cacheWarning.value = ''
  try {
    user.value = await getCurrentUser()
    settings.value = await getOrCreateSettings(user.value.id)
    const { data, warning } = await getGrammarWithMeta(settings.value.target_level)
    grammar.value = data
    cacheWarning.value = warning || ''
    progress.value = await getOrCreateProgress(user.value.id, settings.value.target_level)
    plan.value = await ensureTodayPlan(user.value.id, settings.value, progress.value, [], data)
  } catch (err) {
    error.value = err.message || '语法加载失败'
  } finally {
    loading.value = false
  }
}

async function finishGrammar() {
  if (completed.value || finishing.value) return
  finishing.value = true
  message.value = ''
  try {
    plan.value = await completeGrammar(plan.value)
    progress.value = await advanceGrammarIndex(user.value.id, progress.value, plan.value.grammar_ids.length)
    message.value = '今日语法已完成，进度已推进。'
  } catch (err) {
    error.value = err.message || '保存语法进度失败'
  } finally {
    finishing.value = false
  }
}

async function favorite(item) {
  await addFavorite(user.value.id, 'grammar', item)
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
