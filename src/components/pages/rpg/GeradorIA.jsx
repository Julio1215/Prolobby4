import { useState, useRef } from 'react'

export const TIPOS_GERADOR = [
  { key: 'npc',      icon: '🧙', label: 'NPC'       },
  { key: 'cidade',   icon: '🏰', label: 'Cidade'    },
  { key: 'monstro',  icon: '🐉', label: 'Monstro'   },
  { key: 'missao',   icon: '📜', label: 'Missão'    },
  { key: 'encontro', icon: '⚔️', label: 'Encontro'  },
  { key: 'dungeon',  icon: '🏛️', label: 'Dungeon'   },
  { key: 'loot',     icon: '💰', label: 'Recompensa'},
  { key: 'nome',     icon: '🔤', label: 'Nome'      },
  { key: 'lore',     icon: '📖', label: 'Lore'      },
  { key: 'livre',    icon: '💬', label: 'Chat Livre' },
]

const SISTEMAS = ['D&D 5e', 'Tormenta 20', 'Call of Cthulhu', 'Ordem Paranormal', 'Pathfinder 2e']

// ============================================================
// RESPOSTAS DE EXEMPLO — sem backend, sem IA de verdade.
// Cada tipo tem um resultado pronto só pra mostrar como a função
// vai funcionar quando o PHP + IA de verdade entrarem.
// ============================================================
const RESPOSTAS_EXEMPLO = {
  npc: `## Aldric Vane, o Mercador das Sombras

**Raça/Origem:** Humano, exilado do porto de Val'Kyrath

**Personalidade:** Charmoso e extremamente falante, sempre com um sorriso pronto — mas seus olhos nunca sorriem junto.

**Motivação:** Recuperar o nome da família, manchado por uma dívida que não era sua.

**Segredo:** Trabalha secretamente para uma guilda de contrabandistas.

**Ganchos de história:**
- Oferece um item raro por um preço baixo demais
- Pede ajuda discreta para "recuperar uma encomenda perdida"`,

  cidade: `## Val'Kyrath, o Porto das Marés Negras

**Atmosfera:** Névoa salgada, gritos de gaivotas e o eco constante de martelos nos estaleiros.

**Bairros principais:**
- Cais Alto — comércio legal, guardas por toda parte
- Cais Baixo — contrabando, tavernas, ninguém faz perguntas

**Governo:** Um conselho de mercadores disfarça uma disputa de poder por trás de sorrisos.

**Ganchos de aventura:** Um navio chegou vazio — a tripulação simplesmente sumiu.`,

  monstro: `## Sussurrante de Rostos Perdidos

**Aparência:** Silhueta humanoide encoberta por véus finos, o rosto sempre trocando para o de alguém que a vítima ama.

**Comportamento:** Isola alvos, imita vozes conhecidas para atrair.

**Fraquezas:** Não suporta ser confrontada com o nome verdadeiro de quem imita.

**Bloco de estatísticas básico:** CR moderado, alta furtividade, dano psicológico alto.`,

  missao: `## O Cofre que Não Deveria Abrir

**Gancho inicial:** Uma guilda de ladrões rouba um artefato selado há gerações — e ele começou a "chamar" outras coisas.

**Objetivo:** Rastrear a guilda, recuperar o artefato antes que seja vendido.

**Reviravolta:** O artefato já começou a mudar quem o carrega.

**Recompensa:** Ouro da autoridade local + contato na guilda para o futuro.`,

  encontro: `## Emboscada na Ponte Estreita

**Cenário:** Ponte de pedra sobre um desfiladeiro, larga o bastante pra só duas pessoas lado a lado.

**Inimigos:** 3 bandidos e um mago menor (o verdadeiro alvo, fugindo de outra ameaça).

**Condições especiais:** Vento forte impõe desvantagem em ataques à distância.

**Dificuldade sugerida:** Moderada — o terreno é o verdadeiro desafio.`,

  dungeon: `## As Criptas Afundadas

**Tema:** Um templo esquecido, parcialmente submerso, dedicado a um deus que ninguém mais lembra o nome.

**Salas principais:**
1. Átrio inundado até os joelhos, estátuas quebradas
2. Biblioteca selada, ar tóxico
3. Câmara do altar, guardada pelo chefe final

**Armadilhas:** Piso que cede sobre água profunda; gás soporífero na biblioteca.

**Chefe final:** Um guardião de pedra animado, ligado ao altar.`,

  loot: `## Recompensas do Tesouro

**Itens mágicos:**
- Anel de Proteção Menor (+1 CA)
- Adaga que brilha perto de venenos

**Riquezas:** 340 peças de ouro, um colar de safiras (150po)

**Item de história:** Um mapa parcial rasgado, mostrando parte de outra masmorra.`,

  nome: `## Nomes sugeridos

**Humanos:** Aldric, Rosalind, Tomas, Elira
**Élficos:** Sylvaenor, Ithlwen, Faelar
**Anões:** Bruna Punhoférreo, Grunnar Barbaço
**Lugares:** Vale Sussurrante, Portosforja, Ruínas de Kaltheris`,

  lore: `## A Maldição de Valdren

Há 200 anos, o rei Valdren fez um pacto proibido para vencer uma guerra. A vitória veio — mas o preço ainda não foi cobrado por completo.

**Consequência atual:** Uma névoa verde começou a subir dos poços da capital, sinal de que o pacto está prestes a vencer.`,

  livre: `Claro! Terei prazer em ajudar com regras, ideias ou lore.

Já que essa é uma resposta de exemplo (sem IA de verdade conectada), aqui vai uma dica real de mestre: quando o grupo travar numa decisão, pergunte "o que vocês fariam de fato?" e deixe a história se ajustar a partir daí.

Quando a versão completa com IA estiver ativa aqui, essa aba vai responder de verdade a qualquer pergunta.`,
}

