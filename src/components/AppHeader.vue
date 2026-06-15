<template>
  <header class="top-bar">
    <div>
      <p class="eyebrow">{{ label }}</p>
      <h1>{{ title }}</h1>
    </div>
    <button v-if="canLogout" class="ghost-button small" type="button" @click="$emit('logout')">退出</button>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  label: { type: String, default: 'JLPT Study' },
  canLogout: { type: Boolean, default: false },
})
defineEmits(['logout'])
</script>
