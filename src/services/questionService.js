function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function buildOptions(correct, pool, pickValue) {
  const wrong = shuffle(pool.map(pickValue).filter((value) => value && value !== correct)).slice(0, 3)
  return shuffle([...new Set([correct, ...wrong])]).slice(0, 4)
}

export function generateQuestions(todayWords, todayGrammar, allWords, allGrammar, limit = 25) {
  const questions = []

  todayWords.forEach((word) => {
    questions.push({
      id: `${word.id}_meaning`,
      source_id: word.id,
      type: 'word_meaning',
      level: word.level,
      prompt: word.word,
      prompt_hint: '选择中文意思',
      answer: word.meaning,
      options: buildOptions(word.meaning, allWords, (item) => item.meaning),
      explanation: `${word.word}（${word.kana}）的意思是：${word.meaning}`,
    })
    questions.push({
      id: `${word.id}_kana`,
      source_id: word.id,
      type: 'word_kana',
      level: word.level,
      prompt: word.word,
      prompt_hint: '选择正确假名',
      answer: word.kana,
      options: buildOptions(word.kana, allWords, (item) => item.kana),
      explanation: `${word.word} 的读音是 ${word.kana}`,
    })
    questions.push({
      id: `${word.id}_reverse`,
      source_id: word.id,
      type: 'word_meaning',
      level: word.level,
      prompt: word.meaning,
      prompt_hint: '选择对应日文',
      answer: word.word,
      options: buildOptions(word.word, allWords, (item) => item.word),
      explanation: `${word.meaning} 对应 ${word.word}`,
    })
  })

  todayGrammar.forEach((grammar) => {
    questions.push({
      id: `${grammar.id}_meaning`,
      source_id: grammar.id,
      type: 'grammar_meaning',
      level: grammar.level,
      prompt: grammar.grammar,
      prompt_hint: '选择语法意思',
      answer: grammar.meaning,
      options: buildOptions(grammar.meaning, allGrammar, (item) => item.meaning),
      explanation: `${grammar.grammar} 表示：${grammar.meaning}`,
    })
    questions.push({
      id: `${grammar.id}_reverse`,
      source_id: grammar.id,
      type: 'grammar_meaning',
      level: grammar.level,
      prompt: grammar.meaning,
      prompt_hint: '选择对应语法',
      answer: grammar.grammar,
      options: buildOptions(grammar.grammar, allGrammar, (item) => item.grammar),
      explanation: `${grammar.meaning} 对应 ${grammar.grammar}`,
    })
  })

  return shuffle(questions).slice(0, Number(limit || 25))
}
