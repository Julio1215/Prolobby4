// Player do bot de música da Chamada.
// Toca arquivos de áudio do computador de quem ligou o bot e gera um fluxo (MediaStream) que a Chamada
// manda para todo mundo. Tudo roda no navegador (Web Audio): sem servidor e sem instalar nada.
// Fica fora do React (como a rede da Chamada) para a música continuar ao trocar de página.

let elemento = null      // <audio> que toca os arquivos
let contexto = null      // Web Audio
let destino = null       // dali sai o fluxo que vai para a chamada
let ganhoLocal = null    // volume do que EU escuto (não muda o que os outros escutam)

let faixas = []          // [{ nome, url }]
let indice = -1          // faixa atual (-1 = nenhuma)
let repetir = false
let volumeLocal = 0.8
let ligado = false       // o bot está mandando som para a chamada
let desde = 0            // quando o bot foi ligado (quem ligou por último assume o bot)
let falhas = 0           // arquivos seguidos que não abriram (para não ficar pulando para sempre)
let ligacao = { aoLigar() {}, aoMudarInfo() {}, aoDesligar() {} } // quem cuida da rede: a Chamada
const ouvintes = new Set()                                        // telas que querem ser avisadas

const avisarTelas = () => ouvintes.forEach((aviso) => aviso())

// A Chamada diz aqui o que fazer quando o bot liga, muda de música ou desliga:
// { aoLigar(fluxo), aoMudarInfo({ titulo, tocando, desde }), aoDesligar() }
export function definirLigacao(nova) { ligacao = nova }

export function observarPlayer(aviso) {
  ouvintes.add(aviso)
  return () => ouvintes.delete(aviso)
}

export function lerPlayer() {
  return {
    faixas: faixas.map((f) => f.nome),
    indice,
    repetir,
    volume: volumeLocal,
    ligado,
    tocando: !!elemento && !elemento.paused,
    posicao: elemento ? Math.floor(elemento.currentTime) : 0,
    duracao: elemento && isFinite(elemento.duration) ? Math.floor(elemento.duration) : 0,
  }
}

// Conta para todo mundo na chamada o que está tocando
function anunciar() {
  if (!ligado) return
  ligacao.aoMudarInfo({ titulo: faixas[indice] ? faixas[indice].nome : '', tocando: !!elemento && !elemento.paused, desde })
  avisarTelas()
}

function prepararPlayer() {
  if (elemento) return true
  const Contexto = window.AudioContext || window.webkitAudioContext
  if (!Contexto) return false
  contexto = new Contexto()
  elemento = new Audio()
  const fonte = contexto.createMediaElementSource(elemento)
  destino = contexto.createMediaStreamDestination() // o som que vai para os outros
  ganhoLocal = contexto.createGain()                // o som que eu escuto
  ganhoLocal.gain.value = volumeLocal
  fonte.connect(destino)
  fonte.connect(ganhoLocal)
  ganhoLocal.connect(contexto.destination)
  elemento.addEventListener('play', anunciar)
  elemento.addEventListener('pause', anunciar)
  elemento.addEventListener('playing', () => { falhas = 0 })
  elemento.addEventListener('ended', () => proximaFaixa(true))
  elemento.addEventListener('timeupdate', avisarTelas)
  elemento.addEventListener('loadedmetadata', avisarTelas)
  elemento.addEventListener('error', () => {   // arquivo que o navegador não consegue tocar: pula para o próximo
    falhas += 1
    if (falhas < faixas.length) proximaFaixa(true)
    else anunciar()
  })
  return true
}

export function adicionarFaixas(arquivos) {
  Array.from(arquivos).forEach((arquivo) => {
    const ehAudio = arquivo.type.startsWith('audio/') || /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/i.test(arquivo.name)
    if (ehAudio) faixas.push({ nome: arquivo.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(arquivo) })
  })
  avisarTelas()
}

export function tocarFaixa(i) {
  if (!faixas[i] || !prepararPlayer()) return
  contexto.resume().catch(() => {})
  indice = i
  elemento.src = faixas[i].url
  if (!ligado) {                          // primeira música: o bot entra na chamada
    ligado = true
    desde = Date.now()
    ligacao.aoLigar(destino.stream)
  }
  elemento.play().catch(() => {})
  anunciar()
}

export function alternarPlayPause() {
  if (!elemento || indice < 0) { if (faixas.length) tocarFaixa(0); return }
  if (elemento.paused) elemento.play().catch(() => {})
  else elemento.pause()
}

// automatica = a música acabou sozinha (aí, no fim da lista, para; com "repetir", volta ao começo)
export function proximaFaixa(automatica) {
  if (!faixas.length) return
  let proxima = indice + 1
  if (proxima >= faixas.length) {
    if (automatica && !repetir) { anunciar(); return }
    proxima = 0
  }
  tocarFaixa(proxima)
}

export function faixaAnterior() {
  if (!faixas.length) return
  if (elemento && elemento.currentTime > 3) { elemento.currentTime = 0; return } // depois de 3 s, volta ao começo da mesma música
  tocarFaixa(indice > 0 ? indice - 1 : faixas.length - 1)
}

export function irPara(segundos) {
  if (elemento) elemento.currentTime = segundos
}

export function definirVolumeLocal(valor) {
  volumeLocal = valor
  if (ganhoLocal) ganhoLocal.gain.value = valor
  avisarTelas()
}

export function definirRepetir(valor) {
  repetir = valor
  avisarTelas()
}

// Desliga o bot: para a música, esvazia a lista e avisa a chamada (avisar = false quando tudo está sendo encerrado)
export function desligarPlayer(avisar = true) {
  const estavaLigado = ligado
  ligado = false
  if (elemento) { elemento.pause(); elemento.removeAttribute('src'); elemento.load() }
  faixas.forEach((f) => URL.revokeObjectURL(f.url))
  faixas = []
  indice = -1
  falhas = 0
  if (contexto) contexto.close().catch(() => {})
  elemento = null; contexto = null; destino = null; ganhoLocal = null
  if (estavaLigado && avisar) ligacao.aoDesligar()
  avisarTelas()
}

// Outra pessoa ligou o bot dela: quem ligou por último assume e o meu desliga.
// Devolve true se o meu foi desligado.
export function cederParaOutro(desdeDoOutro) {
  if (!ligado || desdeDoOutro <= desde) return false
  desligarPlayer()
  return true
}
