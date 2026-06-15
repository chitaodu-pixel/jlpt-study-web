<template>
  <section>
    <AppHeader title="收藏夹" label="常复习内容" />
    <div v-if="items.length" class="card-list">
      <article v-for="item in items" :key="item.id || item.source_id" class="study-card">
        <div class="card-topline">
          <span class="level-pill">{{ item.level }}</span>
          <button class="ghost-button small" type="button" @click="remove(item)">取消收藏</button>
        </div>
        <h2>{{ item.title }}</h2>
        <p>{{ item.subtitle }}</p>
        <p class="muted">{{ item.type }}</p>
      </article>
    </div>
    <div v-else class="empty-state">还没有收藏。</div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser } from '../services/authService'
import { listFavorites, removeFavorite } from '../services/favoriteService'

const items = ref([])
let userId = ''

onMounted(load)

async function load() {
  const user = await getCurrentUser()
  userId = user.id
  items.value = await listFavorites(user.id)
}

async function remove(item) {
  await removeFavorite(userId, item.type, item.source_id)
  await load()
}
</script>
