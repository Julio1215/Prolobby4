// Detector de fala da Chamada: mede o volume do áudio de cada pessoa para saber quem está falando.
// Usa a Web Audio API do navegador, não precisa instalar nada.

const LIMITE_FALA = 0.012   // volume (de 0 a 1) a partir do qual a pessoa conta como "falando"
const SEGURAR_FALA = 400    // ms que o "falando" continua depois do último som (evita piscar entre as palavras)
const INTERVALO = 100       // de quanto em quanto tempo (ms) o volume é medido

let contexto = null         // um único AudioContext para todo mundo (o navegador limita quantos podem existir)

// Cria um medidor para um fluxo de áudio:
//   medidor.volume() devolve o volume neste instante (0 a 1)
//   medidor.parar() encerra a medição
function criarMedidor(fluxo) {
  const parado = { volume: () => 0, parar: () => {} }
  const Contexto = window.AudioContext || window.webkitAudioContext
  if (!Contexto || !fluxo || fluxo.getAudioTracks().length === 0) return parado
  try {
    if (!contexto || contexto.state === 'closed') contexto = new Contexto()
    if (contexto.state === 'suspended') contexto.resume().catch(() => {})
    const fonte = contexto.createMediaStreamSource(fluxo)
    const analisador = contexto.createAnalyser()
    analisador.fftSize = 2048
    fonte.connect(analisador)   // só mede: não liga na saída, então o som não toca duas vezes
    const amostras = new Float32Array(analisador.fftSize)
    return {
      volume() {
        analisador.getFloatTimeDomainData(amostras)
        let soma = 0
        for (let i = 0; i < amostras.length; i++) soma += amostras[i] * amostras[i]
        return Math.sqrt(soma / amostras.length)   // volume médio da onda (RMS)
      },
      parar() { try { fonte.disconnect() } catch { /* já estava desligado */ } },
    }
  } catch {
    return parado
  }
}

// Observa vários fluxos de uma vez. fluxos = { idDaPessoa: fluxoDeVoz }
// A cada 0,1 s chama aoMudar(ids de quem está falando). Devolve uma função que para tudo.
export function observarFalas(fluxos, aoMudar) {
  const medidores = {}
  Object.entries(fluxos).forEach(([id, fluxo]) => { medidores[id] = criarMedidor(fluxo) })
  const ultimaFala = {}   // id -> momento em que a pessoa foi ouvida pela última vez

  const relogio = setInterval(() => {
    const agora = Date.now()
    const quem = []
    Object.entries(medidores).forEach(([id, medidor]) => {
      let volume = 0
      try { volume = medidor.volume() } catch { /* fluxo acabou: conta como silêncio */ }
      if (volume > LIMITE_FALA) ultimaFala[id] = agora
      if (agora - (ultimaFala[id] || 0) < SEGURAR_FALA) quem.push(id)
    })
    aoMudar(quem)
  }, INTERVALO)

  return () => {
    clearInterval(relogio)
    Object.values(medidores).forEach((medidor) => medidor.parar())
  }
}
