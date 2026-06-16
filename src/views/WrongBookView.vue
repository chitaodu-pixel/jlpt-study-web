<template>
  <section>
    <AppHeader title="错题本" label="复习薄弱点" />
    <div class="filter-row">
      <select v-model="filters.level" @change="load">
        <option value="">全部等级</option>
        <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
      </select>
      <select v-model="filters.type" @change="load">
        <option value="">全部类型</option>
        <option value="word_meaning">word_meaning</option>
        <option value="word_kana">word_kana</option>
        <option value="grammar_meaning">grammar_meaning</option>
      </select>
    </div>
    <div v-if="loading" class="empty-state">正在读取错题...</div>
    <div v-else-if="error" class="empty-state">
      <p class="notice error">{{ error }}</p>
      <button type="button" @click="load">重试</button>
    </div>
    <div v-else-if="items.length" class="card-list">
      <article v-for="item in items" :key="item.id" class="study-card">
        <div class="card-topline">
          <span class="level-pill">{{ item.level }}</span>
          <button class="ghost-button small" type="button" @click="remove(item.id)">移除</button>
        </div>
        <h2>{{ item.question || item.source_id }}</h2>
        <p>正确答案：{{ item.answer || '暂无' }}</p>
        <p>最后错误答案：{{ item.last_wrong_answer || '暂无' }}</p>
        <p class="muted">错误次数 {{ item.wrong_count || 1 }}，连续答对 {{ item.correct_count_after_wrong || 0 }}/3</p>
        <button type="button" class="secondary-button" @click="practice(item)">重新练习</button>
      </article>
    </div>
    <div v-else class="empty-state">暂无错题。</div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser } from '../services/authService'
import { levels } from '../services/progressService'
import { listWrongQuestions, removeWrongQuestion } from '../services/wrongQuestionService'

const filters = reactive({ level: '', type: '' })
const items = ref([])
const loading = ref(true)
const error = ref('')
let userId = ''

async function load() {
  loading.value = true
  error.value = ''
  try {
    const user = await getCurrentUser()
    userId = user.id
    items.value = await listWrongQuestions(user.id, filters)
  } catch (err) {
    error.value = err.message || '错题读取失败'
  } finally {
    loading.value = false
  }
}

async function remove(id) {
  await removeWrongQuestion(userId, id)
  await load()
}

function practice(item) {
  alert(`重新练习：${item.question || item.source_id}\n正确答案：${item.answer || '暂无'}`)
}

onMounted(load)
</script>
