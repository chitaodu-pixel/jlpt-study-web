export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakJapanese(text) {
  if (!canSpeak()) throw new Error('当前浏览器不支持 speechSynthesis')
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}
