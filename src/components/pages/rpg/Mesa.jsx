import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { listarCampanhas, buscarCombate, salvarCombate } from '../../../services/localDb'
import RpgSubNav from './RpgSubNav'

export default function Mesa() {
  const { usuario } = useAuth()
  const location = useLocation()

  const [campanhas, setCampanhas] = useState([])
  const [campanhaId, setCampanhaId] = useState(location.state?.campanhaId || '')

  useEffect(() => {
    if (!usuario) return
    const lista = listarCampanhas(usuario.id)
    setCampanhas(lista)
    if (!campanhaId && lista.length === 1) setCampanhaId(lista[0].id)
  }, [usuario])

  if (!usuario) {
    return (
      <div className="flex flex-col gap-6 text-dark-text-1">
        <RpgSubNav ativa="mesa" />
        <p className="text-center text-dark-text-2 py-10">Faça login pra usar a mesa de combate.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 text-dark-text-1">
      <RpgSubNav ativa="mesa" />

      <div>
        <h1 className="text-2xl font-bold text-dark-text-1">🗺️ Mesa</h1>
        <p className="text-sm text-dark-text-2 mt-1">Iniciativa e combate da sua campanha, em tempo real na sua tela.</p>
      </div>

      {campanhas.length === 0 ? (
        <p className="text-sm text-dark-text-3 text-center py-10">
          Você precisa criar ou entrar numa campanha antes de abrir a mesa.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide">Campanha</label>
            <select
              value={campanhaId}
              onChange={e => setCampanhaId(e.target.value)}
              className="bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
            >
              <option value="">Selecione...</option>
              {campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {campanhaId && <RastreadorCombate campanhaId={campanhaId} />}
        </>
      )}
    </div>
  )
}

function RastreadorCombate({ campanhaId }) {
  const [combate, setCombate] = useState({ combatentes: [], turnoAtual: 0 })
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('jogador')
  const [hp, setHp] = useState(20)
  const [iniciativa, setIniciativa] = useState(10)

  useEffect(() => {
    setCombate(buscarCombate(campanhaId))
  }, [campanhaId])

  function persistir(novoCombate) {
    setCombate(novoCombate)
    salvarCombate(campanhaId, novoCombate)
  }

  const ordenados = [...combate.combatentes].sort((a, b) => b.iniciativa - a.iniciativa)

  function adicionar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    const novo = {
      id: 'comb_' + Date.now(),
      nome: nome.trim(),
      tipo,
      hp: Number(hp),
      hpMax: Number(hp),
      iniciativa: Number(iniciativa),
    }
    persistir({ ...combate, combatentes: [...combate.combatentes, novo] })
    setNome('')
    setHp(20)
    setIniciativa(10)
  }

  function alterarHp(id, delta) {
    const combatentes = combate.combatentes.map(c =>
      c.id === id ? { ...c, hp: Math.max(0, Math.min(c.hpMax, c.hp + delta)) } : c
    )
    persistir({ ...combate, combatentes })
  }

  function remover(id) {
    persistir({ ...combate, combatentes: combate.combatentes.filter(c => c.id !== id) })
  }

  function passarTurno() {
    if (ordenados.length === 0) return
    const proximo = (combate.turnoAtual + 1) % ordenados.length
    persistir({ ...combate, turnoAtual: proximo })
  }

  function encerrarCombate() {
    if (!window.confirm('Limpar todos os combatentes?')) return
    persistir({ combatentes: [], turnoAtual: 0 })
  }

  const idDoTurno = ordenados[combate.turnoAtual % (ordenados.length || 1)]?.id

  return (
    <div className="flex flex-col gap-4">
      {/* Formulário de adicionar combatente */}
      <form onSubmit={adicionar} className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[11px] text-dark-text-3 font-semibold uppercase">Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-lg px-2.5 py-1.5 text-sm text-dark-text-1 outline-none focus:border-purple-500" />
        </div>
        <div>
          <label className="text-[11px] text-dark-text-3 font-semibold uppercase">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="mt-1 bg-dark-secondary border border-dark-border rounded-lg px-2.5 py-1.5 text-sm text-dark-text-1 outline-none focus:border-purple-500">
            <option value="jogador">Jogador</option>
            <option value="inimigo">Inimigo</option>
          </select>
        </div>
        <div className="w-20">
          <label className="text-[11px] text-dark-text-3 font-semibold uppercase">HP</label>
          <input type="number" value={hp} onChange={e => setHp(e.target.value)} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-lg px-2.5 py-1.5 text-sm text-dark-text-1 outline-none focus:border-purple-500" />
        </div>
        <div className="w-24">
          <label className="text-[11px] text-dark-text-3 font-semibold uppercase">Iniciativa</label>
          <input type="number" value={iniciativa} onChange={e => setIniciativa(e.target.value)} className="mt-1 w-full bg-dark-secondary border border-dark-border rounded-lg px-2.5 py-1.5 text-sm text-dark-text-1 outline-none focus:border-purple-500" />
        </div>
        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold cursor-pointer">
          + Adicionar
        </button>
      </form>

      {ordenados.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={passarTurno} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">
            ⏭️ Passar turno
          </button>
          <button onClick={encerrarCombate} className="border border-dark-border text-dark-text-2 hover:text-red-400 hover:border-red-500/30 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer">
            Encerrar combate
          </button>
        </div>
      )}

      {/* Lista de iniciativa */}
      <div className="flex flex-col gap-2">
        {ordenados.length === 0 && (
          <p className="text-sm text-dark-text-3 text-center py-8">Nenhum combatente ainda — adicione jogadores e inimigos acima.</p>
        )}
        {ordenados.map((c, i) => (
          <div
            key={c.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition ${
              c.id === idDoTurno
                ? 'border-purple-500 bg-purple-600/10'
                : 'border-dark-border bg-dark-card'
            }`}
          >
            <span className="text-xs font-bold text-dark-text-3 w-6 text-center shrink-0">{i + 1}º</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
              c.tipo === 'jogador' ? 'bg-purple-600/15 text-purple-300' : 'bg-red-500/15 text-red-400'
            }`}>
              {c.tipo === 'jogador' ? 'Jogador' : 'Inimigo'}
            </span>
            <span className="font-semibold text-dark-text-1 flex-1 min-w-0 truncate">{c.nome}</span>
            <span className="text-xs text-dark-text-3 shrink-0">Iniciativa {c.iniciativa}</span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => alterarHp(c.id, -1)} className="w-6 h-6 rounded-full border border-dark-border text-red-400 text-xs font-bold cursor-pointer">-</button>
              <span className="text-xs font-bold text-dark-text-1 w-14 text-center">{c.hp}/{c.hpMax}</span>
              <button onClick={() => alterarHp(c.id, 1)} className="w-6 h-6 rounded-full border border-dark-border text-emerald-400 text-xs font-bold cursor-pointer">+</button>
            </div>

            <button onClick={() => remover(c.id)} className="text-dark-text-3 hover:text-red-400 text-xs shrink-0 cursor-pointer">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}
