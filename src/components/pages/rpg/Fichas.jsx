import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listarFichas, criarFicha, atualizarFicha, deletarFicha, duplicarFicha, listarCampanhas } from '../../../services/localDb'
import { useAuth } from '../../../contexts/AuthContext'
import RpgSubNav from './RpgSubNav'

import DndSheet from '../../rpg/DndSheet'
import T20Sheet from '../../rpg/T20Sheet'
import CthulhuSheet from '../../rpg/CthulhuSheet'
import OrdemSheet from '../../rpg/OrdemSheet'

const SISTEMAS = [
  { valor: 'DND5E', label: 'D&D 5e', icone: '⚔️' },
  { valor: 'TORMENTA20', label: 'Tormenta 20', icone: '🌊' },
  { valor: 'CALL_OF_CTHULHU', label: 'Call of Cthulhu', icone: '🐙' },
  { valor: 'ORDEM_PARANORMAL', label: 'Ordem Paranormal', icone: '🔮' },
  { valor: 'GENERICO', label: 'Sistema Personalizado', icone: '📝' },
]

// Card da Ficha
function CardFicha({ ficha, nomeCampanha, aoEditar, aoExcluir, aoDuplicar, aoCompartilhar }) {
  const sistema = SISTEMAS.find(s => s.valor === ficha.system)
  const info = ficha.data?.info || {}

  return (
    <div className="bg-dark-card/90 border border-dark-border rounded-2xl p-5 flex flex-col gap-4 transition hover:border-purple-500 hover:-translate-y-1">
      <div className="flex justify-between items-center text-sm font-semibold">
        <span className="text-purple-400">{sistema?.icone} {sistema?.label}</span>
        {ficha.isPublic && (
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
            🔗 Público
          </span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-dark-text-1">{ficha.name}</h3>
        <p className="text-sm text-dark-text-2">
          {[info.race, info.class, info.level && `Nível ${info.level}`].filter(Boolean).join(' • ')}
        </p>
        {nomeCampanha && (
          <p className="text-xs text-purple-300 mt-1">🛡️ {nomeCampanha}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
        <button onClick={() => aoEditar(ficha)} className="bg-dark-secondary hover:bg-dark-hover text-dark-text-1 p-2 rounded-xl transition cursor-pointer">✏️ Editar</button>
        <button onClick={() => aoDuplicar(ficha.id)} className="bg-dark-secondary hover:bg-dark-hover text-dark-text-1 p-2 rounded-xl transition cursor-pointer">📋 Copiar</button>
        <button onClick={() => aoCompartilhar(ficha)} className="bg-dark-secondary hover:bg-dark-hover text-dark-text-1 p-2 rounded-xl transition cursor-pointer">🔗 Link</button>
        <button onClick={() => aoExcluir(ficha.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2 rounded-xl transition cursor-pointer">🗑️ Deletar</button>
      </div>
    </div>
  )
}

// Modal de Compartilhamento
function ModalCompartilhar({ ficha, aoFechar }) {
  const [copiado, setCopiado] = useState(false)
  const link = `${window.location.origin}/rpg/share/${ficha.shareToken}`

  const copiar = () => {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div onClick={aoFechar} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 flex flex-col gap-4 text-dark-text-1">
        <h3 className="text-xl font-bold">🔗 Compartilhar {ficha.name}</h3>

        {!ficha.isPublic || !ficha.shareToken ? (
          <p className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-sm">
            Esta ficha não é pública. Ative "Tornar pública" ao editá-la.
          </p>
        ) : (
          <div className="flex gap-2 bg-dark-secondary p-2 rounded-xl">
            <input readOnly value={link} className="bg-transparent flex-1 outline-none text-xs px-2 text-dark-text-1" />
            <button onClick={copiar} className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer">
              {copiado ? '✓' : '📋'}
            </button>
          </div>
        )}

        <button onClick={aoFechar} className="self-end bg-dark-secondary hover:bg-dark-hover px-4 py-2 rounded-xl text-sm transition cursor-pointer">
          Fechar
        </button>
      </div>
    </div>
  )
}

export default function Fichas() {
  const { usuario } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [tela, setTela] = useState('lista')
  const [sistemaSelecionado, setSistema] = useState('DND5E')
  const [fichaEditando, setFichaEditando] = useState(null)
  const [fichaCompartilhar, setFichaCompartilhar] = useState(null)
  const [campanhaVinculada, setCampanhaVinculada] = useState(location.state?.campanhaId || '')

  const [fichas, setFichas] = useState([])
  const [campanhas, setCampanhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!usuario) return setCarregando(false)
    setFichas(listarFichas(usuario.id))
    setCampanhas(listarCampanhas(usuario.id))
    setCarregando(false)

    // Se veio do Dashboard/Campanha com "criar personagem", já abre o formulário
    if (location.state?.nova) {
      setTela('nova')
    }
  }, [usuario])

  const handleSalvar = (dadosFormulario, isPublico) => {
    const payload = {
      userId: usuario.id,
      name: dadosFormulario.info?.characterName || 'Sem nome',
      system: sistemaSelecionado,
      data: dadosFormulario,
      isPublic: isPublico,
      campanhaId: campanhaVinculada || null,
    }

    setSalvando(true)
    try {
      if (fichaEditando?.id) {
        const fichaAtualizada = atualizarFicha(fichaEditando.id, payload)
        setFichas(prev => prev.map(f => f.id === fichaEditando.id ? fichaAtualizada : f))
      } else {
        const novaFicha = criarFicha(payload)
        setFichas(prev => [novaFicha, ...prev])
      }
      setTela('lista')
      setFichaEditando(null)
    } catch (err) {
      alert(err.message || 'Erro ao salvar ficha')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = (id) => {
    if (!window.confirm('Deletar esta ficha?')) return
    try {
      deletarFicha(id)
      setFichas(prev => prev.filter(f => f.id !== id))
    } catch {
      alert('Erro ao excluir ficha')
    }
  }

  const handleDuplicar = (id) => {
    try {
      const copia = duplicarFicha(id, usuario.id)
      setFichas(prev => [copia, ...prev])
    } catch {
      alert('Erro ao duplicar ficha')
    }
  }

  // Não logado
  if (!usuario) {
    return (
      <div className="flex flex-col gap-6">
        <RpgSubNav ativa="fichas" />
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4 text-dark-text-1">
          <span className="text-6xl">🎲</span>
          <h2 className="text-3xl font-black">Fichas RPG</h2>
          <p className="text-dark-text-2 max-w-xs">Faça login para gerenciar seus personagens.</p>
          <a href="/login" className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-bold transition">
            Entrar / Criar conta
          </a>
        </div>
      </div>
    )
  }

  // Tela Criar/Editar
  if (tela === 'nova' || tela === 'editar') {
    const props = {
      initialData: fichaEditando?.data,
      onSave: handleSalvar,
      saving: salvando,
      characterId: fichaEditando?.id,
      shareToken: fichaEditando?.shareToken,
    }

    return (
      <div className="flex flex-col gap-6 text-dark-text-1">
        <RpgSubNav ativa="fichas" />
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => { setTela('lista'); setFichaEditando(null) }} className="bg-dark-secondary hover:bg-dark-hover px-4 py-2 rounded-xl transition cursor-pointer">
            ← Voltar
          </button>
          <h1 className="text-xl font-bold">
            {tela === 'nova' ? 'Nova Ficha' : 'Editar Ficha'} — {SISTEMAS.find(s => s.valor === sistemaSelecionado)?.label}
          </h1>
        </div>

        {campanhas.length > 0 && (
          <div className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs text-dark-text-3 font-semibold uppercase tracking-wide shrink-0">Vincular à campanha</label>
            <select
              value={campanhaVinculada}
              onChange={e => setCampanhaVinculada(e.target.value)}
              className="bg-dark-secondary border border-dark-border rounded-xl px-3 py-2 text-sm text-dark-text-1 outline-none focus:border-purple-500"
            >
              <option value="">Nenhuma (personagem avulso)</option>
              {campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        )}

        {sistemaSelecionado === 'DND5E' && <DndSheet {...props} />}
        {sistemaSelecionado === 'TORMENTA20' && <T20Sheet {...props} />}
        {sistemaSelecionado === 'ORDEM_PARANORMAL' && <OrdemSheet {...props} />}
        {sistemaSelecionado === 'CALL_OF_CTHULHU' && <CthulhuSheet {...props} />}
        {sistemaSelecionado === 'GENERICO' && <DndSheet {...props} />}
      </div>
    )
  }

  // Lista principal
  return (
    <div className="flex flex-col gap-6 text-dark-text-1">
      <RpgSubNav ativa="fichas" />

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black">🎲 Fichas RPG</h1>
          <p className="text-dark-text-2">Crie, edite e compartilhe personagens</p>
        </div>
        <button onClick={() => { setCampanhaVinculada(''); setTela('nova') }} className="bg-purple-600 hover:bg-purple-500 px-5 py-2.5 rounded-xl font-bold transition cursor-pointer">
          + Nova Ficha
        </button>
      </div>

      {/* Seletor de Sistemas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {SISTEMAS.map(s => (
          <button
            key={s.valor}
            onClick={() => setSistema(s.valor)}
            className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition cursor-pointer ${
              sistemaSelecionado === s.valor
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-dark-border bg-dark-card hover:border-dark-border'
            }`}
          >
            <span className="text-2xl">{s.icone}</span>
            <span className="font-bold">{s.label}</span>
          </button>
        ))}
      </div>
      {sistemaSelecionado === 'GENERICO' && (
        <p className="text-xs text-dark-text-3 -mt-3">
          Sistema personalizado usa a mesma ficha genérica por enquanto — dá pra especializar depois.
        </p>
      )}

      {/* Grid de Fichas */}
      {carregando ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center text-dark-text-2">
          Carregando fichas...
        </div>
      ) : fichas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fichas.map(f => {
            const campanha = campanhas.find(c => c.id === f.campanhaId)
            return (
              <CardFicha
                key={f.id}
                ficha={f}
                nomeCampanha={campanha?.nome}
                aoEditar={f => { setSistema(f.system); setCampanhaVinculada(f.campanhaId || ''); setFichaEditando(f); setTela('editar') }}
                aoExcluir={handleExcluir}
                aoDuplicar={handleDuplicar}
                aoCompartilhar={setFichaCompartilhar}
              />
            )
          })}
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-10 flex flex-col items-center text-center gap-4">
          <span className="text-5xl">🎲</span>
          <p className="text-dark-text-2">Nenhuma ficha criada ainda.</p>
          <button onClick={() => setTela('nova')} className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-xl font-bold transition cursor-pointer">
            Criar primeira ficha
          </button>
        </div>
      )}

      {fichaCompartilhar && (
        <ModalCompartilhar ficha={fichaCompartilhar} aoFechar={() => setFichaCompartilhar(null)} />
      )}
    </div>
  )
}
