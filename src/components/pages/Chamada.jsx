import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Peer from 'peerjs'
import { LayoutConversa, LayoutApresentacao, LayoutRpg, PainelDados, colocarFluxo } from './LayoutsChamada.jsx'
import { observarFalas } from '../../utils/detectorDeFala.js'

const PREFIXO = 'tl-c-'   // prefixo dos ids no PeerJS
const MAX_VAGAS = 6       // malha P2P: acima de 5 ou 6 pessoas a internet de cada um não aguenta

// Servidor de sinalização: só ajuda as pessoas a se encontrarem, o vídeo e o áudio não passam por ele.
// Coloque o endereço do seu servidor em VITE_PEER_HOST (ex.: prolobby-peer.onrender.com).
// Vazio = usa o servidor público do PeerJS, que cai com frequência.
const SERVIDOR_PEER = import.meta.env.VITE_PEER_HOST || ''
const TENTATIVAS_SERVIDOR = 8   // o Render grátis dorme sem uso e leva até 1 minuto para acordar

function criarPeer(id) {
  if (!SERVIDOR_PEER) return new Peer(id)
  return new Peer(id, { host: SERVIDOR_PEER, port: 443, path: '/', secure: true })
}

// Tipos de uso da chamada: cada um escolhe um layout diferente (ver LayoutsChamada.jsx)
const MODOS = {
  conversa: { nome: 'Conversa', icone: 'bi bi-people-fill' },
  apresentacao: { nome: 'Apresentação', icone: 'bi bi-easel-fill' },
  rpg: { nome: 'RPG', icone: 'bi bi-dice-5-fill' },
}

// Objetos do PeerJS ficam fora do componente: mexer neles não precisa redesenhar a tela
let peer = null, minhaVaga = 0, verificador = null, salaAtual = '', meuNome = '', ativa = false
let meuPerfil = { nome: '', personagem: '', mestre: false, mesa: '' }
let streamVoz = null, streamCamera = null, streamTela = null
const conexoes = new Map()   // id remoto -> conexão de dados aberta
const tentando = new Set()   // ids que estou tentando conectar agora
const saidas = new Map()     // "id|tipo" -> chamada que eu fiz para aquela pessoa

const limparCodigo = (texto) => String(texto || '').replace(/[^A-Za-z0-9_-]/g, '')
const pararFluxo = (fluxo) => { if (fluxo) fluxo.getTracks().forEach((trilha) => trilha.stop()) }

// Põe o áudio de uma pessoa para tocar. Se o navegador bloquear o som automático, chama aoBloquear
// (a tela então mostra o botão "Ativar o som").
function tocarAudio(elemento, fluxo, aoBloquear) {
  if (!elemento || elemento.srcObject === fluxo) return
  elemento.srcObject = fluxo
  const promessa = elemento.play()
  if (promessa) promessa.catch((erro) => { if (erro && erro.name === 'NotAllowedError') aoBloquear() })
}

const classeBotao = (ligado) =>
  'flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold transition-colors ' +
  (ligado ? 'border-transparent bg-purple-600 text-white' : 'border-dark-border text-dark-text-1 hover:bg-dark-secondary')

// Limita o bitrate para a internet de quem envia aguentar várias pessoas
function limitarBitrate(chamada, bps) {
  try {
    chamada.peerConnection.getSenders().forEach((emissor) => {
      if (!emissor.track || emissor.track.kind !== 'video') return
      const params = emissor.getParameters()
      if (!params.encodings || !params.encodings.length) params.encodings = [{}]
      params.encodings[0].maxBitrate = bps
      emissor.setParameters(params)
    })
  } catch { /* sem limite, segue normal */ }
}

function encerrarTudo() {
  ativa = false
  clearInterval(verificador)
  pararFluxo(streamVoz); pararFluxo(streamCamera); pararFluxo(streamTela)
  streamVoz = null; streamCamera = null; streamTela = null
  if (peer) peer.destroy()
  peer = null; conexoes.clear(); tentando.clear(); saidas.clear()
}

// Escolhe o que aparece na miniatura: tela compartilhada, depois a câmera de alguém, depois a minha
function escolherMiniatura(lista, minhaCamera) {
  const comTela = lista.find(([, p]) => p.tela)
  if (comTela) return { fluxo: comTela[1].tela, legenda: 'Tela de ' + comTela[1].nome }
  const comCamera = lista.find(([, p]) => p.camera)
  if (comCamera) return { fluxo: comCamera[1].camera, legenda: comCamera[1].nome }
  if (minhaCamera) return { fluxo: minhaCamera, legenda: 'Você' }
  return { fluxo: null, legenda: 'Em chamada' }
}

