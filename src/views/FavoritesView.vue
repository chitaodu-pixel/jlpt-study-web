<template>
  <section>
    <AppHeader title="收藏夹" label="常复习内容" />
    <div class="filter-row">
      <select v-model="filters.level" @change="load">
        <option value="">全部等级</option>
        <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
      </select>
      <select v-model="filters.type" @change="load">
        <option value="">全部类型</option>
        <option value="word">单词</option>
        <option value="grammar">语法</option>
      </select>
    </div>
    <div v-if="loading" class="empty-state">正在读取收藏...</div>
    <div v-else-if="error" class="empty-state">
      <p class="notice error">{{ error }}</p>
      <button type="button" @click="load">重试</button>
    </div>
    <div v-else-if="items.length" class="card-list">
      <article v-for="item in items" :key="item.id || item.source_id" class="study-card">
        <div class="card-topline">
          <span class="level-pill">{{ item.level }}</span>
          <button class="ghost-button small" type="button" @click="remove(item)">取消收藏</button>
        </div>
        <h2>{{ item.title }}</h2>
        <p class="muted">{{ item.type }}</p>
      </article>
    </div>
    <div v-else class="empty-state">还没有收藏。</div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser } from '../services/authService'
import { listFavorites, removeFavorite } from '../services/favoriteService'
import { levels } from '../services/progressService'

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
    items.value = await listFavorites(user.id, filters)
  } catch (err) {
    error.value = err.message || '收藏读取失败'
  } finally {
    loading.value = false
  }
}

async function remove(item) {
  await removeFavorite(userId, item.type, item.source_id)
  await load()
}

onMounted(load)
</script>
