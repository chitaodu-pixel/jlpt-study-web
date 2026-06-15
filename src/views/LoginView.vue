<template>
  <section class="auth-screen">
    <div class="auth-card">
      <p class="eyebrow">JLPT Study Web</p>
      <h1>登录</h1>
      <form class="form-stack" @submit.prevent="handleLogin">
        <label>
          邮箱
          <input v-model="email" type="email" required autocomplete="email" placeholder="you@example.com" />
        </label>
        <label>
          密码
          <input v-model="password" type="password" required autocomplete="current-password" placeholder="至少 6 位" />
        </label>
        <p v-if="error" class="notice error">{{ error }}</p>
        <button type="submit" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
      </form>
      <RouterLink class="text-link" to="/register">还没有账号？去注册</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signIn } from '../services/authService'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await signIn(email.value, password.value)
    await router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
