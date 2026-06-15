<template>
  <div class="app-shell">
    <main class="app-main">
      <RouterView />
    </main>
    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => !['login', 'register'].includes(route.name))
</script>
