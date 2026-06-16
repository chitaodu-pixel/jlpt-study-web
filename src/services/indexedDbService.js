const DB_NAME = 'jlpt-study-web'
const DB_VERSION = 1
const STORE_NAME = 'dataCache'

function isIndexedDbAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function openDatabase() {
  if (!isIndexedDbAvailable()) return Promise.resolve(null)

  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
}

async function withStore(mode, handler) {
  const db = await openDatabase()
  if (!db) return null

  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const result = handler(store)

    transaction.oncomplete = () => {
      db.close()
      resolve(result?.result ?? result ?? true)
    }
    transaction.onerror = () => {
      db.close()
      resolve(null)
    }
  })
}

export function getCacheItem(key) {
  return withStore('readonly', (store) => store.get(key))
}

export function setCacheItem(key, value) {
  return withStore('readwrite', (store) => store.put({ key, ...value, cachedAt: new Date().toISOString() }))
}

export function removeCacheItem(key) {
  return withStore('readwrite', (store) => store.delete(key))
}

export function clearCache() {
  return withStore('readwrite', (store) => store.clear())
}