// Miniatura da chamada: aparece em todas as páginas do site e também na janela flutuante
function MiniChamada({ miniatura, sala, total, micLigado, falandoNomes, naJanela, aoAlternarMic, aoSair, aoAbrir, aoJanela }) {
  const botao = 'grid h-9 w-9 place-items-center rounded-lg border text-sm transition-colors '
  const neutro = 'border-dark-border text-dark-text-1 hover:bg-dark-secondary'
  return (
    <div className="grid gap-2 rounded-xl border border-dark-border bg-dark-card p-2 text-dark-text-1 shadow-xl">
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-lg bg-black">
        {miniatura.fluxo ? (
          <video autoPlay playsInline muted ref={(el) => colocarFluxo(el, miniatura.fluxo)} className="h-full w-full object-contain" />
        ) : (
          <i className="bi bi-telephone-fill text-2xl text-purple-400" />
        )}
        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-xs text-white">{miniatura.legenda}</span>
      </div>
      {falandoNomes.length > 0 ? (
        <p className="flex items-center gap-1 truncate text-xs font-semibold text-green-500"><i className="bi bi-mic-fill" /> {falandoNomes.join(', ')} falando</p>
      ) : (
        <p className="truncate text-xs text-dark-text-2">Sala {sala}: {total} pessoa(s)</p>
      )}
      <div className="flex gap-1">
        <button onClick={aoAlternarMic} aria-label="Microfone" className={botao + (micLigado ? 'border-transparent bg-purple-600 text-white' : neutro)}>
          <i className={micLigado ? 'bi bi-mic-fill' : 'bi bi-mic-mute-fill'} />
        </button>
        {!naJanela && (
          <>
            <button onClick={aoAbrir} aria-label="Abrir a chamada" className={botao + neutro}><i className="bi bi-arrows-angle-expand" /></button>
            <button onClick={aoJanela} aria-label="Janela flutuante" className={botao + neutro}><i className="bi bi-pip" /></button>
          </>
        )}
        <button onClick={aoSair} aria-label="Sair da chamada" className={botao + 'ml-auto border-transparent bg-red-600 text-white hover:bg-red-500'}>
          <i className="bi bi-telephone-x-fill" />
        </button>
      </div>
    </div>
  )
}

