import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Peer from 'peerjs'
import { LayoutConversa, LayoutApresentacao, LayoutRpg, PainelDados, colocarFluxo } from './LayoutsChamada.jsx'
import { observarFalas } from '../../utils/detectorDeFala.js'
import { useAuth } from '../../contexts/AuthContext'
import { tocarEfeito, ligarEfeitos, efeitosLigados, usarSaida } from '../../utils/efeitosSonoros.js'
import { definirLigacao, desligarPlayer, cederParaOutro } from '../../utils/playerMusica.js'
import BotDeMusica from './BotDeMusica.jsx'

const PREFIXO = 'tl-c-'   // prefixo dos ids no PeerJS
const MAX_VAGAS = 6       // malha P2P: acima de 5 ou 6 pessoas a internet de cada um não aguenta

// Servidor de sinalização: só ajuda as pessoas a se encontrarem, o vídeo e o áudio não passam por ele.
// Coloque o endereço do seu servidor em VITE_PEER_HOST (ex.: prolobby-peer.onrender.com).
// Vazio = usa o servidor público do PeerJS, que cai com frequência.
const SERVIDOR_PEER = import.meta.env.VITE_PEER_HOST || ''
const TENTATIVAS_SERVIDOR = 8   // o Render grátis dorme sem uso e leva até 1 minuto para acordar
const SEM_SINAL = 12000         // ms sem nenhuma mensagem de uma pessoa até dar a conexão dela por morta
const ESPERA_AVISO = 8000       // ms de conexão sem som até aparecer o aviso no quadro da pessoa

// Redes mais fechadas (escola, empresa) só deixam a chamada passar por um servidor TURN (um "retransmissor").
// Opcional: VITE_TURN_URL (vários endereços separados por vírgula), VITE_TURN_USUARIO e VITE_TURN_SENHA.
// Vazio = usa os servidores padrão do PeerJS.
const TURN_URL = import.meta.env.VITE_TURN_URL || ''
const CONFIG_REDE = TURN_URL ? {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' }, // os padrões do PeerJS
    { urls: TURN_URL.split(',').map((endereco) => endereco.trim()), username: import.meta.env.VITE_TURN_USUARIO || '', credential: import.meta.env.VITE_TURN_SENHA || '' },
  ],
} : undefined

function criarPeer(id) {
  const opcoes = CONFIG_REDE ? { config: CONFIG_REDE } : {}
  if (!SERVIDOR_PEER) return new Peer(id, opcoes)
  return new Peer(id, { ...opcoes, host: SERVIDOR_PEER, port: 443, path: '/', secure: true })
}

// Tipos de uso da chamada: cada um escolhe um layout diferente (ver LayoutsChamada.jsx)
const MODOS = {
  conversa: { nome: 'Conversa', icone: 'bi bi-people-fill' },
  apresentacao: { nome: 'Apresentação', icone: 'bi bi-easel-fill' },
  rpg: { nome: 'RPG', icone: 'bi bi-dice-5-fill' },
}

// Objetos do PeerJS ficam fora do componente: mexer neles não precisa redesenhar a tela
let peer = null, minhaVaga = 0, verificador = null, salaAtual = '', meuNome = '', ativa = false
let meuPerfil = { nome: '', personagem: '', mestre: false, mesa: '', mic: true }
let streamVoz = null, streamCamera = null, streamTela = null, streamMusica = null
let minhaMusica = null   // o que o meu bot de música está tocando: { por, titulo, tocando, desde }
let minhaEntrada = 0     // quando eu entrei na sala (os efeitos sonoros de "entrou" usam isso)
const conexoes = new Map()   // id remoto -> conexão de dados aberta
const tentando = new Set()   // ids que estou tentando conectar agora
const saidas = new Map()     // "id|tipo" -> chamada que eu fiz para aquela pessoa
const recebidas = new Set()      // chamadas que as outras pessoas fizeram para mim (e eu atendi)
const fluxosDe = new Map()       // "id|tipo" -> mídias que chegam dele ({ fluxo, chamada }): toca uma que conectou, as outras ficam de reserva
const ultimoSinal = new Map()    // id remoto -> última vez que chegou qualquer mensagem dele
const conectadoEm = new Map()    // id remoto -> quando a conexão com ele abriu
const nomesPorId = new Map()     // id remoto -> nome (para os avisos dizerem quem é)
const falhasEnvio = new Set()    // ids para quem a minha voz não está chegando
const mandamPing = new Set()     // ids que já mandaram "ping" (versões antigas do site não mandam, então não dá para cobrar sinal)
const querem = new Map()         // "id|tipo" -> quando a pessoa avisou que está enviando câmera, tela ou música
const pedidos = new Map()        // "id|tipo" -> chamada que EU fiz para buscar a mídia dela
const falhasConexao = new Map()  // id remoto -> quantas vezes a conexão direta com ele não abriu
const ausentes = new Map()       // id remoto -> quando o servidor disse "não tem ninguém nessa vaga"
const semConexao = new Set()     // ids que existem na sala, mas com quem a conexão direta não abre
const diagLinhas = []            // últimas falhas de conexão, para a seção "Detalhes técnicos"
const PEDIR_DEPOIS = 6000        // ms esperando a chamada da pessoa conectar sozinha, antes de eu ir buscar a mídia
let saidaDeSom = localStorage.getItem('tl_saida') || ''   // saída de áudio escolhida ('' = a padrão do computador)

const limparCodigo = (texto) => String(texto || '').replace(/[^A-Za-z0-9_-]/g, '')
const pararFluxo = (fluxo) => { if (fluxo) fluxo.getTracks().forEach((trilha) => trilha.stop()) }

