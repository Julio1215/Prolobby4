import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import {
  listarCampanhas,
  buscarCampanha,
  listarFichasPorCampanha,
  listarItensCampanha,
  criarItemCampanha,
  atualizarItemCampanha,
  deletarItemCampanha,
} from '../../../services/localDb'
import RpgSubNav from './RpgSubNav'
import { ModalCriarCampanha, ModalEntrarCampanha } from './Dashboard'

// Configuração de cada seção "genérica" de itens dentro de uma campanha.
// Uma seção só = um tipo de item + os campos extras do formulário dela.
const SECOES_ITENS = [
  {
    chave: 'npc', tipo: 'npc', label: 'NPCs', icone: '👤',
    campos: [
      { chave: 'descricao', label: 'Descrição', tipoCampo: 'textarea' },
      { chave: 'personalidade', label: 'Personalidade', tipoCampo: 'texto' },
      { chave: 'funcao', label: 'Função na campanha', tipoCampo: 'texto' },
      { chave: 'historia', label: 'História', tipoCampo: 'textarea' },
      { chave: 'segredo', label: 'Segredo', tipoCampo: 'textarea' },
    ],
  },
  {
    chave: 'monstro', tipo: 'monstro', label: 'Bestiário', icone: '👹',
    campos: [
      { chave: 'hp', label: 'HP', tipoCampo: 'numero' },
      { chave: 'ataque', label: 'Ataque', tipoCampo: 'texto' },
      { chave: 'defesa', label: 'Defesa', tipoCampo: 'numero' },
      { chave: 'nivel', label: 'Nível/Desafio', tipoCampo: 'texto' },
      { chave: 'habilidades', label: 'Habilidades', tipoCampo: 'textarea' },
      { chave: 'descricao', label: 'Descrição', tipoCampo: 'textarea' },
    ],
  },
  {
    chave: 'missao', tipo: 'missao', label: 'Missões', icone: '🎯',
    campos: [
      { chave: 'objetivo', label: 'Objetivo', tipoCampo: 'textarea' },
      { chave: 'recompensa', label: 'Recompensa', tipoCampo: 'texto' },
      { chave: 'status', label: 'Status', tipoCampo: 'select', opcoes: ['Ativa', 'Concluída', 'Falhou'] },
    ],
  },
  {
    chave: 'sessao', tipo: 'sessao', label: 'Diário', icone: '📖',
    tituloPlaceholder: 'Ex: Sessão 03',
    campos: [{ chave: 'texto', label: 'O que aconteceu', tipoCampo: 'textarea' }],
  },
  {
    chave: 'lore', tipo: 'lore', label: 'Lore', icone: '📜',
    campos: [{ chave: 'texto', label: 'Texto', tipoCampo: 'textarea' }],
  },
  {
    chave: 'mapa', tipo: 'mapa', label: 'Mapas', icone: '🗺️',
    campos: [
      { chave: 'descricao', label: 'Descrição', tipoCampo: 'textarea' },
      { chave: 'url', label: 'Link da imagem (opcional)', tipoCampo: 'texto' },
    ],
  },
  {
    chave: 'item', tipo: 'item', label: 'Inventário', icone: '💰',
    campos: [
      { chave: 'quantidade', label: 'Quantidade', tipoCampo: 'numero' },
      { chave: 'descricao', label: 'Descrição', tipoCampo: 'textarea' },
    ],
  },
  {
    chave: 'anotacao', tipo: 'anotacao', label: 'Anotações', icone: '🗒️',
    campos: [{ chave: 'texto', label: 'Texto', tipoCampo: 'textarea' }],
  },
]

