import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const WORD_DIR = path.join(ROOT, 'public', 'data', 'words')
const VERSION_PATH = path.join(ROOT, 'public', 'data', 'version.json')
const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
const TEMPLATE_MARKER = 'という言葉を覚えました'

const topicSets = {
  n5: ['家で', '朝', '学校で', '駅で', '友達と', 'スーパーで'],
  n4: ['週末に', '会社で', '旅行中に', '店で', '家族と', '授業で'],
  n3: ['最近', '仕事で', '会議の前に', '帰り道で', '友人と話していて', '予定を立てる時に'],
  n2: ['日常生活で', '職場で', 'ニュースを見て', '将来のことを考えて', '予定が変わって', '大事な場面で'],
  n1: ['社会の中で', '議論の中で', '状況を見極めて', '人間関係において', '長い経験から', '重要な判断をする時に'],
}

const cnTopic = {
  家で: '在家里',
  朝: '早上',
  学校で: '在学校',
  駅で: '在车站',
  友達と: '和朋友',
  スーパーで: '在超市',
  週末に: '周末',
  会社で: '在公司',
  旅行中に: '旅行中',
  店で: '在店里',
  家族と: '和家人',
  授業で: '上课时',
  最近: '最近',
  仕事で: '工作中',
  会議の前に: '会议前',
  帰り道で: '回家路上',
  友人と話していて: '和朋友聊天时',
  予定を立てる時に: '制定计划时',
  日常生活で: '日常生活中',
  職場で: '在职场',
  ニュースを見て: '看新闻时',
  将来のことを考えて: '思考未来时',
  予定が変わって: '计划改变后',
  大事な場面で: '重要场合',
  社会の中で: '在社会中',
  議論の中で: '讨论中',
  状況を見極めて: '看清形势后',
  人間関係において: '在人际关系中',
  長い経験から: '从长期经验来看',
  重要な判断をする時に: '做重要判断时',
}

function pick(items, seed) {
  return items[Math.abs(seed) % items.length]
}

function seedOf(text) {
  let seed = 0
  for (const char of text) seed = (seed * 31 + char.charCodeAt(0)) | 0
  return seed
}

function cleanMeaning(item) {
  return (
    String(item.meaning_cn || item.meaning || '这个词')
      .split(/[；,，。]/)[0]
      .replace(/[（）()]/g, '')
      .replace(/^(动词|名词|形容词|副词|他动词|自动词)+/g, '')
      .trim() || '这个词'
  )
}

function isTemplateExample(item) {
  return !item.example || item.example.includes(TEMPLATE_MARKER) || item.example_source === 'local_rule_daily_life'
}

function posKind(pos = '') {
  const value = pos.toLowerCase()
  if (value.includes('suru noun')) return 'suru'
  if (value.includes('verb')) return 'verb'
  if (value.includes('i adjective') || value.includes('い adjective')) return 'i-adj'
  if (value.includes('na adjective') || value.includes('な adjective')) return 'na-adj'
  if (value.includes('adverb')) return 'adverb'
  return 'noun'
}

function particleFor(word) {
  if (/[るうくぐすつぬぶむ]$/.test(word)) return ''
  return 'を'
}

function generateExample(item, index) {
  const level = item.level.toLowerCase()
  const word = item.word
  const meaning = cleanMeaning(item)
  const seed = seedOf(`${item.id}:${word}:${index}`)
  const topic = pick(topicSets[level] || topicSets.n3, seed)
  const topicCn = cnTopic[topic] || '生活中'
  const kind = posKind(item.pos)

  if (kind === 'suru') {
    const topics = ['授業で', '仕事で', '友達と', '会議の前に', '週末に']
    const topicForSuru = pick(topics, seed)
    return {
      example: `${topicForSuru}、${word}をしました。`,
      example_cn: `${cnTopic[topicForSuru] || topicCn}，做了“${meaning}”。`,
    }
  }

  if (kind === 'verb') {
    const topics = ['必要な時に', '家で', '朝', '仕事の後で', '外出先で']
    const topicForVerb = pick(topics, seed)
    return {
      example: `${topicForVerb}、${word}ことがあります。`,
      example_cn: `${cnTopic[topicForVerb] || '有需要的时候'}，会有“${meaning}”这样的情况。`,
    }
  }

  if (kind === 'i-adj') {
    const topics = ['その時', '朝', '外に出た時', '友達と話していて', 'ニュースを見て']
    const topicForAdj = pick(topics, seed)
    return {
      example: `${topicForAdj}、${word}と感じました。`,
      example_cn: `${cnTopic[topicForAdj] || '那时'}，我觉得很“${meaning}”。`,
    }
  }

  if (kind === 'na-adj') {
    const topics = ['その人は', 'この方法は', 'その考え方は', '職場で見た対応は', '友人の説明は']
    const cnSubjects = {
      その人は: '那个人',
      この方法は: '这个方法',
      その考え方は: '那个想法',
      職場で見た対応は: '在职场看到的处理方式',
      友人の説明は: '朋友的说明',
    }
    const topicForNa = pick(topics, seed)
    return {
      example: `${topicForNa}${word}だと思いました。`,
      example_cn: `我觉得${cnSubjects[topicForNa]}很“${meaning}”。`,
    }
  }

  if (kind === 'adverb') {
    const topics = ['会議で', '友達と話す時', '大事な話をする時', '仕事中に', '授業で']
    const topicForAdverb = pick(topics, seed)
    return {
      example: `${topicForAdverb}、${word}話すようにしています。`,
      example_cn: `${cnTopic[topicForAdverb] || topicCn}，我会尽量“${meaning}”地说话。`,
    }
  }

  const nounTopics = ['友達と', '家族と', '学校で', '会社で', 'ニュースを見て', '週末に']
  const topicForNoun = pick(nounTopics, seed)
  const nounPatterns = [
    {
      example: `${topicForNoun}、${word}のことを話しました。`,
      example_cn: `${cnTopic[topicForNoun] || topicCn}，我们聊到了“${meaning}”。`,
    },
    {
      example: `${topicForNoun}、${word}が話題になりました。`,
      example_cn: `${cnTopic[topicForNoun] || topicCn}，“${meaning}”成了话题。`,
    },
    {
      example: `${topicForNoun}、${word}について調べました。`,
      example_cn: `${cnTopic[topicForNoun] || topicCn}，我查了一下“${meaning}”。`,
    },
  ]
  return pick(nounPatterns, seed)
}

async function updateVersion() {
  const version = JSON.parse(await fs.readFile(VERSION_PATH, 'utf8'))
  version.version = '2026-06-16-003'
  for (const key of Object.keys(version.words || {})) version.words[key] = '2026-06-16-003'
  await fs.writeFile(VERSION_PATH, `${JSON.stringify(version, null, 2)}\n`, 'utf8')
}

for (const level of LEVELS) {
  const filePath = path.join(WORD_DIR, `${level}.json`)
  const words = JSON.parse(await fs.readFile(filePath, 'utf8'))
  let changed = 0
  words.forEach((item, index) => {
    if (!isTemplateExample(item)) return
    const next = generateExample(item, index)
    item.example = next.example
    item.example_cn = next.example_cn
    item.example_source = 'local_rule_daily_life'
    changed += 1
  })
  await fs.writeFile(filePath, `${JSON.stringify(words, null, 2)}\n`, 'utf8')
  console.log(`${level.toUpperCase()}: updated ${changed}/${words.length}`)
}

await updateVersion()
