import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import {
  listarCampanhas,
  listarFichas,
  criarCampanha,
  entrarCampanha,
  semearCampanhaExemplo,
} from '../../../services/localDb'
import RpgSubNav from './RpgSubNav'

const SISTEMAS = ['D&D 5e', 'Tormenta 20', 'Call of Cthulhu', 'Ordem Paranormal', 'Pathfinder 2e']

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [campanhas, setCampanhas] = useState([])
  const [fichas, setFichas] = useState([])
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEntrar, setModalEntrar] = useState(false)

  useEffect(() => {
    if (!usuario) return
    setCampanhas(listarCampanhas(usuario.id))
    setFichas(listarFichas(usuario.id))
  }, [usuario])

  if (!usuario) {
    return (
      <div className="flex flex-col gap-6 text-dark-text-1">
        <RpgSubNav ativa="geral" />
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
          <span className="text-6xl">🎲</span>
          <h2 className="text-3xl font-black">RPG</h2>
          <p className="text-dark-text-2 max-w-xs">
            Faça login para criar campanhas, fichas e mestrar suas mesas.
          </p>
          <a href="/login" className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-bold transition">
            Entrar / Criar conta
          </a>
        </div>
      </div>
    )
  }

  const mestrando = campanhas.filter(c => c.mestre.id === usuario.id)
  const jogando = campanhas.filter(c => c.mestre.id !== usuario.id)
  const fichasRecentes = fichas.slice(0, 3)

  function aoCriarCampanha(nova) {
    setModalCriar(false)
    navigate('/rpg/campanhas', { state: { abrirCampanhaId: nova.id } })
  }

  function aoEntrarCampanha(campanha) {
    setModalEntrar(false)
    navigate('/rpg/campanhas', { state: { abrirCampanhaId: campanha.id } })
  }

  function verExemplo() {
    const campanha = semearCampanhaExemplo(usuario)
    navigate('/rpg/campanhas', { state: { abrirCampanhaId: campanha.id } })
  }

  return (
    <div className="flex flex-col gap-6 text-dark-text-1">
      <RpgSubNav ativa="geral" />

      <div>
        <h1 className="text-3xl font-black flex items-center gap-2">🎲 RPG</h1>
        <p className="text-dark-text-2">Crie, mestre e jogue suas campanhas de RPG, tudo num só lugar.</p>
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setModalCriar(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer"
        >
          + Criar campanha
        </button>
        <button
          onClick={() => navigate('/rpg/fichas', { state: { nova: true } })}
          className="bg-dark-card border border-dark-border hover:border-purple-500/50 text-dark-text-1 px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer"
        >
          + Criar personagem
        </button>
        <button
          onClick={() => setModalEntrar(true)}
          className="bg-dark-card border border-dark-border hover:border-purple-500/50 text-dark-text-1 px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer"
        >
          Entrar em campanha
        </button>
        <button
          onClick={() => navigate('/rpg/mestre')}
          className="bg-dark-card border border-dark-border hover:border-purple-500/50 text-dark-text-1 px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer"
        >
          🤖 Mestre IA
        </button>
      </div>

      {campanhas.length === 0 && (
        <button
          onClick={verExemplo}
          className="text-left p-4 rounded-xl bg-purple-600/10 border border-dashed border-purple-600/30 text-sm text-dark-text-2 hover:border-purple-500/50 transition cursor-pointer"
        >
          🎬 Ainda não tem nenhuma campanha — <span className="text-purple-300 font-semibold">clique aqui pra carregar uma campanha de exemplo completa</span> e ver o RPG funcionando de ponta a ponta.
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Minhas campanhas */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-dark-text-1">Minhas campanhas</h2>
            <button onClick={() => navigate('/rpg/campanhas')} className="text-xs text-purple-300 hover:text-purple-200 cursor-pointer">
              Ver todas →
            </button>
          </div>

          {campanhas.length === 0 ? (
            <p className="text-sm text-dark-text-3 py-4 text-center">Nenhuma campanha ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {campanhas.slice(0, 4).map(c => (
                <button
                  key={c.id}
                  onClick={() => navigate('/rpg/campanhas', { state: { abrirCampanhaId: c.id } })}
                  className="text-left flex items-center justify-between gap-2 bg-dark-secondary hover:bg-dark-hover rounded-xl px-3 py-2.5 transition cursor-pointer"
                >
                  <span>
                    <span className="text-sm font-semibold text-dark-text-1 block">{c.nome}</span>
                    <span className="text-xs text-dark-text-3">
                      {1 + c.jogadores.length} jogador{c.jogadores.length === 0 ? '' : 'es'} · Sessão {c.totalSessoes || 1}
                    </span>
                  </span>
                  {c.mestre.id === usuario.id && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-600/15 text-purple-300 shrink-0">
                      Mestre
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-dark-text-3 mt-3">
            Mestrando {mestrando.length} · Jogando em {jogando.length}
          </p>
        </div>

        {/* Personagens recentes */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-dark-text-1">Personagens recentes</h2>
            <button onClick={() => navigate('/rpg/fichas')} className="text-xs text-purple-300 hover:text-purple-200 cursor-pointer">
              Ver todos →
            </button>
          </div>

          {fichasRecentes.length === 0 ? (
            <p className="text-sm text-dark-text-3 py-4 text-center">Nenhuma ficha criada ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {fichasRecentes.map(f => {
                const info = f.data?.info || {}
                return (
                  <button
                    key={f.id}
                    onClick={() => navigate('/rpg/fichas')}
                    className="text-left bg-dark-secondary hover:bg-dark-hover rounded-xl px-3 py-2.5 transition cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-dark-text-1 block">{f.name}</span>
                    <span className="text-xs text-dark-text-3">
                      {[info.race, info.class, info.level && `Nível ${info.level}`].filter(Boolean).join(' • ')}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
        <h2 className="font-bold text-dark-text-1 mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BotaoAtalho icone="🧙" label="Personagens" aoClicar={() => navigate('/rpg/fichas')} />
          <BotaoAtalho icone="🗺️" label="Mesa" aoClicar={() => navigate('/rpg/mesa')} />
          <BotaoAtalho icone="🤖" label="Mestre IA" aoClicar={() => navigate('/rpg/mestre')} />
          <BotaoAtalho icone="📜" label="Ferramentas" aoClicar={() => navigate('/rpg/ferramentas')} />
        </div>
        <p className="text-[11px] text-dark-text-3 mt-3">
          🎲 O widget de dado fica sempre disponível no canto da tela em qualquer aba do RPG.
        </p>
      </div>

      {modalCriar && (
        <ModalCriarCampanha usuario={usuario} aoFechar={() => setModalCriar(false)} aoCriar={aoCriarCampanha} />
      )}
      {modalEntrar && (
        <ModalEntrarCampanha usuario={usuario} aoFechar={() => setModalEntrar(false)} aoEntrar={aoEntrarCampanha} />
      )}
    </div>
  )
}

function BotaoAtalho({ icone, label, aoClicar }) {
  return (
    <button
      onClick={aoClicar}
      className="flex flex-col items-center gap-1.5 bg-dark-secondary hover:bg-dark-hover rounded-xl py-4 transition cursor-pointer"
    >
      <span className="text-2xl">{icone}</span>
      <span className="text-xs font-semibold text-dark-text-1">{label}</span>
    </button>
  )
}

export function ModalCriarCampanha({ usuario, aoFechar, aoCriar }) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [sistema, setSistema] = useState(SISTEMAS[0])
  const [maxJogadores, setMaxJogadores] = useState(4)
  const [privada, setPrivada] = useState(false)

  function aoSubmeter(e) {
    e.preventDefault()
    if (!nome.trim()) return
    const nova = criarCampanha({ usuario, nome: nome.trim(), sistema, descricao: descricao.trim(), maxJogadores, privada })
    aoCriar(nova)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={aoFechar}>
      <div
        className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-dark-text-1 mb-4">Criar campanha</h3>
        <form onSubmit={aoSubmeter} className="flex flex-col gap-3">
          <Campo label="Nome da campanha">
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: A Maldição de Ravenmoor"
              className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
            />
          </Campo>
          <Campo label="Descrição">
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Do que se trata a campanha?"
              rows={2}
              className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500 resize-y"
            />
          </Campo>
          <Campo label="Sistema">
            <select
              value={sistema}
              onChange={e => setSistema(e.target.value)}
              className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
            >
              {SISTEMAS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Campo>
          <Campo label="Número de jogadores">
            <input
              type="number"
              min={1}
              max={10}
              value={maxJogadores}
              onChange={e => setMaxJogadores(Number(e.target.value))}
              className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
            />
          </Campo>
          <label className="flex items-center gap-2 text-sm text-dark-text-2 cursor-pointer">
            <input type="checkbox" checked={privada} onChange={e => setPrivada(e.target.checked)} />
            Campanha privada (só entra com o código)
          </label>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={aoFechar} className="flex-1 border border-dark-border text-dark-text-2 py-2 rounded-xl text-sm font-semibold cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-sm font-semibold cursor-pointer">
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ModalEntrarCampanha({ usuario, aoFechar, aoEntrar }) {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')

  function aoSubmeter(e) {
    e.preventDefault()
    try {
      const campanha = entrarCampanha(codigo, usuario)
      aoEntrar(campanha)
    } catch (erroCapturado) {
      setErro(erroCapturado.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={aoFechar}>
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-dark-text-1 mb-4">Entrar com código</h3>
        <form onSubmit={aoSubmeter} className="flex flex-col gap-3">
          <input
            value={codigo}
            onChange={e => { setCodigo(e.target.value); setErro('') }}
            placeholder="Ex: A1B2C3"
            className="w-full bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500 uppercase"
          />
          {erro && <p className="text-xs text-red-400">{erro}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={aoFechar} className="flex-1 border border-dark-border text-dark-text-2 py-2 rounded-xl text-sm font-semibold cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-sm font-semibold cursor-pointer">
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
