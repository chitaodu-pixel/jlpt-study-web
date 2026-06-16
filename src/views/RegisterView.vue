<template>
  <section class="auth-screen">
    <div class="auth-card">
      <p class="eyebrow">JLPT Study Web</p>
      <h1>注册</h1>
      <form class="form-stack" @submit.prevent="handleRegister">
        <label>
          邮箱
          <input v-model="email" type="email" required autocomplete="email" placeholder="you@example.com" />
        </label>
        <label>
          密码
          <input v-model="password" type="password" required autocomplete="new-password" placeholder="至少 6 位" />
        </label>
        <p v-if="message" class="notice success">{{ message }}</p>
        <p v-if="error" class="notice error">{{ error }}</p>
        <button type="submit" :disabled="loading">{{ loading ? '注册中...' : '注册' }}</button>
      </form>
      <RouterLink class="text-link" to="/login">已有账号？去登录</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { signUp } from '../services/authService'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

async function handleRegister() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    await signUp(email.value, password.value)
    message.value = '注册成功，可以直接登录。'
  } catch (err) {
    error.value = err.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>
