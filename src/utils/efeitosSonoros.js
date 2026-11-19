// Efeitos sonoros da Chamada: pequenos "plins" feitos pelo próprio navegador (Web Audio).
// Não usa arquivos de áudio. Ficam ligados por padrão; quem não gostar desliga e o navegador lembra.

let contexto = null
let ligado = localStorage.getItem('tl_efeitos') !== 'nao'

export const efeitosLigados = () => ligado

export function ligarEfeitos(valor) {
  ligado = valor
  localStorage.setItem('tl_efeitos', valor ? 'sim' : 'nao')
}

// Cada efeito é uma lista de notas: de/ate = frequência em Hz, inicio/duracao = tempo em segundos
const EFEITOS = {
  entrou: [{ de: 587, inicio: 0, duracao: 0.14 }, { de: 880, inicio: 0.12, duracao: 0.2 }],   // sobe: alguém chegou
  saiu: [{ de: 880, inicio: 0, duracao: 0.14 }, { de: 587, inicio: 0.12, duracao: 0.2 }],      // desce: alguém foi embora
  mutou: [{ de: 440, ate: 294, inicio: 0, duracao: 0.16 }],                                     // "blup" para baixo
  desmutou: [{ de: 294, ate: 440, inicio: 0, duracao: 0.16 }],                                  // "blup" para cima
}
const VOLUME = 0.22

export function tocarEfeito(nome) {
  if (!ligado || !EFEITOS[nome]) return
  const Contexto = window.AudioContext || window.webkitAudioContext
  if (!Contexto) return
  try {
    if (!contexto || contexto.state === 'closed') contexto = new Contexto()
    if (contexto.state === 'suspended') contexto.resume().catch(() => {})
    EFEITOS[nome].forEach((nota) => {
      const inicio = contexto.currentTime + nota.inicio
      const fim = inicio + nota.duracao
      const oscilador = contexto.createOscillator()
      const volume = contexto.createGain()
      oscilador.type = 'sine'
      oscilador.frequency.setValueAtTime(nota.de, inicio)
      if (nota.ate) oscilador.frequency.exponentialRampToValueAtTime(nota.ate, fim)
      volume.gain.setValueAtTime(0.0001, inicio)
      volume.gain.exponentialRampToValueAtTime(VOLUME, inicio + 0.015) // sobe rápido (sem estalo)
      volume.gain.exponentialRampToValueAtTime(0.0001, fim)            // e some suave
      oscilador.connect(volume)
      volume.connect(contexto.destination)
      oscilador.start(inicio)
      oscilador.stop(fim + 0.02)
    })
  } catch { /* sem som, a chamada segue normal */ }
}