// naPagina = a rota /chamada está aberta. Este componente fica montado o tempo todo (ver App.jsx),
// por isso a chamada continua ao trocar de página.
export default function Chamada({ naPagina }) {
  const navegar = useNavigate()
  const [nome, setNome] = useState(() => localStorage.getItem('tl_nome') || '')
  const [sala, setSala] = useState(() => limparCodigo(new URLSearchParams(window.location.search).get('sala')))
  const [naSala, setNaSala] = useState(false)
  const [aviso, setAviso] = useState('')
  const [pessoas, setPessoas] = useState({})   // id -> { nome, voz, camera, tela }
  const [minhaCamera, setMinhaCamera] = useState(null)
  const [micLigado, setMicLigado] = useState(true)
  const [telaLigada, setTelaLigada] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [modo, setModo] = useState(() => {
    const pedido = new URLSearchParams(window.location.search).get('modo')
    return MODOS[pedido] ? pedido : 'conversa'
  })
  const [personagem, setPersonagem] = useState('')
  const [ehMestre, setEhMestre] = useState(false)
  const [mesa, setMesa] = useState('')
  const [rolagens, setRolagens] = useState([])   // mais recente primeiro
  const [expressao, setExpressao] = useState('1d20')
  const [rotulo, setRotulo] = useState('')
  const [slot, setSlot] = useState(null)         // espaço da rota /chamada, onde a página é desenhada
  const [janelaPip, setJanelaPip] = useState(null) // janela flutuante (Picture-in-Picture), se estiver aberta
  const [falando, setFalando] = useState([])         // ids de quem está falando agora ('eu' = eu mesmo)
  const [meuFluxo, setMeuFluxo] = useState(null)     // o meu microfone (para medir o meu volume)
  const [microfones, setMicrofones] = useState([])   // microfones do computador
  const [microfoneId, setMicrofoneId] = useState('') // o microfone que estou usando
  const [problemaMic, setProblemaMic] = useState('') // aviso sobre o meu microfone ('' = tudo certo)
  const [somBloqueado, setSomBloqueado] = useState(false) // o navegador bloqueou o som da chamada

  // Só encerra tudo quando o site inteiro fecha (trocar de página não derruba a chamada)
  useEffect(() => {
    return () => encerrarTudo()
  }, [])

  // A página da chamada é desenhada dentro do espaço reservado pela rota /chamada
  useEffect(() => {
    setSlot(naPagina ? document.getElementById('slot-chamada') : null)
  }, [naPagina])

  // Se a pessoa tentar fechar ou recarregar o site no meio da chamada, o navegador pergunta antes
  useEffect(() => {
    if (!naSala) return
    const avisar = (evento) => { evento.preventDefault(); evento.returnValue = '' }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [naSala])

  // Quem está falando: a cada 0,1 s o detector mede o volume do meu microfone e da voz de cada pessoa
  useEffect(() => {
    if (!naSala) return
    const fluxos = { eu: meuFluxo }
    Object.entries(pessoas).forEach(([id, p]) => { fluxos[id] = p.voz })
    return observarFalas(fluxos, (quem) => {
      setFalando((anterior) => (anterior.join() === quem.join() ? anterior : quem)) // só redesenha se mudou
    })
  }, [naSala, pessoas, meuFluxo])

  // Lista de microfones. Os nomes só aparecem depois que o navegador libera o microfone (por isso só dentro da sala)
  useEffect(() => {
    if (!naSala || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return
    async function listar() {
      try {
        const dispositivos = await navigator.mediaDevices.enumerateDevices()
        setMicrofones(dispositivos.filter((d) => d.kind === 'audioinput'))
      } catch { /* sem lista: segue com o microfone padrão */ }
    }
    listar()
    navigator.mediaDevices.addEventListener('devicechange', listar) // plugou ou tirou um fone
    return () => navigator.mediaDevices.removeEventListener('devicechange', listar)
  }, [naSala])

  // ---------- Lista de pessoas na tela ----------
  function atualizarPessoa(id, dados) {
    setPessoas((anterior) => ({
      ...anterior,
      [id]: { nome: 'Participante', personagem: '', mestre: false, mesa: '', voz: null, camera: null, tela: null, ...anterior[id], ...dados },
    }))
  }

  function removerPessoa(id) {
    setPessoas((anterior) => {
      const novo = { ...anterior }
      delete novo[id]
      return novo
    })
  }

  // Só apaga o áudio/vídeo de uma pessoa se ainda for aquele mesmo fluxo:
  // uma chamada antiga que fecha atrasada não pode apagar a chamada nova
  function removerFluxo(id, tipo, fluxo) {
    setPessoas((anterior) => {
      if (!anterior[id] || anterior[id][tipo] !== fluxo) return anterior
      return { ...anterior, [id]: { ...anterior[id], [tipo]: null } }
    })
  }

  // ---------- Enviar a minha mídia ----------
  // Voz, câmera e tela vão em chamadas separadas: dá para ligar e desligar cada uma sem renegociar nada
  function enviar(id, tipo, fluxo, tentativa = 0) {
    const chave = id + '|' + tipo
    const chamada = peer.call(id, fluxo, { metadata: { tipo: tipo, nome: meuNome } })
    if (!chamada) { refazerEnvio(id, tipo, tentativa + 1); return } // sem conexão com o servidor agora
    saidas.set(chave, chamada)
    setTimeout(() => limitarBitrate(chamada, tipo === 'tela' ? 3000000 : 1000000), 1000)

    // Se a chamada cair ou não conectar, tenta de novo. Sem isso a pessoa ficaria sem ouvir (ou ver)
    // você até alguém sair e entrar de novo.
    let conectou = false
    chamada.on('iceStateChanged', (estado) => { if (estado === 'connected' || estado === 'completed') conectou = true })
    const seFalhar = () => {
      if (!ativa || saidas.get(chave) !== chamada) return // saiu da chamada, ou ela foi encerrada de propósito
      saidas.delete(chave)
      chamada.close()
      refazerEnvio(id, tipo, conectou ? 0 : tentativa + 1)
    }
    chamada.on('close', seFalhar)
    setTimeout(() => { if (!conectou) seFalhar() }, 15000) // 15 s sem conectar: refaz a chamada
  }

  function refazerEnvio(id, tipo, tentativa) {
    if (tentativa > 4) {
      const oQue = tipo === 'voz' ? 'áudio' : (tipo === 'tela' ? 'compartilhamento de tela' : 'vídeo')
      setAviso('Não consegui enviar o seu ' + oQue + ' para um participante. Peça para ele sair da sala e entrar de novo.')
      return
    }
    setTimeout(() => {
      const fluxo = tipo === 'voz' ? streamVoz : (tipo === 'camera' ? streamCamera : streamTela) // sempre o fluxo de agora
      if (!ativa || !peer || !fluxo || !conexoes.has(id) || saidas.has(id + '|' + tipo)) return
      enviar(id, tipo, fluxo, tentativa)
    }, 2000)
  }

  function enviarTudoPara(id) {
    if (streamVoz) enviar(id, 'voz', streamVoz)
    if (streamCamera) enviar(id, 'camera', streamCamera)
    if (streamTela) enviar(id, 'tela', streamTela)
  }

  function pararEnvio(tipo) {
    saidas.forEach((chamada, chave) => {
      if (chave.endsWith('|' + tipo)) { saidas.delete(chave); chamada.close() }
    })
    // avisa os outros na hora para o quadro sumir
    conexoes.forEach((conexao) => { try { conexao.send({ parou: tipo }) } catch { /* ignora */ } })
  }

  // ---------- Conexões entre as pessoas ----------
  function registrarConexao(conexao) {
    const id = conexao.peer
    if (conexoes.has(id)) { conexao.close(); return }
    conexoes.set(id, conexao)
    atualizarPessoa(id, {})
    conexao.send({ perfil: meuPerfil })   // diz quem eu sou: nome, personagem, se sou o mestre
    enviarTudoPara(id)
    conexao.on('data', (mensagem) => {
      if (!mensagem) return
      if (mensagem.parou) atualizarPessoa(id, { [mensagem.parou]: null })
      if (mensagem.perfil) atualizarPessoa(id, mensagem.perfil)
      if (mensagem.rolagem) guardarRolagem(mensagem.rolagem)
    })
    conexao.on('close', () => {
      conexoes.delete(id)
      saidas.forEach((chamada, chave) => {
        if (chave.startsWith(id + '|')) { saidas.delete(chave); chamada.close() }
      })
      removerPessoa(id)
    })
  }

  function conectarCom(id) {
    if (conexoes.has(id) || tentando.has(id)) return
    tentando.add(id)
    const conexao = peer.connect(id, { reliable: true })
    const limite = setTimeout(() => {
      tentando.delete(id)
      if (!conexao.open) conexao.close()
    }, 6000)
    conexao.on('open', () => { clearTimeout(limite); tentando.delete(id); registrarConexao(conexao) })
  }

  // Regra simples: eu só procuro quem tem vaga menor que a minha; quem tem vaga maior me procura
  function procurarOutros() {
    if (!peer || peer.destroyed) return
    for (let n = 1; n < minhaVaga; n++) conectarCom(PREFIXO + salaAtual + '-' + n)
  }

  function configurarPeer() {
    peer.on('connection', (conexao) => conexao.on('open', () => registrarConexao(conexao)))
    peer.on('call', (chamada) => {
      chamada.answer() // só recebe; a minha mídia vai em chamadas minhas
      const meta = chamada.metadata || {}
      const tipo = meta.tipo || 'voz'
      let recebido = null // o fluxo que ESTA chamada trouxe
      chamada.on('stream', (fluxo) => { recebido = fluxo; atualizarPessoa(chamada.peer, { nome: meta.nome || 'Participante', [tipo]: fluxo }) })
      chamada.on('close', () => removerFluxo(chamada.peer, tipo, recebido))
    })
    verificador = setInterval(procurarOutros, 4000)
    procurarOutros()
  }

  // Cada pessoa ocupa uma vaga (id) da sala: tenta a 1, se estiver ocupada tenta a 2, e assim por diante
  function reservarVaga(n, tentativa = 0) {
    if (n > MAX_VAGAS) { setAviso('Sala cheia (máximo de ' + MAX_VAGAS + ' pessoas).'); return }
    const candidato = criarPeer(PREFIXO + salaAtual + '-' + n)
    candidato.on('open', () => {
      if (!ativa) { candidato.destroy(); return } // a pessoa saiu antes de a vaga abrir
      setAviso('')
      if (peer === candidato) return              // reconectou ao servidor: já está tudo configurado
      peer = candidato; minhaVaga = n; configurarPeer()
    })
    // se a conexão com o servidor cair no meio da chamada, tenta voltar sozinho
    candidato.on('disconnected', () => {
      if (ativa && peer === candidato && !candidato.destroyed) candidato.reconnect()
    })
    candidato.on('error', (erro) => {
      if (candidato.destroyed) return
      if (erro.type === 'unavailable-id' && !peer) {
        candidato.destroy(); reservarVaga(n + 1)
      } else if (!peer && ['network', 'server-error', 'socket-error', 'socket-closed'].includes(erro.type)) {
        // servidor fora do ar ou acordando: tenta de novo algumas vezes antes de desistir
        candidato.destroy()
        if (tentativa + 1 >= TENTATIVAS_SERVIDOR) {
          setAviso('Não consegui conectar ao servidor de sinalização. Confira se ele está no ar e tente de novo.')
          return
        }
        setAviso('Conectando ao servidor... (tentativa ' + (tentativa + 1) + ' de ' + TENTATIVAS_SERVIDOR + ')')
        setTimeout(() => { if (ativa) reservarVaga(n, tentativa + 1) }, 5000)
      } else if (erro.type !== 'peer-unavailable') {
        setAviso('Erro de conexão (' + erro.type + '). Saia e entre de novo.')
      }
    })
  }

  // ---------- Controles ----------
  async function ligarCamera() {
    try {
      streamCamera = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } })
    } catch { setAviso('Não consegui usar a câmera. Libere a permissão no navegador.'); return }
    setMinhaCamera(streamCamera)
    conexoes.forEach((conexao, id) => enviar(id, 'camera', streamCamera))
  }

  function desligarCamera() {
    pararFluxo(streamCamera)
    streamCamera = null
    setMinhaCamera(null)
    pararEnvio('camera')
  }

  async function ligarTela() {
    if (!navigator.mediaDevices.getDisplayMedia) { setAviso('Este navegador não compartilha a tela. Use Chrome, Edge ou Firefox no computador.'); return }
    try {
      streamTela = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }, audio: true,
      })
    } catch { return } // a pessoa cancelou a escolha da tela
    streamTela.getVideoTracks()[0].addEventListener('ended', desligarTela) // botão "Parar compartilhamento" do navegador
    conexoes.forEach((conexao, id) => enviar(id, 'tela', streamTela))
    setTelaLigada(true)
  }

  function desligarTela() {
    if (!streamTela) return
    pararFluxo(streamTela)
    streamTela = null
    pararEnvio('tela')
    setTelaLigada(false)
  }

  function alternarMic() {
    const trilha = streamVoz.getAudioTracks()[0]
    trilha.enabled = !trilha.enabled
    setMicLigado(trilha.enabled)
  }

  // Guarda o microfone em uso e fica de olho nele: avisa se ele parar (fone desconectado, mudo do sistema...)
  function usarMicrofone(fluxo, idEscolhido) {
    const trilha = fluxo.getAudioTracks()[0]
    setMeuFluxo(fluxo)
    setMicrofoneId(idEscolhido || trilha.getSettings().deviceId || '')
    setProblemaMic('')
    trilha.addEventListener('ended', () => {
      if (streamVoz === fluxo) setProblemaMic('Seu microfone foi desconectado. Escolha outro na lista ao lado do botão do microfone.')
    })
    trilha.addEventListener('mute', () => {
      if (streamVoz === fluxo) setProblemaMic('O sistema ou o navegador silenciou o seu microfone. Confira o botão de mudo do fone/teclado e as configurações de som.')
    })
    trilha.addEventListener('unmute', () => { if (streamVoz === fluxo) setProblemaMic('') })
  }

  // Troca o microfone sem sair da chamada: o áudio do microfone novo entra no lugar do antigo nas chamadas abertas
  async function trocarMicrofone(idDispositivo) {
    let novo
    try {
      novo = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: idDispositivo }, echoCancellation: true, noiseSuppression: true } })
    } catch { setAviso('Não consegui usar esse microfone. Escolha outro.'); return }
    const novaTrilha = novo.getAudioTracks()[0]
    novaTrilha.enabled = micLigado // se eu estava no mudo, continuo no mudo
    saidas.forEach((chamada, chave) => {
      if (!chave.endsWith('|voz') || !chamada.peerConnection) return
      chamada.peerConnection.getSenders().forEach((emissor) => {
        if (emissor.track && emissor.track.kind === 'audio') emissor.replaceTrack(novaTrilha).catch(() => {})
      })
    })
    pararFluxo(streamVoz)
    streamVoz = novo
    usarMicrofone(novo, idDispositivo)
    setAviso('')
  }

  // O navegador só deixa tocar som depois de um clique: este botão libera o som da chamada
  function ativarSom() {
    document.querySelectorAll('audio[data-chamada]').forEach((audio) => { audio.play().catch(() => {}) })
    setSomBloqueado(false)
  }

  async function entrar(comCamera) {
    setAviso('')
    meuNome = nome.trim() || 'Alguém'
    meuPerfil = { nome: meuNome, personagem: personagem.trim(), mestre: modo === 'rpg' && ehMestre, mesa: mesa.trim() }
    salaAtual = limparCodigo(sala) || Math.random().toString(36).slice(2, 8)
    localStorage.setItem('tl_nome', meuNome)
    try {
      streamVoz = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch {
      setAviso('Não consegui usar o microfone. Libere a permissão no navegador e abra o site por https.')
      return
    }
    ativa = true
    usarMicrofone(streamVoz)
    setSala(salaAtual); setMicLigado(true); setNaSala(true)
    if (comCamera) await ligarCamera()
    if (SERVIDOR_PEER) fetch('https://' + SERVIDOR_PEER + '/', { mode: 'no-cors' }).catch(() => {}) // acorda o servidor, se estiver dormindo
    reservarVaga(1)
  }

  function sair() {
    if (janelaPip) janelaPip.close()
    encerrarTudo()
    setNaSala(false); setPessoas({}); setMinhaCamera(null); setTelaLigada(false); setMicLigado(true); setRolagens([])
    setFalando([]); setMeuFluxo(null); setMicrofones([]); setProblemaMic(''); setSomBloqueado(false)
  }

  function guardarRolagem(rolagem) {
    setRolagens((anterior) => [rolagem, ...anterior].slice(0, 8))
  }

  function rolar() {
    const partes = expressao.replace(/\s/g, '').match(/^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i)
    if (!partes || Number(partes[1]) < 1 || Number(partes[2]) < 2) { setAviso('Dados inválidos. Use algo como 1d20+5.'); return }
    setAviso('')
    const quantidade = Number(partes[1]), lados = Number(partes[2]), bonus = Number(partes[3] || 0)
    const dados = []
    for (let i = 0; i < quantidade; i++) dados.push(Math.floor(Math.random() * lados) + 1)
    const total = dados.reduce((soma, valor) => soma + valor, 0) + bonus
    const textoBonus = bonus === 0 ? '' : (bonus > 0 ? ' + ' : ' - ') + Math.abs(bonus)
    const rolagem = { quem: meuPerfil.personagem || meuPerfil.nome, rotulo: rotulo.trim(), expressao: quantidade + 'd' + lados + textoBonus, dados, total }
    guardarRolagem(rolagem)
    conexoes.forEach((conexao) => { try { conexao.send({ rolagem }) } catch { /* ignora */ } })
  }

  // Janela flutuante: fica por cima de tudo, até em outras abas ou programas (Chrome e Edge, no computador)
  async function abrirJanelaFlutuante() {
    if (!('documentPictureInPicture' in window)) {
      setAviso('A janela flutuante funciona no Chrome e no Edge, no computador.')
      return
    }
    if (janelaPip) { janelaPip.close(); return }
    try {
      const janela = await window.documentPictureInPicture.requestWindow({ width: 320, height: 270 })
      // copia o CSS do site para dentro da janela flutuante
      Array.from(document.styleSheets).forEach((folha) => {
        try {
          const estilo = document.createElement('style')
          estilo.textContent = Array.from(folha.cssRules).map((regra) => regra.cssText).join('')
          janela.document.head.appendChild(estilo)
        } catch {
          if (folha.href) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = folha.href
            janela.document.head.appendChild(link)
          }
        }
      })
      janela.document.documentElement.className = document.documentElement.className // mesmo tema (claro ou escuro)
      janela.document.body.style.margin = '0'
      janela.addEventListener('pagehide', () => setJanelaPip(null))
      setJanelaPip(janela)
    } catch {
      setAviso('Não consegui abrir a janela flutuante.')
    }
  }

  async function copiarConvite() {
    const convite = window.location.origin + window.location.pathname + '?sala=' + salaAtual + '&modo=' + modo
    try {
      await navigator.clipboard.writeText(convite)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { setAviso('Não consegui copiar. Mande este código da sala para quem for entrar: ' + salaAtual) }
  }

  // ---------- Tela ----------
  const lista = Object.entries(pessoas)
  // "todos" = eu + os outros no mesmo formato, para qualquer layout desenhar igual
  const todos = [
    { id: 'eu', nome: (nome.trim() || 'Alguém') + ' (você)', personagem: personagem.trim(), mestre: modo === 'rpg' && ehMestre, mesa: mesa.trim(), camera: minhaCamera, voz: null, falando: falando.includes('eu') },
    ...lista.map(([id, p]) => ({ id, ...p, falando: falando.includes(id) })),
  ]
  const falandoNomes = todos.filter((p) => p.falando).map((p) => (p.id === 'eu' ? 'Você' : p.nome))
  const telas = lista.filter(([, p]) => p.tela).map(([id, p]) => ({ id, nome: p.nome, tela: p.tela }))
  const painelDados = <PainelDados rolagens={rolagens} expressao={expressao} setExpressao={setExpressao} rotulo={rotulo} setRotulo={setRotulo} aoRolar={rolar} />

  const miniatura = escolherMiniatura(lista, minhaCamera)
  const painelMini = (naJanela) => (
    <MiniChamada
      miniatura={miniatura} sala={sala} total={lista.length + 1} micLigado={micLigado} falandoNomes={falandoNomes} naJanela={naJanela}
      aoAlternarMic={alternarMic} aoSair={sair} aoAbrir={() => navegar('/chamada')} aoJanela={abrirJanelaFlutuante}
    />
  )

  const pagina = (
    <div className="mx-auto w-full max-w-6xl p-4 text-dark-text-1 md:p-6">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
        <i className="bi bi-telephone-fill text-purple-500" /> Chamada
      </h1>
      <p className="mb-4 text-dark-text-2">Voz, vídeo e compartilhamento de tela direto no navegador, sem instalar nada.</p>

      {aviso && <p role="alert" className="mb-4 rounded-lg border border-red-500 p-3 text-sm">{aviso}</p>}
      {problemaMic && <p role="alert" className="mb-4 rounded-lg border border-yellow-500 p-3 text-sm">{problemaMic}</p>}
      {somBloqueado && (
        <p role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-yellow-500 p-3 text-sm">
          O navegador bloqueou o som da chamada.
          <button onClick={ativarSom} className="rounded-lg bg-purple-600 px-3 py-1 font-semibold text-white hover:bg-purple-500">Ativar o som</button>
        </p>
      )}

      {!naSala ? (
        <div className="mx-auto grid max-w-md gap-4 rounded-xl border border-dark-border bg-dark-card p-6">
          <label className="grid gap-1 text-sm font-semibold">
            Seu nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={30}
              placeholder="Ex.: Julio"
              className="rounded-lg border border-dark-border bg-dark-secondary px-3 py-2 font-normal text-dark-text-1 placeholder:text-dark-text-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Código da sala
            <input
              value={sala}
              onChange={(e) => setSala(limparCodigo(e.target.value))}
              maxLength={20}
              placeholder="Deixe vazio para criar uma sala nova"
              className="rounded-lg border border-dark-border bg-dark-secondary px-3 py-2 font-normal text-dark-text-1 placeholder:text-dark-text-3"
            />
          </label>
          <div className="grid gap-1 text-sm font-semibold">
            Tipo de chamada
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(MODOS).map(([chave, m]) => (
                <button key={chave} onClick={() => setModo(chave)} className={classeBotao(modo === chave) + ' justify-center'}>
                  <i className={m.icone} /> {m.nome}
                </button>
              ))}
            </div>
          </div>
          {modo === 'rpg' && (
            <>
              <label className="grid gap-1 text-sm font-semibold">
                Personagem
                <input value={personagem} onChange={(e) => setPersonagem(e.target.value)} maxLength={30} placeholder="Ex.: Aramil" className="rounded-lg border border-dark-border bg-dark-secondary px-3 py-2 font-normal text-dark-text-1 placeholder:text-dark-text-3" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={ehMestre} onChange={(e) => setEhMestre(e.target.checked)} /> Eu sou o mestre
              </label>
              {ehMestre && (
                <label className="grid gap-1 text-sm font-semibold">
                  Nome da mesa (aparece para todos)
                  <input value={mesa} onChange={(e) => setMesa(e.target.value)} maxLength={40} placeholder="Ex.: Skyfall RPG" className="rounded-lg border border-dark-border bg-dark-secondary px-3 py-2 font-normal text-dark-text-1 placeholder:text-dark-text-3" />
                </label>
              )}
            </>
          )}
          <button onClick={() => entrar(false)} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500">
            <i className="bi bi-mic-fill" /> Entrar só com voz
          </button>
          <button onClick={() => entrar(true)} className={classeBotao(false) + ' justify-center'}>
            <i className="bi bi-camera-video-fill" /> Entrar com câmera e voz
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-dark-text-2">Sala {sala}: {lista.length + 1} pessoa(s)</p>

          <div className="mb-4">
            {modo === 'conversa' && <LayoutConversa todos={todos} telas={telas} />}
            {modo === 'apresentacao' && <LayoutApresentacao todos={todos} telas={telas} telaLigada={telaLigada} />}
            {modo === 'rpg' && <LayoutRpg todos={todos} telas={telas} telaLigada={telaLigada} painel={painelDados} />}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={alternarMic} className={classeBotao(micLigado)}>
              <i className={micLigado ? 'bi bi-mic-fill' : 'bi bi-mic-mute-fill'} /> {micLigado ? 'Microfone ligado' : 'Microfone mudo'}
            </button>
            {microfones.length > 1 && (
              <select value={microfoneId} onChange={(e) => trocarMicrofone(e.target.value)} aria-label="Escolher microfone" className="max-w-56 rounded-lg border border-dark-border bg-dark-secondary px-3 py-2 text-sm text-dark-text-1">
                {microfones.map((m, i) => <option key={m.deviceId} value={m.deviceId}>{m.label || 'Microfone ' + (i + 1)}</option>)}
              </select>
            )}
            <button onClick={() => (minhaCamera ? desligarCamera() : ligarCamera())} className={classeBotao(!!minhaCamera)}>
              <i className={minhaCamera ? 'bi bi-camera-video-fill' : 'bi bi-camera-video-off-fill'} /> {minhaCamera ? 'Desligar câmera' : 'Ligar câmera'}
            </button>
            <button onClick={() => (telaLigada ? desligarTela() : ligarTela())} className={classeBotao(telaLigada)}>
              <i className="bi bi-display" /> {telaLigada ? 'Parar de compartilhar' : 'Compartilhar tela'}
            </button>
            {Object.entries(MODOS).map(([chave, m]) => (
              <button key={chave} onClick={() => setModo(chave)} className={classeBotao(modo === chave)}>
                <i className={m.icone} /> {m.nome}
              </button>
            ))}
            <button onClick={abrirJanelaFlutuante} className={classeBotao(!!janelaPip)}>
              <i className="bi bi-pip" /> {janelaPip ? 'Fechar janela flutuante' : 'Janela flutuante'}
            </button>
            <button onClick={copiarConvite} className={classeBotao(false)}>
              <i className="bi bi-link-45deg" /> {copiado ? 'Copiado' : 'Copiar convite'}
            </button>
            <button onClick={sair} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500">
              <i className="bi bi-box-arrow-right" /> Sair
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* O áudio fica aqui, fora da página, para continuar tocando em qualquer rota ou aba */}
      {lista.map(([id, p]) => (
        <span key={id}>
          {p.voz && <audio autoPlay data-chamada ref={(el) => tocarAudio(el, p.voz, () => setSomBloqueado(true))} />}
          {p.tela && <audio autoPlay data-chamada ref={(el) => tocarAudio(el, p.tela, () => setSomBloqueado(true))} />}
        </span>
      ))}

      {/* Na rota /chamada: página completa. Nas outras rotas: miniatura no canto da tela */}
      {slot && createPortal(pagina, slot)}
      {naSala && !naPagina && <div className="fixed right-4 top-20 z-50 w-60">{painelMini(false)}</div>}

      {/* Janela flutuante: a mesma miniatura, mas numa janela que fica por cima de tudo */}
      {janelaPip && createPortal(painelMini(true), janelaPip.document.body)}
    </>
  )
}
