import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Peer from 'peerjs'
import { LayoutConversa, LayoutApresentacao, LayoutRpg, PainelDados, colocarFluxo } from './LayoutsChamada.jsx'

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
function MiniChamada({ miniatura, sala, total, micLigado, naJanela, aoAlternarMic, aoSair, aoAbrir, aoJanela }) {
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
      <p className="text-xs text-dark-text-2">Sala {sala}: {total} pessoa(s)</p>
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

  // ---------- Enviar a minha mídia ----------
  // Voz, câmera e tela vão em chamadas separadas: dá para ligar e desligar cada uma sem renegociar nada
  function enviar(id, tipo, fluxo) {
    const chamada = peer.call(id, fluxo, { metadata: { tipo: tipo, nome: meuNome } })
    saidas.set(id + '|' + tipo, chamada)
    setTimeout(() => limitarBitrate(chamada, tipo === 'tela' ? 3000000 : 1000000), 1000)
  }

  function enviarTudoPara(id) {
    if (streamVoz) enviar(id, 'voz', streamVoz)
    if (streamCamera) enviar(id, 'camera', streamCamera)
    if (streamTela) enviar(id, 'tela', streamTela)
  }

  function pararEnvio(tipo) {
    saidas.forEach((chamada, chave) => {
      if (chave.endsWith('|' + tipo)) { chamada.close(); saidas.delete(chave) }
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
        if (chave.startsWith(id + '|')) { chamada.close(); saidas.delete(chave) }
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
      chamada.on('stream', (fluxo) => atualizarPessoa(chamada.peer, { nome: meta.nome || 'Participante', [tipo]: fluxo }))
      chamada.on('close', () => atualizarPessoa(chamada.peer, { [tipo]: null }))
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
    setSala(salaAtual); setMicLigado(true); setNaSala(true)
    if (comCamera) await ligarCamera()
    if (SERVIDOR_PEER) fetch('https://' + SERVIDOR_PEER + '/', { mode: 'no-cors' }).catch(() => {}) // acorda o servidor, se estiver dormindo
    reservarVaga(1)
  }

  function sair() {
    if (janelaPip) janelaPip.close()
    encerrarTudo()
    setNaSala(false); setPessoas({}); setMinhaCamera(null); setTelaLigada(false); setMicLigado(true); setRolagens([])
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
    { id: 'eu', nome: (nome.trim() || 'Alguém') + ' (você)', personagem: personagem.trim(), mestre: modo === 'rpg' && ehMestre, mesa: mesa.trim(), camera: minhaCamera, voz: null },
    ...lista.map(([id, p]) => ({ id, ...p })),
  ]
  const telas = lista.filter(([, p]) => p.tela).map(([id, p]) => ({ id, nome: p.nome, tela: p.tela }))
  const painelDados = <PainelDados rolagens={rolagens} expressao={expressao} setExpressao={setExpressao} rotulo={rotulo} setRotulo={setRotulo} aoRolar={rolar} />

  const miniatura = escolherMiniatura(lista, minhaCamera)
  const painelMini = (naJanela) => (
    <MiniChamada
      miniatura={miniatura} sala={sala} total={lista.length + 1} micLigado={micLigado} naJanela={naJanela}
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
          {p.voz && <audio autoPlay ref={(el) => colocarFluxo(el, p.voz)} />}
          {p.tela && <audio autoPlay ref={(el) => colocarFluxo(el, p.tela)} />}
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
