import { mkdir, writeFile } from 'node:fs/promises'

const levels = ['n1', 'n2', 'n3', 'n4', 'n5']
const baseUrl = 'https://jlptsensei.com'

function decodeHtml(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/\u200b/g, '')
    .trim()
}

function splitRows(tableHtml) {
  return tableHtml
    .split(/<tr\b[^>]*>/i)
    .slice(2)
    .map((row) => row.split(/<\/tr>/i)[0])
    .filter((row) => /<td\b/i.test(row))
}

function splitCells(rowHtml) {
  return rowHtml
    .split(/<td\b[^>]*>/i)
    .slice(1)
    .map((cell) => cell.split(/(?=<td\b)|<\/tr>/i)[0])
}

function firstLinkText(cellHtml) {
  const match = cellHtml.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)
  return decodeHtml(match?.[1] || cellHtml)
}

function firstParagraphText(cellHtml) {
  const match = cellHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)
  return decodeHtml(match?.[1] || '')
}

function tableById(html, id) {
  const start = html.search(new RegExp(`<table[^>]+id=${id}|<table[^>]+id=["']${id}["']`, 'i'))
  if (start < 0) return ''
  const end = html.indexOf('</table>', start)
  return end < 0 ? '' : html.slice(start, end + 8)
}

function nextPageUrls(html) {
  return [
    ...html.matchAll(/href=["']([^"']+\/page\/\d+\/?)["']/gi),
    ...html.matchAll(/href=([^\s>]+\/page\/\d+\/?)/gi),
  ]
    .map((match) => new URL(match[1], baseUrl).toString())
    .filter((url, index, array) => array.indexOf(url) === index)
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 jlpt-study-web data refresh',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return response.text()
}

async function collectPages(startUrl) {
  const seen = new Set()
  const queue = [startUrl]
  const pages = []

  while (queue.length) {
    const url = queue.shift()
    if (seen.has(url)) continue
    seen.add(url)

    const html = await fetchHtml(url)
    pages.push({ url, html })

    for (const nextUrl of nextPageUrls(html)) {
      if (!seen.has(nextUrl) && nextUrl.startsWith(startUrl)) {
        queue.push(nextUrl)
      }
    }
  }

  return pages.sort((a, b) => {
    const pageNumber = (url) => Number(url.match(/\/page\/(\d+)/)?.[1] || 1)
    return pageNumber(a.url) - pageNumber(b.url)
  })
}

function parseVocabulary(pages, level) {
  const items = []
  const seen = new Set()

  for (const { html } of pages) {
    const table = tableById(html, 'jl-vocab')
    for (const row of splitRows(table)) {
      const cells = splitCells(row)
      const word = firstLinkText(cells[1] || '')
      const kana = firstParagraphText(cells[2] || '') || word
      const meaning = decodeHtml(cells[4] || '')
      if (!word || !meaning || seen.has(word)) continue
      seen.add(word)
      items.push({
        id: `${level}_word_${String(items.length + 1).padStart(4, '0')}`,
        level: level.toUpperCase(),
        word,
        kana,
        meaning,
        example: '',
        example_cn: '',
      })
    }
  }

  return items
}

function parseGrammar(pages, level) {
  const items = []
  const seen = new Set()

  for (const { html } of pages) {
    const table = tableById(html, 'jl-grammar')
    for (const row of splitRows(table)) {
      const cells = splitCells(row)
      const grammar = firstLinkText(cells[2] || '')
      const meaning = decodeHtml(cells[3] || '')
      if (!grammar || !meaning || seen.has(grammar)) continue
      seen.add(grammar)
      items.push({
        id: `${level}_grammar_${String(items.length + 1).padStart(4, '0')}`,
        level: level.toUpperCase(),
        grammar,
        meaning,
        usage: '',
        example: '',
        example_cn: '',
        note: '',
      })
    }
  }

  return items
}

async function main() {
  await mkdir('public/data/words', { recursive: true })
  await mkdir('public/data/grammar', { recursive: true })

  const summary = []

  for (const level of levels) {
    const vocabPages = await collectPages(`${baseUrl}/jlpt-${level}-vocabulary-list/`)
    const words = parseVocabulary(vocabPages, level)
    await writeFile(`public/data/words/${level}.json`, `${JSON.stringify(words, null, 2)}\n`, 'utf8')
    summary.push(`${level.toUpperCase()} words: ${words.length} entries from ${vocabPages.length} pages`)

    const grammarPages = await collectPages(`${baseUrl}/jlpt-${level}-grammar-list/`)
    const grammar = parseGrammar(grammarPages, level)
    await writeFile(`public/data/grammar/${level}.json`, `${JSON.stringify(grammar, null, 2)}\n`, 'utf8')
    summary.push(`${level.toUpperCase()} grammar: ${grammar.length} entries from ${grammarPages.length} pages`)
  }

  console.log(summary.join('\n'))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