const nomeDe = (id) => nomesPorId.get(id) || 'um participante'

// A chamada está conectada neste instante? (uma que conectou e depois caiu não conta)
const conectada = (chamada) => {
  const conexao = chamada && chamada.peerConnection
  return !!conexao && (conexao.iceConnectionState === 'connected' || conexao.iceConnectionState === 'completed')
}

// Voz, câmera, tela e música de uma pessoa podem chegar por duas chamadas (a que ela fez e a que eu fiz): só uma toca,
// a outra fica de reserva. Toca a de uma chamada que de fato conectou; uma que ainda está tentando (ou nunca conectou)
// só serve se não houver outra.
function fluxoAtual(id, tipo) {
  const chave = id + '|' + tipo
  const vivos = (fluxosDe.get(chave) || []).filter((v) => v.fluxo.getTracks().some((trilha) => trilha.readyState === 'live'))
  fluxosDe.set(chave, vivos)
  const bom = vivos.find((v) => conectada(v.chamada)) || vivos[0]
  return bom ? bom.fluxo : null
}
const vozAtual = (id) => fluxoAtual(id, 'voz')

// Chega mídia de verdade dessa pessoa? (alguma chamada dela está conectada agora)
const fluxoChega = (id, tipo) => (fluxosDe.get(id + '|' + tipo) || []).some((v) => conectada(v.chamada) && v.fluxo.getTracks().some((trilha) => trilha.readyState === 'live'))
const vozChegaDe = (id) => fluxoChega(id, 'voz')

