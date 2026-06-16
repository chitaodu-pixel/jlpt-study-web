<template>
  <section>
    <AppHeader title="我的设置" label="学习偏好" />
    <div v-if="loading" class="empty-state">正在读取设置...</div>
    <div v-else-if="loadError" class="empty-state">
      <p class="notice error">{{ loadError }}</p>
      <button type="button" @click="load">重试</button>
    </div>
    <template v-else>
      <form class="form-stack panel" @submit.prevent="save">
        <label>
          目标等级
          <select v-model="form.target_level">
            <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
          </select>
        </label>
        <label>
          每日单词数量
          <input v-model.number="form.daily_words" type="number" min="1" max="100" />
        </label>
        <label>
          每日语法数量
          <input v-model.number="form.daily_grammar" type="number" min="1" max="50" />
        </label>
        <label>
          每日习题数量
          <input v-model.number="form.daily_questions" type="number" min="1" max="100" />
        </label>
        <label>
          考试日期
          <input v-model="form.exam_date" type="date" />
        </label>
        <p v-if="message" class="notice success">{{ message }}</p>
        <p v-if="error" class="notice error">{{ error }}</p>
        <button type="submit" :disabled="saving">{{ saving ? '保存中...' : '保存设置' }}</button>
      </form>

      <section class="section-block">
        <h2>本地缓存</h2>
        <p class="muted">清除后，下次进入单词或语法页会重新读取 JSON 数据。</p>
        <button class="wide-button secondary-button" type="button" @click="clearCache">清除本地缓存</button>
      </section>

      <div class="action-grid compact">
        <RouterLink to="/favorites">收藏夹</RouterLink>
        <RouterLink to="/wrong-book">错题本</RouterLink>
      </div>
    </template>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser } from '../services/authService'
import { clearDataCache } from '../services/dataService'
import { defaultSettings, getOrCreateSettings, levels, saveSettings } from '../services/progressService'

const form = reactive({ ...defaultSettings })
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const error = ref('')
const loadError = ref('')
let userId = ''

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const user = await getCurrentUser()
    userId = user.id
    Object.assign(form, await getOrCreateSettings(user.id))
  } catch (err) {
    loadError.value = err.message || '设置加载失败'
  } finally {
    loading.value = false
  }
}

async function save() {
  message.value = ''
  error.value = ''
  saving.value = true
  try {
    await saveSettings(userId, form)
    message.value = '设置已保存。'
  } catch (err) {
    error.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function clearCache() {
  message.value = ''
  error.value = ''
  try {
    await clearDataCache()
    message.value = '本地缓存已清除。'
  } catch (err) {
    error.value = err.message || '清除缓存失败'
  }
}

onMounted(load)
</script>
