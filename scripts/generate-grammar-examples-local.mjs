import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const GRAMMAR_DIR = path.join(ROOT, 'public', 'data', 'grammar')
const VERSION_PATH = path.join(ROOT, 'public', 'data', 'version.json')
const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']

const topicsByLevel = {
  n5: ['今日は', '学校で', '家で', '朝', '友達と'],
  n4: ['週末は', '授業で', '旅行中に', '会社で', '駅で'],
  n3: ['最近', '仕事で', '会議の前に', '帰り道で', '予定を決める時に'],
  n2: ['日常生活では', '職場では', '大事な場面では', '予定が変わった時に', 'ニュースを見て'],
  n1: ['社会では', '議論の中では', '重要な判断をする時には', '人間関係においては', '状況によっては'],
}

const cnTopic = {
  今日は: '今天',
  学校で: '在学校',
  家で: '在家里',
  朝: '早上',
  友達と: '和朋友',
  週末は: '周末',
  授業で: '上课时',
  旅行中に: '旅行中',
  会社で: '在公司',
  駅で: '在车站',
  最近: '最近',
  仕事で: '工作中',
  会議の前に: '会议前',
  帰り道で: '回家路上',
  予定を決める時に: '决定计划时',
  日常生活では: '日常生活中',
  職場では: '职场中',
  大事な場面では: '重要场合',
  予定が変わった時に: '计划改变时',
  ニュースを見て: '看新闻时',
  社会では: '社会中',
  議論の中では: '讨论中',
  重要な判断をする時には: '做重要判断时',
  人間関係においては: '在人际关系中',
  状況によっては: '根据情况',
}

function seedOf(text) {
  let seed = 0
  for (const char of text) seed = (seed * 31 + char.charCodeAt(0)) | 0
  return seed
}

function pick(items, seed) {
  return items[Math.abs(seed) % items.length]
}

function cleanGrammar(grammar) {
  return String(grammar)
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[~～]/g, '')
    .split(/[・、,/]/)[0]
    .trim()
}

function cleanMeaning(meaning) {
  return (
    String(meaning || '这个语法')
      .split(/[;；,，。]/)[0]
      .replace(/[~～]/g, '')
      .trim() || '这个语法'
  )
}

function shouldUpdate(item) {
  return !item.example || !item.example_cn || item.example_source === 'local_rule_daily_life'
}

function exampleFor(item, index) {
  const level = item.level.toLowerCase()
  const seed = seedOf(`${item.id}:${item.grammar}:${index}`)
  const topic = pick(topicsByLevel[level] || topicsByLevel.n3, seed)
  const topicText = cnTopic[topic] || '生活中'
  const grammar = cleanGrammar(item.grammar)
  const meaning = cleanMeaning(item.meaning)

  const patterns = [
    {
      example: `${topic}、この表現は「${grammar}」を使って説明できます。`,
      example_cn: `${topicText}，这个表达可以用“${grammar}”来说明，意思是“${meaning}”。`,
    },
    {
      example: `${topic}、「${grammar}」を使うと自然に聞こえます。`,
      example_cn: `${topicText}，使用“${grammar}”会听起来更自然，表示“${meaning}”。`,
    },
    {
      example: `${topic}、先生は「${grammar}」の使い方を説明しました。`,
      example_cn: `${topicText}，老师说明了“${grammar}”的用法，意思是“${meaning}”。`,
    },
  ]

  if (/なければならない|なくてはいけない|ちゃいけない|じゃいけない|てはいけない/.test(grammar)) {
    return {
      example: '明日は早いので、夜更かししてはいけません。',
      example_cn: `因为明天要早起，所以不能熬夜。这里练习“${grammar}”，表示“${meaning}”。`,
    }
  }

  if (/たい|たがる/.test(grammar)) {
    return {
      example: '週末は友達と映画を見に行きたいです。',
      example_cn: `周末想和朋友去看电影。这里练习“${grammar}”，表示“${meaning}”。`,
    }
  }

  if (/ながら/.test(grammar)) {
    return {
      example: '音楽を聞きながら、部屋を片付けました。',
      example_cn: `一边听音乐，一边收拾房间。这里练习“${grammar}”，表示“${meaning}”。`,
    }
  }

  if (/と思う|でしょう|だろう|かもしれない/.test(grammar)) {
    return {
      example: '午後から雨が降るかもしれません。',
      example_cn: `下午可能会下雨。这里练习“${grammar}”，表示“${meaning}”。`,
    }
  }

  if (/ので|から|ため/.test(grammar)) {
    return {
      example: '電車が遅れたので、少し遅刻しました。',
      example_cn: `因为电车晚点了，所以稍微迟到了。这里练习“${grammar}”，表示“${meaning}”。`,
    }
  }

  if (/時|間|うちに|ところ/.test(grammar)) {
    return {
      example: '子どもが寝ている間に、夕食を作りました。',
      example_cn: `孩子睡觉的时候，我做了晚饭。这里练习“${grammar}”，表示“${meaning}”。`,
    }
  }

  return pick(patterns, seed)
}

async function updateVersion() {
  const version = JSON.parse(await fs.readFile(VERSION_PATH, 'utf8'))
  version.version = '2026-06-16-004'
  for (const key of Object.keys(version.grammar || {})) version.grammar[key] = '2026-06-16-004'
  await fs.writeFile(VERSION_PATH, `${JSON.stringify(version, null, 2)}\n`, 'utf8')
}

for (const level of LEVELS) {
  const filePath = path.join(GRAMMAR_DIR, `${level}.json`)
  const items = JSON.parse(await fs.readFile(filePath, 'utf8'))
  let changed = 0
  items.forEach((item, index) => {
    if (!shouldUpdate(item)) return
    const next = exampleFor(item, index)
    item.example = next.example
    item.example_cn = next.example_cn
    item.example_source = 'local_rule_daily_life'
    changed += 1
  })
  await fs.writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, 'utf8')
  console.log(`${level.toUpperCase()}: updated ${changed}/${items.length}`)
}

await updateVersion()
