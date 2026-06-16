import { clearCache, getCacheItem, setCacheItem } from './indexedDbService'

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1']
const VERSION_PATH = '/data/version.json'
const INDEX_PATH = '/data/index.json'
const CACHE_WARNING = '正在使用本地缓存。'

let versionPromise = null
let indexPromise = null

function normalizeLevel(level = 'N2') {
  const value = String(level).toUpperCase()
  return LEVELS.includes(value) ? value : 'N2'
}

async function fetchJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`无法读取数据文件：${path}`)
  return response.json()
}

export function getDataIndex() {
  if (!indexPromise) indexPromise = fetchJson(INDEX_PATH)
  return indexPromise
}

async function getVersion() {
  if (!versionPromise) versionPromise = fetchJson(VERSION_PATH)
  return versionPromise
}

function cacheKey(type, level) {
  return `${type}_${normalizeLevel(level)}`
}

function dataPath(type, level) {
  return `/data/${type}/${normalizeLevel(level).toLowerCase()}.json`
}

async function readCachedJson(type, level) {
  const normalized = normalizeLevel(level)
  const key = cacheKey(type, normalized)
  const cached = await getCacheItem(key)
  let version = null

  try {
    const versions = await getVersion()
    version = versions?.[type]?.[normalized] || versions?.version || null
  } catch {
    if (cached?.data) return { data: cached.data, warning: CACHE_WARNING, fromCache: true }
  }

  if (cached?.data && cached.version === version) {
    return { data: cached.data, fromCache: true, warning: '' }
  }

  try {
    const data = await fetchJson(dataPath(type, normalized))
    await setCacheItem(key, { version, data })
    return { data, fromCache: false, warning: '' }
  } catch (error) {
    if (cached?.data) return { data: cached.data, fromCache: true, warning: CACHE_WARNING }
    throw error
  }
}

export function getWordsWithMeta(level) {
  return readCachedJson('words', level)
}

export function getGrammarWithMeta(level) {
  return readCachedJson('grammar', level)
}

export async function getWords(level) {
  const { data } = await getWordsWithMeta(level)
  return data
}

export async function getGrammar(level) {
  const { data } = await getGrammarWithMeta(level)
  return data
}

export async function getLevelData(level) {
  const [words, grammar] = await Promise.all([getWords(level), getGrammar(level)])
  return { words, grammar }
}

export async function clearDataCache() {
  versionPromise = null
  indexPromise = null
  await clearCache()
}
