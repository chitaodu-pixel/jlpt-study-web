<template>
  <section>
    <AppHeader title="今日学习" :label="user?.email || 'JLPT Study'" can-logout @logout="handleLogout" />

    <div v-if="loading" class="empty-state">正在读取学习数据...</div>
    <template v-else>
      <section class="hero-panel">
        <div>
          <p class="muted">目标等级</p>
          <h2>{{ settings.target_level }}</h2>
        </div>
        <RouterLink class="secondary-link" to="/settings">设置</RouterLink>
      </section>

      <div class="stats-grid">
        <article class="stat-card">
          <span>单词总进度</span>
          <strong>{{ progress.word_index }} / {{ words.length }}</strong>
        </article>
        <article class="stat-card">
          <span>语法总进度</span>
          <strong>{{ progress.grammar_index }} / {{ grammar.length }}</strong>
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser, signOut } from '../services/authService'
import { getLevelData } from '../services/dataService'
import { getOrCreateProgress, getOrCreateSettings } from '../services/progressService'
import { ensureTodayPlan } from '../services/planService'
import { listFavorites } from '../services/favoriteService'
import { listWrongQuestions } from '../services/wrongQuestionService'

const router = useRouter()
const loading = ref(true)
const user = ref(null)
const settings = ref({})
const progress = ref({})
const plan = ref({})
const words = ref([])
const grammar = ref([])
const wrongCount = ref(0)
const favoriteCount = ref(0)

async function loadHome() {
  loading.value = true
  user.value = await getCurrentUser()
  settings.value = await getOrCreateSettings(user.value.id)
  const data = await getLevelData(settings.value.target_level)
  words.value = data.words
  grammar.value = data.grammar
  progress.value = await getOrCreateProgress(user.value.id, settings.value.target_level)
  plan.value = await ensureTodayPlan(user.value.id, settings.value, progress.value, words.value, grammar.value)
  const [favorites, wrong] = await Promise.all([listFavorites(user.value.id), listWrongQuestions(user.value.id)])
  favoriteCount.value = favorites.length
  wrongCount.value = wrong.length
  loading.value = false
}

async function handleLogout() {
  await signOut()
  await router.push('/login')
}

onMounted(loadHome)
</script>
