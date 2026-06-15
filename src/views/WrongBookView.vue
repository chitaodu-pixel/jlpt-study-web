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
    <div v-if="items.length" class="card-list">
      <article v-for="item in items" :key="item.id" class="study-card">
        <div class="card-topline">
          <span class="level-pill">{{ item.level }}</span>
          <button class="ghost-button small" type="button" @click="remove(item.id)">移除</button>
        </div>
        <h2>{{ item.prompt }}</h2>
        <p>正确答案：{{ item.correct_answer }}</p>
        <p>最后错误答案：{{ item.last_wrong_answer }}</p>
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
import { listWrongQuestions, removeWrongQuestion } from '../services/wrongQuestionService'

const levels = ['N5', 'N4', 'N3', 'N2', 'N1']
const filters = reactive({ level: '', type: '' })
const items = ref([])
let userId = ''

onMounted(load)

async function load() {
  const user = await getCurrentUser()
  userId = user.id
  items.value = await listWrongQuestions(user.id, filters)
}

async function remove(id) {
  await removeWrongQuestion(userId, id)
  await load()
}

function practice(item) {
  alert(`重新练习：${item.prompt}\n正确答案：${item.correct_answer}`)
}
</script>
