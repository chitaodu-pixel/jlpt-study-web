export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function waitForVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length) {
      resolve(voices)
      return
    }

    const timer = window.setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null
      resolve(window.speechSynthesis.getVoices())
    }, 800)

    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timer)
      window.speechSynthesis.onvoiceschanged = null
      resolve(window.speechSynthesis.getVoices())
    }
  })
}

function findJapaneseVoice(voices) {
  return voices.find((voice) => voice.lang === 'ja-JP') || voices.find((voice) => voice.lang?.startsWith('ja')) || null
}

export async function speakJapanese(text) {
  const safeText = String(text || '').trim()
  if (!safeText) throw new Error('没有可朗读的日语内容')
  if (!canSpeak()) throw new Error('当前浏览器不支持 speechSynthesis')

  const voices = await waitForVoices()
  const voice = findJapaneseVoice(voices)
  const utterance = new SpeechSynthesisUtterance(safeText)

  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  utterance.pitch = 1
  if (voice) utterance.voice = voice

  window.speechSynthesis.cancel()
  window.speechSynthesis.resume()
  window.speechSynthesis.speak(utterance)
}