export default function Campanhas() {
  const { usuario } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [campanhas, setCampanhas] = useState([])
  const [campanhaAbertaId, setCampanhaAbertaId] = useState(location.state?.abrirCampanhaId || null)
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEntrar, setModalEntrar] = useState(false)

  useEffect(() => {
    if (!usuario) return
    setCampanhas(listarCampanhas(usuario.id))
  }, [usuario])

  function recarregar() {
    setCampanhas(listarCampanhas(usuario.id))
  }

  if (!usuario) {
    return (
      <div className="flex flex-col gap-6 text-dark-text-1">
        <RpgSubNav ativa="campanhas" />
        <p className="text-center text-dark-text-2 py-10">Faça login para ver suas campanhas.</p>
      </div>
    )
  }

  if (campanhaAbertaId) {
    return (
      <CampanhaDetalhe
        campanhaId={campanhaAbertaId}
        usuario={usuario}
        aoVoltar={() => { setCampanhaAbertaId(null); recarregar() }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 text-dark-text-1">
      <RpgSubNav ativa="campanhas" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-text-1">Minhas campanhas</h1>
          <p className="text-sm text-dark-text-2 mt-1">Mestre suas mesas ou acompanhe as que você joga.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setModalEntrar(true)} className="border border-dark-border text-dark-text-1 hover:bg-dark-hover px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer">
            Entrar com código
          </button>
          <button onClick={() => setModalCriar(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer">
            + Criar campanha
          </button>
        </div>
      </div>

      {campanhas.length === 0 ? (
        <div className="text-center py-16 text-dark-text-3 text-sm">
          Você ainda não tem nenhuma campanha. Crie uma ou entre com um código de convite.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {campanhas.map(c => (
            <CardCampanha key={c.id} campanha={c} usuario={usuario} aoAbrir={() => setCampanhaAbertaId(c.id)} />
          ))}
        </div>
      )}

      {modalCriar && (
        <ModalCriarCampanha
          usuario={usuario}
          aoFechar={() => setModalCriar(false)}
          aoCriar={nova => { setModalCriar(false); recarregar(); setCampanhaAbertaId(nova.id) }}
        />
      )}
      {modalEntrar && (
        <ModalEntrarCampanha
          usuario={usuario}
          aoFechar={() => setModalEntrar(false)}
          aoEntrar={campanha => { setModalEntrar(false); recarregar(); setCampanhaAbertaId(campanha.id) }}
        />
      )}
    </div>
  )
}

function CardCampanha({ campanha, usuario, aoAbrir }) {
  const souMestre = campanha.mestre.id === usuario.id
  return (
    <button onClick={aoAbrir} className="text-left bg-dark-card border border-dark-border rounded-2xl p-4 hover:border-purple-500/50 transition cursor-pointer">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-bold text-dark-text-1">{campanha.nome}</h3>
        {souMestre && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-600/15 text-purple-300 shrink-0">Mestre</span>
        )}
      </div>
      <p className="text-xs text-dark-text-3 mb-2">{campanha.sistema}</p>
      {campanha.descricao && <p className="text-xs text-dark-text-2 mb-3 line-clamp-2">{campanha.descricao}</p>}
      <p className="text-xs text-dark-text-2">
        {souMestre ? 'Você mestra' : `Mestre: ${campanha.mestre.displayName}`} · {1 + campanha.jogadores.length} na mesa
      </p>
    </button>
  )
}

// ------------------------------------------------------------------
// Ambiente completo de uma campanha aberta
// ------------------------------------------------------------------
function CampanhaDetalhe({ campanhaId, usuario, aoVoltar }) {
  const navigate = useNavigate()
  const [campanha, setCampanha] = useState(null)
  const [secaoAtiva, setSecaoAtiva] = useState('geral')

  useEffect(() => {
    setCampanha(buscarCampanha(campanhaId))
  }, [campanhaId])

  if (!campanha) return null

  function copiarCodigo() {
    navigator.clipboard?.writeText(campanha.codigo)
  }

  const secaoConfig = SECOES_ITENS.find(s => s.chave === secaoAtiva)

  return (
    <div className="flex flex-col gap-5 text-dark-text-1">
      <button onClick={aoVoltar} className="text-sm text-dark-text-2 hover:text-dark-text-1 cursor-pointer self-start">
        ← Voltar pras campanhas
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-text-1">{campanha.nome}</h1>
          <p className="text-sm text-dark-text-3">
            {campanha.sistema} · Mestre: {campanha.mestre.displayName} · {1 + campanha.jogadores.length} na mesa
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => navigate('/rpg/mesa', { state: { campanhaId } })} className="border border-dark-border hover:bg-dark-hover px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer">
            🗺️ Ir pra Mesa
          </button>
          <button onClick={copiarCodigo} title="Copiar código de convite" className="border border-dark-border hover:bg-dark-hover px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-widest cursor-pointer">
            🔗 {campanha.codigo}
          </button>
        </div>
      </div>

      {/* Sub-abas internas da campanha */}
      <div className="flex gap-1.5 flex-wrap border-b border-dark-border/50 pb-3">
        <BotaoSecao chave="geral" label="Visão Geral" icone="📋" ativa={secaoAtiva} aoClicar={setSecaoAtiva} />
        <BotaoSecao chave="personagens" label="Personagens" icone="🧙" ativa={secaoAtiva} aoClicar={setSecaoAtiva} />
        {SECOES_ITENS.map(s => (
          <BotaoSecao key={s.chave} chave={s.chave} label={s.label} icone={s.icone} ativa={secaoAtiva} aoClicar={setSecaoAtiva} />
        ))}
      </div>

      {secaoAtiva === 'geral' && <VisaoGeralCampanha campanha={campanha} />}
      {secaoAtiva === 'personagens' && <PersonagensCampanha campanhaId={campanhaId} usuario={usuario} />}
      {secaoConfig && <SecaoItens campanhaId={campanhaId} config={secaoConfig} />}
    </div>
  )
}

