export {
  clearDataCache,
  getDataIndex,
  getGrammar,
  getGrammarWithMeta,
  getLevelData,
  getWords,
  getWordsWithMeta,
} from './dataCacheService'

export function findByIds(items, ids = []) {
  const idSet = new Set(ids)
  return items.filter((item) => idSet.has(item.id))
}