// Aceita o código da sala ou o link do convite inteiro (pega o que vem depois de "sala=")
function extrairCodigo(texto) {
  const t = String(texto || '')
  const achou = /[?&]sala=([^&#\s]*)/i.exec(t)
  return limparCodigo(achou ? achou[1] : t).slice(0, 20)
}

// A minha voz está chegando nessa pessoa? (pela chamada que eu fiz, ou pela que ela fez e eu atendi levando a minha voz)
function vozChegaEm(id) {
  if (conectada(saidas.get(id + '|voz'))) return true
  return [...recebidas].some((chamada) => chamada.peer === id && chamada.levaMinhaVoz && conectada(chamada))
}

// Manda o som para a saída de áudio escolhida (só Chrome, Edge e Brave sabem fazer isso)
function aplicarSaida(elemento) {
  if (!saidaDeSom || !elemento || !elemento.setSinkId) return
  elemento.setSinkId(saidaDeSom).catch(() => { /* fica na saída padrão */ })
}

// Põe o áudio de uma pessoa para tocar. Se o navegador bloquear o som automático, chama aoBloquear
// (a tela então mostra o botão "Ativar o som").
function tocarAudio(elemento, fluxo, aoBloquear) {
  if (!elemento || elemento.srcObject === fluxo) return
  elemento.srcObject = fluxo
  aplicarSaida(elemento)
  const promessa = elemento.play()
  if (promessa) promessa.catch((erro) => { if (erro && erro.name === 'NotAllowedError') aoBloquear() })
}

// O áudio da chamada é feito para voz. Para a música, pede ao Opus som estéreo e mais qualidade.
const somDeMusica = (sdp) => sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=128000')
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
  desligarPlayer(false) // para o bot de música (sem avisar a rede: tudo está sendo encerrado)
  pararFluxo(streamVoz); pararFluxo(streamCamera); pararFluxo(streamTela); pararFluxo(streamMusica)
  streamVoz = null; streamCamera = null; streamTela = null; streamMusica = null; minhaMusica = null
  if (peer) peer.destroy()
  peer = null; conexoes.clear(); tentando.clear(); saidas.clear()
  recebidas.clear(); fluxosDe.clear(); ultimoSinal.clear(); conectadoEm.clear(); nomesPorId.clear(); falhasEnvio.clear(); mandamPing.clear()
  querem.clear(); pedidos.clear(); falhasConexao.clear(); ausentes.clear(); semConexao.clear(); diagLinhas.length = 0
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
function MiniChamada({ miniatura, sala, total, micLigado, falandoNomes, musicaAgora, naJanela, aoAlternarMic, aoSair, aoAbrir, aoJanela }) {
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
      {musicaAgora && <p className="flex items-center gap-1 truncate text-xs text-purple-400"><i className="bi bi-music-note-beamed" /> {musicaAgora}</p>}
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
  const { usuario } = useAuth()
  const nomeDeUsuario = (usuario && (usuario.username || usuario.displayName)) || 'Alguém' // o nome vem do login
  const [apelido, setApelido] = useState(() => localStorage.getItem('tl_apelido') || '')    // opcional: vazio = vale o nome de usuário
  const [sala, setSala] = useState(() => limparCodigo(new URLSearchParams(window.location.search).get('sala')))
  const [naSala, setNaSala] = useState(false)
  const [aviso, setAviso] = useState('')
  const [avisoEnvio, setAvisoEnvio] = useState('')   // "a minha voz não está chegando em fulano" (some sozinho quando passa a chegar)
  const [avisoRede, setAvisoRede] = useState('')       // "tem alguém na sala, mas a conexão direta com a pessoa não abre"
  const [diagnostico, setDiagnostico] = useState([])   // últimas falhas de conexão (seção "Detalhes técnicos")
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
  const [saidasDeSom, setSaidasDeSom] = useState([])  // saídas de áudio (fones, caixas) do computador
  const [saidaId, setSaidaId] = useState(saidaDeSom)  // a saída que estou usando ('' = a padrão)
  const [problemaMic, setProblemaMic] = useState('') // aviso sobre o meu microfone ('' = tudo certo)
  const [somBloqueado, setSomBloqueado] = useState(false) // o navegador bloqueou o som da chamada
  const [efeitos, setEfeitos] = useState(efeitosLigados)    // efeitos sonoros (entrar, sair, mutar) ligados?
  const [botAberto, setBotAberto] = useState(false)         // painel do bot de música aberto?
  const [minhaMusicaInfo, setMinhaMusicaInfo] = useState(null) // o que o MEU bot está tocando
  const [avisoMusica, setAvisoMusica] = useState('')        // recado do bot (ex.: "fulano assumiu o bot")
  const [volumeMusica, setVolumeMusica] = useState(() => Number(localStorage.getItem('tl_volume_musica') || 0.8)) // volume da música dos outros, só para mim

  // Só encerra tudo quando o site inteiro fecha (trocar de página não derruba a chamada)
  useEffect(() => {
    return () => encerrarTudo()
  }, [])

  // Se a chamada for desmontada (ex.: a pessoa saiu da conta) com a janela flutuante aberta, fecha a janela também
  useEffect(() => {
    return () => { if (janelaPip) janelaPip.close() }
  }, [janelaPip])

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
        setSaidasDeSom(dispositivos.filter((d) => d.kind === 'audiooutput'))
      } catch { /* sem lista: segue com o microfone padrão */ }
    }
    listar()
    navigator.mediaDevices.addEventListener('devicechange', listar) // plugou ou tirou um fone
    return () => navigator.mediaDevices.removeEventListener('devicechange', listar)
  }, [naSala])

  // ---------- Lista de pessoas na tela ----------
  function atualizarPessoa(id, dados) {
    setPessoas((anterior) => {
      const atual = anterior[id]
      if (atual && Object.keys(dados).every((chave) => atual[chave] === dados[chave])) return anterior // nada mudou: não redesenha
      return {
        ...anterior,
        [id]: { nome: 'Participante', personagem: '', mestre: false, mesa: '', mic: true, voz: null, camera: null, tela: null, musica: null, musicaInfo: null, semVoz: false, naoOuveMe: false, ...atual, ...dados },
      }
    })
  }

  function removerPessoa(id) {
    setPessoas((anterior) => {
      const novo = { ...anterior }
      delete novo[id]
      return novo
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
    if (tipo !== 'voz') {
      // avisa a pessoa: se esta chamada não conectar, ela vai buscar a mídia por conta própria (ver "pedir")
      const conexao = conexoes.get(id)
      if (conexao) { try { conexao.send({ tem: tipo }) } catch { /* ignora */ } }
    }

    // Se a chamada cair ou não conectar, tenta de novo. Sem isso a pessoa ficaria sem ouvir (ou ver)
    // você até alguém sair e entrar de novo.
    let conectou = false
    chamada.on('iceStateChanged', (estado) => {
      if (estado === 'connected' || estado === 'completed') { conectou = true; chamada.conectou = true }
      if (tipo === 'voz') atualizarAvisoEnvio()
      atualizarPessoa(id, { [tipo]: fluxoAtual(id, tipo) }) // a mídia que chega por esta chamada (se houver) pode passar a valer
      if (estado === 'disconnected') {
        // o navegador só dá a chamada por perdida depois de uns 30 s; se não voltar em 8 s, já refaz
        setTimeout(() => { if (conectada(chamada) === false && chamada.peerConnection && chamada.peerConnection.iceConnectionState === 'disconnected') seFalhar() }, 8000)
      }
    })
    if (tipo === 'voz') {
      // quem atende leva a voz dele junto: se a chamada que ELE faz para mim falhar, esta traz a voz dele
      let recebida = null
      chamada.on('stream', (fluxo) => { recebida = fluxo; guardarFluxo(id, 'voz', fluxo, chamada) })
      chamada.on('close', () => retirarFluxo(id, 'voz', recebida))
    }
    const seFalhar = () => {
      if (!ativa || saidas.get(chave) !== chamada) return // saiu da chamada, ou ela foi encerrada de propósito
      saidas.delete(chave)
      if (!conectou) registrarDiagnostico('minha ' + tipo + ' para ' + nomeDe(id) + ' não conectou', chamada)
      setTimeout(() => chamada.close(), 500) // dá tempo de ler os dados da conexão antes de fechar
      refazerEnvio(id, tipo, conectou ? 0 : tentativa + 1)
    }
    chamada.on('close', seFalhar)
    setTimeout(() => { if (!conectou) seFalhar() }, 15000) // 15 s sem conectar: refaz a chamada
  }

  function refazerEnvio(id, tipo, tentativa) {
    if (tentativa > 4) {
      if (tipo === 'voz') {
        falhasEnvio.add(id)   // o aviso aparece, e some sozinho quando a minha voz passar a chegar
        atualizarAvisoEnvio()
      } else {
        const oQue = tipo === 'tela' ? 'compartilhamento de tela' : (tipo === 'musica' ? 'som do bot de música' : 'vídeo')
        setAviso('Não consegui enviar o seu ' + oQue + ' para ' + nomeDe(id) + '. Peça para ele sair da sala e entrar de novo.')
      }
      // continua tentando de vez em quando, para a chamada se recuperar sozinha
      setTimeout(() => { if (ativa && conexoes.has(id) && !saidas.has(id + '|' + tipo)) refazerEnvio(id, tipo, 0) }, 20000)
      return
    }
    setTimeout(() => {
      const fluxo = { voz: streamVoz, camera: streamCamera, tela: streamTela, musica: streamMusica }[tipo] // sempre o fluxo de agora
      if (!ativa || !peer || !fluxo || !conexoes.has(id) || saidas.has(id + '|' + tipo)) return
      enviar(id, tipo, fluxo, tentativa)
    }, 2000)
  }

  function enviarTudoPara(id) {
    if (streamVoz) enviar(id, 'voz', streamVoz)
    if (streamCamera) enviar(id, 'camera', streamCamera)
    if (streamTela) enviar(id, 'tela', streamTela)
    if (streamMusica) enviar(id, 'musica', streamMusica)
  }

  function pararEnvio(tipo) {
    saidas.forEach((chamada, chave) => {
      if (chave.endsWith('|' + tipo)) { saidas.delete(chave); chamada.close() }
    })
    recebidas.forEach((chamada) => { // as que as pessoas fizeram para buscar essa mídia comigo
      if (chamada.pedido === tipo) { recebidas.delete(chamada); chamada.close() }
    })
    // avisa os outros na hora para o quadro sumir
    conexoes.forEach((conexao) => { try { conexao.send({ parou: tipo }) } catch { /* ignora */ } })
  }

  // ---------- Conexões entre as pessoas ----------
  // Fecha as chamadas que eu fiz para uma pessoa
  function fecharEnvios(id) {
    saidas.forEach((chamada, chave) => {
      if (chave.startsWith(id + '|')) { saidas.delete(chave); chamada.close() }
    })
  }

  // Fecha as chamadas que uma pessoa fez para mim (e esquece as mídias dela)
  function fecharRecebidas(id) {
    recebidas.forEach((chamada) => {
      if (chamada.peer === id) { recebidas.delete(chamada); chamada.close() }
    })
    ;[...fluxosDe.keys()].forEach((chave) => { if (chave.startsWith(id + '|')) fluxosDe.delete(chave) })
  }

  // Esquece o que a pessoa avisou que enviava e fecha as chamadas que eu tinha feito para buscar isso
  function esquecerPedidosDe(id) {
    querem.forEach((_, chave) => { if (chave.startsWith(id + '|')) querem.delete(chave) })
    pedidos.forEach((chamada, chave) => { if (chave.startsWith(id + '|')) { pedidos.delete(chave); chamada.close() } })
  }

  // Guarda a mídia que chegou de uma pessoa (por qualquer das chamadas) e põe a que vale para tocar
  function guardarFluxo(id, tipo, fluxo, chamada) {
    const chave = id + '|' + tipo
    const lista = fluxosDe.get(chave) || []
    if (!lista.some((v) => v.fluxo === fluxo)) lista.push({ fluxo, chamada })
    fluxosDe.set(chave, lista)
    atualizarPessoa(id, { [tipo]: fluxoAtual(id, tipo) })
  }

  // Uma chamada acabou: tira o fluxo dela. Se era o que tocava, passa para o de reserva (se houver).
  // Uma chamada antiga que fecha atrasada não apaga a mídia da nova.
  function retirarFluxo(id, tipo, fluxo) {
    const chave = id + '|' + tipo
    fluxosDe.set(chave, (fluxosDe.get(chave) || []).filter((v) => v.fluxo !== fluxo))
    const proximo = fluxoAtual(id, tipo)
    setPessoas((anterior) => {
      if (!anterior[id] || anterior[id][tipo] !== fluxo) return anterior // não era o que tocava
      return { ...anterior, [id]: { ...anterior[id], [tipo]: proximo } }
    })
  }

  // Câmera, tela e música: quem envia oferece a chamada. Se ela não conectar (acontece quando a rede de quem envia
  // não consegue "oferecer"), eu mesmo ofereço uma chamada para buscar a mídia e a pessoa atende levando ela.
  function pedir(id, tipo) {
    const chave = id + '|' + tipo
    if (!peer || peer.destroyed || peer.disconnected || pedidos.has(chave)) return
    const chamada = peer.call(id, new MediaStream(), {
      metadata: { tipo: tipo, nome: meuNome, pedido: true },
      constraints: { offerToReceiveAudio: tipo !== 'camera', offerToReceiveVideo: tipo !== 'musica' },
      sdpTransform: tipo === 'musica' ? somDeMusica : undefined,
    })
    if (!chamada) return
    pedidos.set(chave, chamada)
    let recebido = null
    chamada.on('stream', (fluxo) => { recebido = fluxo; guardarFluxo(id, tipo, fluxo, chamada) })
    chamada.on('iceStateChanged', () => atualizarPessoa(id, { [tipo]: fluxoAtual(id, tipo) }))
    chamada.on('close', () => {
      if (pedidos.get(chave) === chamada) pedidos.delete(chave)
      retirarFluxo(id, tipo, recebido)
    })
    setTimeout(() => {
      if (conectada(chamada) || pedidos.get(chave) !== chamada) return
      registrarDiagnostico('busca da ' + tipo + ' de ' + nomeDe(id) + ' não conectou', chamada)
      setTimeout(() => chamada.close(), 500) // fecha e, na próxima checagem, tenta de novo
    }, 15000)
  }

  // Vai buscar a mídia de quem avisou que está enviando e cuja chamada não conectou em PEDIR_DEPOIS ms
  function conferirPedidos() {
    if (!ativa) return
    querem.forEach((desde, chave) => {
      const [id, tipo] = chave.split('|')
      if (!conexoes.has(id) || fluxoChega(id, tipo) || pedidos.has(chave)) return
      if (Date.now() - desde >= PEDIR_DEPOIS) pedir(id, tipo)
    })
  }

  // Guarda, para a seção "Detalhes técnicos", o motivo provável de uma conexão que não abriu
  async function registrarDiagnostico(titulo, ligacao) {
    let detalhe = 'sem dados'
    const conexao = ligacao && ligacao.peerConnection
    if (conexao) {
      try {
        const estatisticas = await conexao.getStats()
        const meus = new Set(), dele = new Set(), pares = {}
        estatisticas.forEach((r) => {
          if (r.type === 'local-candidate') meus.add(r.candidateType + '/' + (r.protocol || '?'))
          if (r.type === 'remote-candidate') dele.add(r.candidateType)
          if (r.type === 'candidate-pair') pares[r.state] = (pares[r.state] || 0) + 1
        })
        detalhe = 'ice=' + conexao.iceConnectionState + ' | meus candidatos: ' + ([...meus].join(', ') || 'nenhum') + ' | dele: ' + ([...dele].join(', ') || 'nenhum') + ' | pares: ' + JSON.stringify(pares)
      } catch { /* a conexão já fechou */ }
    }
    diagLinhas.unshift(new Date().toLocaleTimeString('pt-BR') + ' ' + titulo + ' (' + detalhe + ')')
    diagLinhas.length = Math.min(diagLinhas.length, 12)
    setDiagnostico([...diagLinhas])
  }

  // Aviso de "tem alguém na sala, mas a conexão direta não abre"
  function atualizarAvisoRede() {
    semConexao.forEach((id) => { if (conexoes.has(id)) semConexao.delete(id) })
    setAvisoRede(semConexao.size ? 'Tem alguém nessa sala, mas a conexão direta com essa pessoa não abriu. Costuma ser a rede ou o navegador (duas abas no mesmo computador, ou o Brave bloqueando parte da conexão). Veja os "Detalhes técnicos" no fim da página.' : '')
  }

  // Aviso de "a minha voz não chegou": some sozinho quando a voz passa a chegar (ou a pessoa sai)
  function atualizarAvisoEnvio() {
    falhasEnvio.forEach((id) => { if (!conexoes.has(id) || vozChegaEm(id)) falhasEnvio.delete(id) })
    const nomes = [...falhasEnvio].map(nomeDe)
    setAvisoEnvio(nomes.length ? 'Não consegui enviar o seu áudio para ' + nomes.join(', ') + '. Peça para sair da sala e entrar de novo.' : '')
  }

  // Tira a pessoa da sala. Só vale se for a conexão que está registrada: o aviso de fechamento de uma conexão
  // antiga, que chega atrasado, não pode derrubar a nova.
  function limparPessoa(id, conexao) {
    if (conexoes.get(id) !== conexao) return
    conexoes.delete(id); ultimoSinal.delete(id); conectadoEm.delete(id); mandamPing.delete(id)
    fecharEnvios(id)
    fecharRecebidas(id)
    esquecerPedidosDe(id)
    removerPessoa(id)
    atualizarAvisoEnvio()
    if (ativa) tocarEfeito('saiu')
  }

  function derrubarConexao(id) {
    const conexao = conexoes.get(id)
    if (!conexao) return
    try { conexao.close() } catch { /* já estava fechada */ }
    limparPessoa(id, conexao)
  }

  // A cada 4 s: manda um "ping" para todos, tira quem sumiu sem avisar (aba fechada à força, internet caiu)
  // e confere se a voz de cada um está chegando e se a minha está chegando neles
  function verificarSinais() {
    const agora = Date.now()
    conexoes.forEach((conexao, id) => {
      try { conexao.send({ ping: 1 }) } catch { /* ignora */ }
      if (mandamPing.has(id) && agora - (ultimoSinal.get(id) || agora) > SEM_SINAL) derrubarConexao(id)
    })
    conexoes.forEach((conexao, id) => {
      const passouTempo = agora - (conectadoEm.get(id) || agora) > ESPERA_AVISO
      atualizarPessoa(id, { voz: vozAtual(id), semVoz: passouTempo && !vozChegaDe(id), naoOuveMe: passouTempo && !vozChegaEm(id) })
    })
    atualizarAvisoEnvio()
    conferirPedidos()
  }

  // euIniciei = fui eu que procurei a pessoa (ela já estava na sala quando eu cheguei)
  function registrarConexao(conexao, euIniciei) {
    const id = conexao.peer
    const antiga = conexoes.get(id)
    if (antiga === conexao) return
    if (antiga) {
      // a pessoa saiu e entrou de novo antes de a conexão antiga cair: vale a nova
      conexoes.delete(id)
      try { antiga.close() } catch { /* já estava fechada */ }
      fecharEnvios(id)
      fecharRecebidas(id)
      esquecerPedidosDe(id)
    }
    conexoes.set(id, conexao)
    falhasConexao.delete(id); ausentes.delete(id); atualizarAvisoRede()
    ultimoSinal.set(id, Date.now())
    conectadoEm.set(id, Date.now())
    atualizarPessoa(id, { semVoz: false, naoOuveMe: false })
    // som de "entrou": só para quem chegou depois de mim (quem já estava na sala quando eu entrei não conta)
    if (!antiga && (!euIniciei || Date.now() - minhaEntrada > 8000)) tocarEfeito('entrou')
    conexao.send({ perfil: meuPerfil })   // diz quem eu sou: nome, personagem, se sou o mestre, se estou no mudo
    if (minhaMusica) conexao.send({ musica: minhaMusica }) // e o que o meu bot de música está tocando
    enviarTudoPara(id)
    conexao.on('data', (mensagem) => {
      ultimoSinal.set(id, Date.now())
      if (!mensagem) return
      if (mensagem.ping) mandamPing.add(id)
      if (mensagem.tem && !querem.has(id + '|' + mensagem.tem)) {
        querem.set(id + '|' + mensagem.tem, Date.now())
        setTimeout(conferirPedidos, PEDIR_DEPOIS + 300) // se a chamada dela não conectar até lá, vou buscar
      }
      if (mensagem.parou) {
        const chave = id + '|' + mensagem.parou
        querem.delete(chave)
        const minhaBusca = pedidos.get(chave)
        if (minhaBusca) { pedidos.delete(chave); minhaBusca.close() }
        fluxosDe.delete(chave)
        atualizarPessoa(id, { [mensagem.parou]: null, ...(mensagem.parou === 'musica' ? { musicaInfo: null } : {}) })
      }
      if (mensagem.perfil) { nomesPorId.set(id, mensagem.perfil.nome || ''); atualizarPessoa(id, mensagem.perfil) }
      if (typeof mensagem.mic === 'boolean') { atualizarPessoa(id, { mic: mensagem.mic }); tocarEfeito(mensagem.mic ? 'desmutou' : 'mutou') }
      if (mensagem.musica) receberMusica(id, mensagem.musica)
      if (mensagem.rolagem) guardarRolagem(mensagem.rolagem)
    })
    conexao.on('close', () => limparPessoa(id, conexao))
  }

  function conectarCom(id) {
    if (conexoes.has(id) || tentando.has(id)) return
    tentando.add(id)
    const conexao = peer.connect(id, { reliable: true })
    const limite = setTimeout(() => {
      tentando.delete(id)
      if (conexao.open) return
      const falhas = (falhasConexao.get(id) || 0) + 1
      falhasConexao.set(id, falhas)
      const naoTemNinguem = ausentes.has(id) && Date.now() - ausentes.get(id) < 9000 // o servidor disse que a vaga está vazia
      if (!naoTemNinguem && (falhas === 1 || falhas === 3)) registrarDiagnostico('conexão com a vaga ' + id.split('-').pop() + ' não abriu', conexao)
      if (!naoTemNinguem && falhas >= 3) { semConexao.add(id); atualizarAvisoRede() }
      setTimeout(() => conexao.close(), 500)
    }, 6000)
    conexao.on('open', () => { clearTimeout(limite); tentando.delete(id); registrarConexao(conexao, true) })
  }

  // Regra simples: eu só procuro quem tem vaga menor que a minha; quem tem vaga maior me procura
  function procurarOutros() {
    if (!peer || peer.destroyed) return
    for (let n = 1; n < minhaVaga; n++) conectarCom(PREFIXO + salaAtual + '-' + n)
  }

  function configurarPeer() {
    peer.on('connection', (conexao) => conexao.on('open', () => registrarConexao(conexao)))
    peer.on('call', (chamada) => {
      const meta = chamada.metadata || {}
      const tipo = meta.tipo || 'voz'
      if (meta.pedido) {
        // A pessoa quer buscar a minha câmera, tela ou música: ela oferece a chamada e eu atendo levando a mídia.
        // Assim funciona mesmo quando as chamadas que EU ofereço não conseguem conectar.
        const minha = { camera: streamCamera, tela: streamTela, musica: streamMusica }[tipo]
        if (!minha) { chamada.close(); return }
        chamada.pedido = tipo
        chamada.answer(minha, tipo === 'musica' ? { sdpTransform: somDeMusica } : undefined)
        recebidas.add(chamada)
        setTimeout(() => limitarBitrate(chamada, tipo === 'tela' ? 3000000 : 1000000), 1000)
        chamada.on('close', () => recebidas.delete(chamada))
        return
      }
      // Na voz, atendo levando a minha voz junto: se a chamada que EU faço para a pessoa não conseguir conectar,
      // esta leva a minha voz. (Quem recebe toca só uma das duas.) Câmera, tela e música só vão num sentido.
      const resposta = tipo === 'voz' ? streamVoz : null
      chamada.levaMinhaVoz = !!resposta
      chamada.answer(resposta || undefined, tipo === 'musica' ? { sdpTransform: somDeMusica } : undefined)
      recebidas.add(chamada)
      if (meta.nome) nomesPorId.set(chamada.peer, meta.nome)
      chamada.on('iceStateChanged', (estado) => {
        if (estado === 'connected' || estado === 'completed') chamada.conectou = true
        if (tipo === 'voz') atualizarAvisoEnvio()
        atualizarPessoa(chamada.peer, { [tipo]: fluxoAtual(chamada.peer, tipo) })
      })
      let recebido = null // o fluxo que ESTA chamada trouxe
      chamada.on('stream', (fluxo) => {
        recebido = fluxo
        atualizarPessoa(chamada.peer, { nome: meta.nome || 'Participante' })
        guardarFluxo(chamada.peer, tipo, fluxo, chamada)
      })
      chamada.on('close', () => {
        recebidas.delete(chamada)
        retirarFluxo(chamada.peer, tipo, recebido)
      })
    })
    verificador = setInterval(() => { procurarOutros(); verificarSinais() }, 4000)
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
      } else if (erro.type === 'peer-unavailable') {
        // a vaga está vazia (a pessoa saiu): não é problema de rede
        const achou = /tl-c-[A-Za-z0-9_-]+-\d+/.exec(erro.message || '')
        if (achou) { ausentes.set(achou[0], Date.now()); semConexao.delete(achou[0]); falhasConexao.delete(achou[0]); atualizarAvisoRede() }
      } else if (!['webrtc', 'disconnected'].includes(erro.type)) {
        // webrtc (falha de UMA conexão) e disconnected (servidor caiu um instante)
        // se resolvem sozinhos: as chamadas são refeitas e o servidor é reconectado
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
    meuPerfil.mic = trilha.enabled // quem entrar depois já vê se estou no mudo
    conexoes.forEach((conexao) => { try { conexao.send({ mic: trilha.enabled }) } catch { /* ignora */ } })
    tocarEfeito(trilha.enabled ? 'desmutou' : 'mutou')
    setMicLigado(trilha.enabled)
  }

  // ---------- Efeitos sonoros e bot de música ----------
  function alternarEfeitos() {
    const novo = !efeitos
    ligarEfeitos(novo)
    setEfeitos(novo)
    if (novo) tocarEfeito('desmutou') // um "plim" para mostrar que voltou
  }

  function mudarVolumeMusica(volume) {
    setVolumeMusica(volume)
    localStorage.setItem('tl_volume_musica', String(volume))
  }

  // O player (playerMusica.js) chama estas três quando o MEU bot liga, muda de música ou desliga
  function ligarMusica(fluxo) {
    streamMusica = fluxo
    conexoes.forEach((conexao, id) => enviar(id, 'musica', fluxo))
  }

  function mudarMusica(info) {
    minhaMusica = { ...info, por: meuNome }
    setMinhaMusicaInfo(minhaMusica)
    conexoes.forEach((conexao) => { try { conexao.send({ musica: minhaMusica }) } catch { /* ignora */ } })
  }

  function desligarMusica() {
    pararFluxo(streamMusica)
    streamMusica = null; minhaMusica = null
    setMinhaMusicaInfo(null)
    pararEnvio('musica')
  }

  // Outra pessoa ligou o bot de música: guarda o que ela toca. Quem ligou por último assume o bot.
  function receberMusica(id, info) {
    atualizarPessoa(id, { musicaInfo: info })
    if (cederParaOutro(info.desde || 0)) {
      setAvisoMusica((info.por || 'Alguém') + ' assumiu o bot de música.')
      setTimeout(() => setAvisoMusica(''), 8000)
    }
  }

  // Liga o player do bot de música (playerMusica.js) com a rede da chamada
  useEffect(() => {
    definirLigacao({ aoLigar: ligarMusica, aoMudarInfo: mudarMusica, aoDesligar: desligarMusica })
  })

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
    const trocar = (chamada) => {
      if (!chamada.peerConnection) return
      chamada.peerConnection.getSenders().forEach((emissor) => {
        if (emissor.track && emissor.track.kind === 'audio') emissor.replaceTrack(novaTrilha).catch(() => {})
      })
    }
    saidas.forEach((chamada, chave) => { if (chave.endsWith('|voz')) trocar(chamada) })
    recebidas.forEach((chamada) => { if (chamada.levaMinhaVoz) trocar(chamada) }) // as que atendi levando a minha voz
    pararFluxo(streamVoz)
    streamVoz = novo
    usarMicrofone(novo, idDispositivo)
    setAviso('')
  }

  // Escolhe em qual fone/caixa de som a chamada toca (as pessoas, a música e os efeitos)
  function trocarSaida(idDispositivo) {
    saidaDeSom = idDispositivo
    localStorage.setItem('tl_saida', idDispositivo)
    setSaidaId(idDispositivo)
    document.querySelectorAll('audio[data-chamada]').forEach((audio) => aplicarSaida(audio))
    usarSaida(idDispositivo)
  }

  // O navegador só deixa tocar som depois de um clique: este botão libera o som da chamada
  function ativarSom() {
    document.querySelectorAll('audio[data-chamada]').forEach((audio) => { audio.play().catch(() => {}) })
    setSomBloqueado(false)
  }

  async function entrar(comCamera) {
    setAviso('')
    meuNome = apelido.trim() || nomeDeUsuario // o nome vem do login; o apelido é opcional
    meuPerfil = { nome: meuNome, personagem: personagem.trim(), mestre: modo === 'rpg' && ehMestre, mesa: mesa.trim(), mic: true }
    salaAtual = limparCodigo(sala).toLowerCase() || Math.random().toString(36).slice(2, 8) // maiúscula/minúscula não separa salas
    localStorage.setItem('tl_apelido', apelido.trim())
    try {
      streamVoz = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch {
      setAviso('Não consegui usar o microfone. Libere a permissão no navegador e abra o site por https.')
      return
    }
    ativa = true
    minhaEntrada = Date.now()
    tocarEfeito('entrou')
    usarMicrofone(streamVoz)
    setSala(salaAtual); setMicLigado(true); setNaSala(true)
    if (comCamera) await ligarCamera()
    if (SERVIDOR_PEER) fetch('https://' + SERVIDOR_PEER + '/', { mode: 'no-cors' }).catch(() => {}) // acorda o servidor, se estiver dormindo
    reservarVaga(1)
  }

  function sair() {
    if (janelaPip) janelaPip.close()
    encerrarTudo()
    tocarEfeito('saiu')
    setNaSala(false); setPessoas({}); setMinhaCamera(null); setTelaLigada(false); setMicLigado(true); setRolagens([])
    setFalando([]); setMeuFluxo(null); setMicrofones([]); setSaidasDeSom([]); setProblemaMic(''); setSomBloqueado(false); setAvisoEnvio(''); setAvisoRede(''); setDiagnostico([])
    setMinhaMusicaInfo(null); setBotAberto(false); setAvisoMusica('')
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
  // Aviso no quadro da pessoa quando o áudio não está passando (em qualquer um dos dois sentidos)
  const textoProblema = (p) => [p.semVoz ? 'Não recebo o áudio' : '', p.naoOuveMe ? 'Seu áudio não chega' : ''].filter(Boolean).join(' · ')
  // "todos" = eu + os outros no mesmo formato, para qualquer layout desenhar igual
  const todos = [
    { id: 'eu', nome: (apelido.trim() || nomeDeUsuario) + ' (você)', personagem: personagem.trim(), mestre: modo === 'rpg' && ehMestre, mesa: mesa.trim(), camera: minhaCamera, voz: null, falando: falando.includes('eu'), mudo: !micLigado },
    ...lista.map(([id, p]) => ({ id, ...p, falando: falando.includes(id), mudo: p.mic === false, problema: textoProblema(p) })),
  ]
  const falandoNomes = todos.filter((p) => p.falando).map((p) => (p.id === 'eu' ? 'Você' : p.nome))
  // Bot de música de OUTRA pessoa (o meu fica em minhaMusicaInfo)
  const botDeOutro = lista.find(([, p]) => p.musicaInfo)
  const musicaDeOutro = botDeOutro ? { ...botDeOutro[1].musicaInfo, por: botDeOutro[1].musicaInfo.por || botDeOutro[1].nome } : null
  const musicaAgora = (minhaMusicaInfo && minhaMusicaInfo.titulo) || (musicaDeOutro && musicaDeOutro.titulo) || ''
  const telas = lista.filter(([, p]) => p.tela).map(([id, p]) => ({ id, nome: p.nome, tela: p.tela }))
  const painelDados = <PainelDados rolagens={rolagens} expressao={expressao} setExpressao={setExpressao} rotulo={rotulo} setRotulo={setRotulo} aoRolar={rolar} />

  const miniatura = escolherMiniatura(lista, minhaCamera)
  const painelMini = (naJanela) => (
    <MiniChamada
      miniatura={miniatura} sala={sala} total={lista.length + 1} micLigado={micLigado} falandoNomes={falandoNomes} musicaAgora={musicaAgora} naJanela={naJanela}
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
      {avisoEnvio && <p role="alert" className="mb-4 rounded-lg border border-red-500 p-3 text-sm">{avisoEnvio}</p>}
      {avisoRede && <p role="alert" className="mb-4 rounded-lg border border-yellow-500 p-3 text-sm">{avisoRede}</p>}
      {problemaMic && <p role="alert" className="mb-4 rounded-lg border border-yellow-500 p-3 text-sm">{problemaMic}</p>}
      {avisoMusica && <p role="alert" className="mb-4 rounded-lg border border-yellow-500 p-3 text-sm">{avisoMusica}</p>}
      {somBloqueado && (
        <p role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-yellow-500 p-3 text-sm">
          O navegador bloqueou o som da chamada.
          <button onClick={ativarSom} className="rounded-lg bg-purple-600 px-3 py-1 font-semibold text-white hover:bg-purple-500">Ativar o som</button>
        </p>
      )}

      {!naSala ? (
        <div className="mx-auto grid max-w-md gap-4 rounded-xl border border-dark-border bg-dark-card p-6">
          <p className="text-sm text-dark-text-2">Você vai entrar como <strong className="text-dark-text-1">{nomeDeUsuario}</strong></p>
          <label className="grid gap-1 text-sm font-semibold">
            <span>Apelido <span className="font-normal text-dark-text-3">(opcional)</span></span>
            <input
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              maxLength={30}
              placeholder={'Se deixar vazio, usa ' + nomeDeUsuario}
              className="rounded-lg border border-dark-border bg-dark-secondary px-3 py-2 font-normal text-dark-text-1 placeholder:text-dark-text-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Código da sala
            <input
              value={sala}
              onChange={(e) => setSala(extrairCodigo(e.target.value))}
              placeholder="Código da sala (ou cole o link do convite). Vazio = sala nova"
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
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={efeitos} onChange={alternarEfeitos} /> Efeitos sonoros (entrar, sair, mutar)
          </label>
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
            {saidasDeSom.length > 1 && 'setSinkId' in HTMLMediaElement.prototype && (
              <select value={saidaId || 'default'} onChange={(e) => trocarSaida(e.target.value)} aria-label="Escolher saída de áudio" className="max-w-56 rounded-lg border border-dark-border bg-dark-secondary px-3 py-2 text-sm text-dark-text-1">
                {saidasDeSom.map((m, i) => <option key={m.deviceId} value={m.deviceId}>{m.label || 'Saída ' + (i + 1)}</option>)}
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
            <button onClick={() => setBotAberto(!botAberto)} aria-expanded={botAberto} className={classeBotao(botAberto || !!minhaMusicaInfo || !!musicaDeOutro)}>
              <i className="bi bi-music-note-beamed" /> Bot de música
            </button>
            <button onClick={alternarEfeitos} aria-pressed={efeitos} className={classeBotao(efeitos)}>
              <i className={efeitos ? 'bi bi-bell-fill' : 'bi bi-bell-slash-fill'} /> {efeitos ? 'Efeitos: ligados' : 'Efeitos: desligados'}
            </button>
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

          {botAberto && (
            <div className="mt-4">
              <BotDeMusica musicaDeOutro={musicaDeOutro} volumeMusica={volumeMusica} aoMudarVolumeMusica={mudarVolumeMusica} />
            </div>
          )}

          {diagnostico.length > 0 && (
            <details className="mt-4 text-xs text-dark-text-3">
              <summary className="cursor-pointer">Detalhes técnicos (para mostrar ao suporte)</summary>
              <pre className="mt-2 whitespace-pre-wrap">{diagnostico.join('\n')}</pre>
            </details>
          )}
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
          {p.musica && <audio autoPlay data-chamada data-musica ref={(el) => { tocarAudio(el, p.musica, () => setSomBloqueado(true)); if (el) el.volume = volumeMusica }} />}
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
