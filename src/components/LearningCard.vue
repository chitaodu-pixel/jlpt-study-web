<template>
  <article class="study-card">
    <div class="card-topline">
      <span class="level-pill">{{ item.level }}</span>
      <button class="ghost-button small" type="button" @click="$emit('favorite', item)">收藏</button>
    </div>

    <template v-if="type === 'word'">
      <h2 class="jp-title">{{ item.word }}</h2>
      <p class="kana">{{ item.kana }}</p>
      <p class="meaning">{{ item.meaning_cn || item.meaning }}</p>
      <p v-if="item.meaning && item.meaning_cn && item.meaning !== item.meaning_cn" class="muted">英文释义：{{ item.meaning }}</p>
      <p v-if="item.meaning_extra" class="muted">补充：{{ item.meaning_extra }}</p>
      <div v-if="item.example" class="example-box">
        <p>{{ item.example }}</p>
        <span>{{ item.example_cn }}</span>
      </div>
      <div v-else class="example-box muted">暂无例句</div>
      <div class="button-row">
        <button type="button" class="secondary-button" @click="$emit('speak', item.word)">单词发音</button>
        <button type="button" class="secondary-button" :disabled="!item.example" @click="$emit('speak', item.example)">例句发音</button>
      </div>
    </template>

    <template v-else>
      <h2 class="jp-title">{{ item.grammar }}</h2>
      <p class="meaning">{{ item.meaning }}</p>
      <dl class="detail-list">
        <div><dt>接续</dt><dd>{{ item.usage || '暂无' }}</dd></div>
        <div><dt>易错点</dt><dd>{{ item.note || '暂无' }}</dd></div>
      </dl>
      <div v-if="item.example" class="example-box">
        <p>{{ item.example }}</p>
        <span>{{ item.example_cn }}</span>
      </div>
      <div v-else class="example-box muted">暂无例句</div>
      <div class="button-row">
        <button type="button" class="secondary-button" :disabled="!item.example" @click="$emit('speak', item.example)">例句发音</button>
      </div>
    </template>
  </article>
</template>

<script setup>
defineProps({
  item: { type: Object, required: true },
  type: { type: String, required: true },
})
defineEmits(['favorite', 'speak'])
</script>