function BotaoSecao({ chave, label, icone, ativa, aoClicar }) {
  return (
    <button
      onClick={() => aoClicar(chave)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition whitespace-nowrap ${
        ativa === chave
          ? 'border border-purple-500/50 bg-purple-600/15 text-purple-300'
          : 'border border-dark-border bg-transparent text-dark-text-2 hover:text-dark-text-1'
      }`}
    >
      {icone} {label}
    </button>
  )
}

function VisaoGeralCampanha({ campanha }) {
  const contagens = SECOES_ITENS.map(s => ({ ...s, total: listarItensCampanha(campanha.id, s.tipo).length }))

  return (
    <div className="flex flex-col gap-4">
      {campanha.descricao && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-dark-text-3 mb-2">Sobre a campanha</h3>
          <p className="text-sm text-dark-text-2 leading-relaxed">{campanha.descricao}</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {contagens.map(c => (
          <div key={c.chave} className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
            <span className="text-2xl block mb-1">{c.icone}</span>
            <span className="text-lg font-bold text-dark-text-1 block">{c.total}</span>
            <span className="text-[11px] text-dark-text-3">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonagensCampanha({ campanhaId, usuario }) {
  const [fichas, setFichas] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setFichas(listarFichasPorCampanha(campanhaId))
  }, [campanhaId])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-dark-text-2">Fichas vinculadas a esta campanha.</p>
        <button
          onClick={() => navigate('/rpg/fichas', { state: { nova: true, campanhaId } })}
          className="text-xs text-purple-300 hover:text-purple-200 font-semibold cursor-pointer"
        >
          + Vincular / criar personagem
        </button>
      </div>
      {fichas.length === 0 ? (
        <p className="text-sm text-dark-text-3 text-center py-8">Nenhum personagem vinculado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fichas.map(f => {
            const info = f.data?.info || {}
            return (
              <div key={f.id} className="bg-dark-card border border-dark-border rounded-xl p-4">
                <h4 className="font-bold text-dark-text-1">{f.name}</h4>
                <p className="text-xs text-dark-text-3">
                  {[info.race, info.class, info.level && `Nível ${info.level}`].filter(Boolean).join(' • ') || '—'}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Seção genérica de itens (NPCs, Bestiário, Missões, Diário, Lore, Mapas, Inventário, Anotações)
function SecaoItens({ campanhaId, config }) {
  const [itens, setItens] = useState([])
  const [editando, setEditando] = useState(null) // null = fechado; {} = novo; {...item} = editando

  useEffect(() => {
    setItens(listarItensCampanha(campanhaId, config.tipo))
  }, [campanhaId, config.tipo])

  function recarregar() {
    setItens(listarItensCampanha(campanhaId, config.tipo))
  }

  function salvar(valores) {
    const { nome, ...campos } = valores
    if (editando?.id) {
      atualizarItemCampanha(campanhaId, editando.id, { nome, campos })
    } else {
      criarItemCampanha(campanhaId, { tipo: config.tipo, nome, campos })
    }
    recarregar()
    setEditando(null)
  }

  function excluir(id) {
    if (!window.confirm('Excluir este item?')) return
    deletarItemCampanha(campanhaId, id)
    recarregar()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-dark-text-2">{itens.length} {config.label.toLowerCase()}</p>
        <button onClick={() => setEditando({})} className="text-xs text-purple-300 hover:text-purple-200 font-semibold cursor-pointer">
          + Adicionar {config.label.toLowerCase().replace(/s$/, '')}
        </button>
      </div>

      {itens.length === 0 && !editando && (
        <p className="text-sm text-dark-text-3 text-center py-8">Nada aqui ainda.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {itens.map(item => (
          <div key={item.id} className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-dark-text-1">{item.nome}</h4>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditando(item)} className="text-xs text-dark-text-3 hover:text-dark-text-1 cursor-pointer">✏️</button>
                <button onClick={() => excluir(item.id)} className="text-xs text-dark-text-3 hover:text-red-400 cursor-pointer">🗑️</button>
              </div>
            </div>
            {config.campos.map(campo => (
              item.campos?.[campo.chave] ? (
                <p key={campo.chave} className="text-xs text-dark-text-2">
                  <span className="text-dark-text-3 font-semibold">{campo.label}:</span>{' '}
                  {String(item.campos[campo.chave])}
                </p>
              ) : null
            ))}
          </div>
        ))}
      </div>

      {editando && (
        <FormularioItem config={config} valoresIniciais={editando} aoSalvar={salvar} aoCancelar={() => setEditando(null)} />
      )}
    </div>
  )
}

function FormularioItem({ config, valoresIniciais, aoSalvar, aoCancelar }) {
  const [nome, setNome] = useState(valoresIniciais.nome || '')
  const [campos, setCampos] = useState(valoresIniciais.campos || {})

  function mudarCampo(chave, valor) {
    setCampos(prev => ({ ...prev, [chave]: valor }))
  }

  function aoSubmeter(e) {
    e.preventDefault()
    if (!nome.trim()) return
    aoSalvar({ nome: nome.trim(), ...campos })
  }

  return (
    <form onSubmit={aoSubmeter} className="bg-dark-card border border-purple-500/30 rounded-xl p-4 flex flex-col gap-3">
      <div>
        <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Nome</label>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder={config.tituloPlaceholder || 'Nome'}
          className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
        />
      </div>
      {config.campos.map(campo => (
        <div key={campo.chave}>
          <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">{campo.label}</label>
          {campo.tipoCampo === 'textarea' ? (
            <textarea
              value={campos[campo.chave] || ''}
              onChange={e => mudarCampo(campo.chave, e.target.value)}
              rows={2}
              className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500 resize-y"
            />
          ) : campo.tipoCampo === 'select' ? (
            <select
              value={campos[campo.chave] || campo.opcoes[0]}
              onChange={e => mudarCampo(campo.chave, e.target.value)}
              className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
            >
              {campo.opcoes.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          ) : (
            <input
              type={campo.tipoCampo === 'numero' ? 'number' : 'text'}
              value={campos[campo.chave] || ''}
              onChange={e => mudarCampo(campo.chave, e.target.value)}
              className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={aoCancelar} className="flex-1 border border-dark-border text-dark-text-2 py-2 rounded-xl text-sm font-semibold cursor-pointer">
          Cancelar
        </button>
        <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-sm font-semibold cursor-pointer">
          Salvar
        </button>
      </div>
    </form>
  )
}
