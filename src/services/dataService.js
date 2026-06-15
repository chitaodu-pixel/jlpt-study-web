const normalizedLevel = (level = 'N2') => level.toLowerCase()

async function loadJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`无法读取数据文件：${path}`)
  return response.json()
}

export function getWords(level) {
  return loadJson(`/data/words/${normalizedLevel(level)}.json`)
}

export function getGrammar(level) {
  return loadJson(`/data/grammar/${normalizedLevel(level)}.json`)
}

export async function getLevelData(level) {
  const [words, grammar] = await Promise.all([getWords(level), getGrammar(level)])
  return { words, grammar }
}

export function findByIds(items, ids = []) {
  const idSet = new Set(ids)
  return items.filter((item) => idSet.has(item.id))
}
