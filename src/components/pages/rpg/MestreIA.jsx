import { useState, useRef, useEffect } from 'react'
import RpgSubNav from './RpgSubNav'
import GeradorIA, { TIPOS_GERADOR, chamarIA, Markdown } from './GeradorIA'

const SISTEMAS = ['D&D 5e', 'Tormenta 20', 'Call of Cthulhu', 'Ordem Paranormal', 'Pathfinder 2e']
const DIFICULDADES = ['Fácil', 'Média', 'Difícil']
const TONS = ['Aventura', 'Sério', 'Humor', 'Sombrio']

// Continuações de exemplo — sem IA de verdade conectada ainda,
// então giramos entre algumas respostas pra não repetir sempre a mesma.
const CONTINUACOES_EXEMPLO = [
  'Vocês avançam com cautela. O ambiente ao redor reage à sua decisão de formas que só o tempo vai revelar — um barulho distante, uma sombra que se move rápido demais para ser natural.',
  'Sua ação chama atenção. Alguém — ou algo — percebeu o que vocês acabaram de fazer, e as consequências começam a se desenhar.',
  'O grupo sente que está no caminho certo. Mas cada passo à frente parece deixar vocês mais perto de algo que talvez fosse melhor não encontrar.',
  'Um detalhe que passou despercebido antes agora chama sua atenção — pode ser importante, ou pode ser só a tensão do momento brincando com vocês.',
]

function narracaoInicial({ tema, sistema, jogadores, nivel, dificuldade, tom }) {
  const cenario = tema?.trim() || 'uma terra esquecida entre montanhas e névoa'
  return `Vocês, um grupo de ${jogadores} aventureiro${jogadores > 1 ? 's' : ''} de nível ${nivel} (${sistema}), chegam a ${cenario}. O tom da jornada promete ser de ${tom.toLowerCase()}, com desafios de dificuldade ${dificuldade.toLowerCase()}.

Após uma longa viagem, o caminho se abre para um pequeno povoado. As ruas estão estranhamente silenciosas para esse horário do dia — janelas fechadas, nenhuma criança brincando, apenas o vento levantando poeira entre as casas.

O que vocês fazem?`
}

export default function MestreIA() {
  const [modo, setModo] = useState('narrar') // 'narrar' | 'ferramentas'

  return (
    <div className="flex flex-col gap-6 text-dark-text-1">
      <RpgSubNav ativa="mestre" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-text-1">🤖 Mestre IA</h1>
          <p className="text-sm text-dark-text-2 mt-1">Narre uma aventura interativa ou peça ajuda pra mestrar a sua.</p>
        </div>
        <div className="flex gap-1.5 bg-dark-card border border-dark-border rounded-xl p-1">
          <button
            onClick={() => setModo('narrar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${modo === 'narrar' ? 'bg-purple-600 text-white' : 'text-dark-text-2 hover:text-dark-text-1'}`}
          >
            🗺️ Narrar Aventura
          </button>
          <button
            onClick={() => setModo('ferramentas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${modo === 'ferramentas' ? 'bg-purple-600 text-white' : 'text-dark-text-2 hover:text-dark-text-1'}`}
          >
            🛠️ Assistente do Mestre
          </button>
        </div>
      </div>

      {modo === 'narrar' ? <NarrarAventura /> : <GeradorIA tipos={TIPOS_GERADOR} />}
    </div>
  )
}

function NarrarAventura() {
  const [configurado, setConfigurado] = useState(false)
  const [config, setConfig] = useState({
    tema: '',
    sistema: SISTEMAS[0],
    jogadores: 4,
    nivel: 1,
    dificuldade: 'Média',
    tom: 'Aventura',
  })
  const [mensagens, setMensagens] = useState([])
  const [entrada, setEntrada] = useState('')
  const [carregando, setCarregando] = useState(false)
  const fimRef = useRef(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  function iniciar(e) {
    e.preventDefault()
    setMensagens([{ autor: 'ia', texto: narracaoInicial(config) }])
    setConfigurado(true)
  }

  async function enviar(e) {
    e.preventDefault()
    if (!entrada.trim()) return
    const acao = entrada.trim()
    setMensagens(prev => [...prev, { autor: 'jogador', texto: acao }])
    setEntrada('')
    setCarregando(true)
    await chamarIA('livre') // mantém o mesmo "atraso pensando" do resto do app
    const resposta = CONTINUACOES_EXEMPLO[Math.floor(Math.random() * CONTINUACOES_EXEMPLO.length)]
    setMensagens(prev => [...prev, { autor: 'ia', texto: resposta }])
    setCarregando(false)
  }

  function novaAventura() {
    setConfigurado(false)
    setMensagens([])
  }

  if (!configurado) {
    return (
      <form onSubmit={iniciar} className="bg-dark-card border border-dark-border rounded-2xl p-5 flex flex-col gap-4 max-w-xl">
        <div>
          <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Tema da aventura</label>
          <input
            value={config.tema}
            onChange={e => setConfig({ ...config, tema: e.target.value })}
            placeholder="Ex: fantasia medieval, terror cósmico, cidade portuária..."
            className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Sistema</label>
            <select value={config.sistema} onChange={e => setConfig({ ...config, sistema: e.target.value })} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500">
              {SISTEMAS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Jogadores</label>
            <input type="number" min={1} max={8} value={config.jogadores} onChange={e => setConfig({ ...config, jogadores: Number(e.target.value) })} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Nível</label>
            <input type="number" min={1} max={20} value={config.nivel} onChange={e => setConfig({ ...config, nivel: Number(e.target.value) })} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Dificuldade</label>
            <select value={config.dificuldade} onChange={e => setConfig({ ...config, dificuldade: e.target.value })} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500">
              {DIFICULDADES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Tom da aventura</label>
            <select value={config.tom} onChange={e => setConfig({ ...config, tom: e.target.value })} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500">
              {TONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer">
          🎬 Iniciar Aventura
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button onClick={novaAventura} className="text-xs text-dark-text-3 hover:text-red-400 cursor-pointer">Nova aventura</button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex flex-col gap-4 max-h-[55vh] overflow-y-auto">
        {mensagens.map((m, i) => (
          <div key={i} className={m.autor === 'jogador' ? 'self-end max-w-[85%]' : 'max-w-[90%]'}>
            {m.autor === 'ia' ? (
              <div className="bg-purple-950/20 border border-purple-900/20 rounded-xl p-4">
                <Markdown text={m.texto} />
              </div>
            ) : (
              <div className="bg-purple-600/15 border border-purple-600/25 rounded-xl px-4 py-2.5 text-sm text-dark-text-1">
                {m.texto}
              </div>
            )}
          </div>
        ))}
        {carregando && (
          <div className="flex items-center gap-2 text-xs text-dark-text-3">
            <span className="w-3 h-3 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
            O Mestre está narrando...
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form onSubmit={enviar} className="flex gap-2">
        <input
          value={entrada}
          onChange={e => setEntrada(e.target.value)}
          placeholder="O que você faz?"
          className="flex-1 bg-dark-secondary border border-dark-border rounded-xl px-3 py-2.5 text-sm text-dark-text-1 outline-none focus:border-purple-500"
        />
        <button type="submit" disabled={carregando} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer">
          Enviar
        </button>
      </form>
    </div>
  )
}