export async function chamarIA(tipo) {
  // Versão sem backend: sem chamada de IA de verdade.
  // Um pequeno atraso só para simular o "pensar" antes de responder.
  await new Promise(resolve => setTimeout(resolve, 900))
  return RESPOSTAS_EXEMPLO[tipo] || RESPOSTAS_EXEMPLO.livre
}

export function Markdown({ text }) {
  const html = text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-purple-300 mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-base font-extrabold text-dark-text-1 mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-lg font-black text-dark-text-1 mb-2.5">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-purple-300 font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em class="text-dark-text-2">$1</em>')
    .replace(/^- (.+)$/gm,    '<li class="ml-4 my-1 text-dark-text-1">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')

  return (
    <div className="leading-relaxed text-xs text-dark-text-1" dangerouslySetInnerHTML={{ __html: html }} />
  )
}

function CardResultado({ item, tipos }) {
  const [copiado, setCopiado] = useState(false)
  const tipoInfo = tipos.find(t => t.key === item.tipo)

  function copiar() {
    navigator.clipboard.writeText(item.resultado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-border bg-purple-950/20">
        <div className="flex items-center gap-2.5">
          <span>{tipoInfo?.icon}</span>
          <span className="text-xs font-bold text-purple-300">{tipoInfo?.label}</span>
          <span className="text-[11px] text-dark-text-3 border-l border-purple-800/40 pl-2.5">
            {item.sistema} · {item.horario}
          </span>
        </div>
        <button
          onClick={copiar}
          className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
            copiado ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-purple-600/15 border-purple-500/25 text-purple-300 hover:bg-purple-600/25'
          }`}
        >
          {copiado ? '✓ Copiado' : '📋 Copiar'}
        </button>
      </div>
      <div className="px-5 py-3 border-b border-purple-900/10 bg-black/15">
        <p className="text-[11px] text-dark-text-3 italic">"{item.input}"</p>
      </div>
      <div className="p-5">
        <Markdown text={item.resultado} />
      </div>
    </div>
  )
}

// Componente reaproveitável de geração — usado tanto em Ferramentas
// quanto na aba de assistente do Mestre IA, só muda a lista de tipos.
export default function GeradorIA({ tipos = TIPOS_GERADOR, tipoInicial }) {
  const [tipo, setTipo] = useState(tipoInicial || tipos[0].key)
  const [sistema, setSistema] = useState('D&D 5e')
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [historico, setHistorico] = useState([])
  const inputRef = useRef(null)

  const PLACEHOLDER = 'Descreva o que você quer gerar (ou deixe em branco pra uma sugestão aleatória)...'

  async function handleGerar() {
    setCarregando(true)
    setErro('')
    try {
      const resultado = await chamarIA(tipo)
      const item = {
        id: Date.now(),
        tipo,
        sistema,
        input: input.trim() || `Gerar ${tipos.find(t => t.key === tipo)?.label}`,
        resultado,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }
      setHistorico(prev => [item, ...prev])
      setInput('')
      inputRef.current?.focus()
    } catch (err) {
      setErro(err.message || 'Erro ao conectar com a IA')
    } finally {
      setCarregando(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGerar()
  }

  return (
    <div className="flex flex-col gap-6 text-dark-text-1">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex gap-1.5 flex-wrap">
          {tipos.map(t => (
            <button
              key={t.key}
              onClick={() => setTipo(t.key)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer transition ${
                tipo === t.key
                  ? 'border border-purple-500 bg-purple-600/15 text-purple-300'
                  : 'border border-dark-border bg-transparent text-dark-text-2 hover:text-dark-text-1'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[11px] text-dark-text-3 font-bold uppercase tracking-wider">Sistema:</span>
          {SISTEMAS.map(s => (
            <button
              key={s}
              onClick={() => setSistema(s)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                sistema === s
                  ? 'border border-purple-500/50 bg-purple-600/15 text-purple-300'
                  : 'border border-dark-border bg-transparent text-dark-text-2 hover:text-dark-text-1'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={PLACEHOLDER}
            rows={3}
            className="w-full bg-dark-secondary/80 border border-dark-border/80 rounded-xl p-3 text-sm text-dark-text-1 placeholder-dark-text-3 outline-none focus:border-purple-500 transition resize-y leading-relaxed"
          />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-dark-text-3">Ctrl+Enter para gerar</span>
            <button
              onClick={handleGerar}
              disabled={carregando}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center justify-center min-w-36 cursor-pointer"
            >
              {carregando ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gerando...
                </span>
              ) : `✨ Gerar ${tipos.find(t => t.key === tipo)?.label}`}
            </button>
          </div>
        </div>

        {erro && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">⚠️ {erro}</div>
        )}
      </div>

      {carregando && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-xs text-dark-text-2">O Mestre está preparando algo épico...</p>
        </div>
      )}

      {historico.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">📜 Gerados nesta sessão</h2>
            <button onClick={() => setHistorico([])} className="text-xs text-dark-text-3 hover:text-red-400 cursor-pointer transition">
              Limpar histórico
            </button>
          </div>
          {historico.map(item => <CardResultado key={item.id} item={item} tipos={tipos} />)}
        </div>
      )}

      {!carregando && historico.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center p-12 gap-4 bg-purple-950/20 border border-dashed border-purple-800/30 rounded-2xl">
          <span className="text-5xl">🎲</span>
          <div>
            <p className="font-bold mb-1">Pronto para criar aventuras épicas</p>
            <p className="text-xs text-dark-text-2 max-w-xs">Escolha o tipo de conteúdo, o sistema RPG, descreva o que quer e deixe a IA trabalhar</p>
          </div>
        </div>
      )}
    </div>
  )
}
