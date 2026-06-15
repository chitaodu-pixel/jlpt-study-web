<template>
  <section>
    <AppHeader title="我的设置" label="学习偏好" />
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
      <button type="submit">保存设置</button>
    </form>

    <div class="action-grid compact">
      <RouterLink to="/favorites">收藏夹</RouterLink>
      <RouterLink to="/wrong-book">错题本</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { getCurrentUser } from '../services/authService'
import { defaultSettings, getOrCreateSettings, saveSettings } from '../services/progressService'

const levels = ['N5', 'N4', 'N3', 'N2', 'N1']
const form = reactive({ ...defaultSettings })
const message = ref('')
const error = ref('')
let userId = ''

onMounted(async () => {
  const user = await getCurrentUser()
  userId = user.id
  Object.assign(form, await getOrCreateSettings(user.id))
})

async function save() {
  message.value = ''
  error.value = ''
  try {
    await saveSettings(userId, form)
    message.value = '设置已保存'
  } catch (err) {
    error.value = err.message
  }
}
</script>
