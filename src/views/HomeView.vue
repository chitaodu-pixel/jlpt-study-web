<template>
  <section>
    <AppHeader title="今日学习" :label="user?.email || 'JLPT Study'" can-logout @logout="handleLogout" />

    <div v-if="loading" class="empty-state">正在同步学习数据...</div>
    <div v-else-if="error" class="empty-state">
      <p class="notice error">{{ error }}</p>
      <button type="button" @click="loadHome">重试</button>
    </div>
    <template v-else>
      <section class="hero-panel">
        <div>
          <p class="muted">当前等级</p>
          <h2>{{ settings.target_level }}</h2>
        </div>
        <RouterLink class="secondary-link" to="/settings">设置</RouterLink>
      </section>

      <div class="level-switch" aria-label="等级快捷切换">
        <button
          v-for="level in levels"
          :key="level"
          type="button"
          :class="{ active: settings.target_level === level }"
          :disabled="switching"
          @click="changeLevel(level)"
        >
          {{ level }}
        </button>
      </div>

      <p v-if="message" class="notice success">{{ message }}</p>

      <div class="stats-grid">
        <article class="stat-card">
          <span>单词总进度</span>
          <strong>{{ progress.word_index || 0 }} / {{ currentCounts.wordCount || 0 }}</strong>
        </article>
        <article class="stat-card">
          <span>语法总进度</span>
          <strong>{{ progress.grammar_index || 0 }} / {{ currentCounts.grammarCount || 0 }}</strong>
        </article>
        <article class="stat-card">
          <span>错题数量</span>
          <strong>{{ wrongCount }}</strong>
        </article>
        <article class="stat-card">
          <span>收藏数量</span>
          <strong>{{ favoriteCount }}</strong>
        </article>
      </div>

      <section class="section-block">
        <h2>今日任务</h2>
        <div class="task-list">
          <div><span>今日单词</span><strong>{{ plan.completed_word_ids?.length || 0 }}/{{ plan.word_ids?.length || settings.daily_words }}</strong></div>
          <div><span>今日语法</span><strong>{{ plan.completed_grammar_ids?.length || 0 }}/{{ plan.grammar_ids?.length || settings.daily_grammar }}</strong></div>
          <div><span>今日习题</span><strong>{{ plan.completed_question_ids?.length || 0 }}/{{ settings.daily_questions }}</strong></div>
        </div>
      </section>

      <div class="action-grid">
        <RouterLink class="primary-action" to="/words">开始今日学习</RouterLink>
        <RouterLink to="/words">单词学习</RouterLink>
        <RouterLink to="/grammar">语法学习</RouterLink>
        <RouterLink to="/practice">今日练习</RouterLink>
        <RouterLink to="/wrong-book">错题本</RouterLink>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser, signOut } from '../services/authService'
import { getDataIndex } from '../services/dataService'
import { countFavorites } from '../services/favoriteService'
import { getTodayPlan } from '../services/planService'
import { getOrCreateProgress, getOrCreateSettings, levels, saveSettings } from '../services/progressService'
import { countWrongQuestions } from '../services/wrongQuestionService'

const router = useRouter()
const loading = ref(true)
const switching = ref(false)
const error = ref('')
const message = ref('')
const user = ref(null)
const settings = ref({})
const progress = ref({})
const plan = ref({})
const dataIndex = ref({})
const wrongCount = ref(0)
const favoriteCount = ref(0)
const currentCounts = computed(() => dataIndex.value[settings.value.target_level] || {})

async function loadLevelSummary() {
  progress.value = await getOrCreateProgress(user.value.id, settings.value.target_level)
  plan.value = (await getTodayPlan(user.value.id, settings.value.target_level)) || {}
  const [favorites, wrong] = await Promise.all([
    countFavorites(user.value.id, settings.value.target_level),
    countWrongQuestions(user.value.id, settings.value.target_level),
  ])
  favoriteCount.value = favorites
  wrongCount.value = wrong
}

async function loadHome() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    user.value = await getCurrentUser()
    settings.value = await getOrCreateSettings(user.value.id)
    dataIndex.value = await getDataIndex()
    await loadLevelSummary()
  } catch (err) {
    error.value = err.message || '首页加载失败'
  } finally {
    loading.value = false
  }
}

async function changeLevel(level) {
  if (level === settings.value.target_level || switching.value) return
  switching.value = true
  error.value = ''
  message.value = ''
  try {
    settings.value = await saveSettings(user.value.id, { ...settings.value, target_level: level })
    await loadLevelSummary()
    message.value = `已切换到 ${level}`
  } catch (err) {
    error.value = err.message || '等级切换失败'
  } finally {
    switching.value = false
  }
}

async function handleLogout() {
  await signOut()
  await router.push('/login')
}

onMounted(loadHome)
</script>
