import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { atualizarUsuarioSalvo, arquivoParaDataUrl } from '../../services/localDb'

// Subcomponente de Seção
function Secao({ titulo, children }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="text-base font-bold text-dark-text-1 flex items-center gap-2">
        {titulo}
      </h2>
      {children}
    </div>
  )
}

export default function Perfil() {
  const { usuario, atualizarUsuario } = useAuth()

  const [displayName, setDisplayName] = useState(usuario?.displayName || '')
  const [bio, setBio] = useState(usuario?.bio || '')
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState({ mensagem: '', tipo: '' })
  
  const fileRef = useRef(null)

  const mostrarAviso = (mensagem, tipo = 'sucesso') => {
    setAviso({ mensagem, tipo })
    setTimeout(() => setAviso({ mensagem: '', tipo: '' }), 3000)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const usuarioAtualizado = { ...usuario, displayName, bio }
      atualizarUsuarioSalvo(usuarioAtualizado)
      atualizarUsuario(usuarioAtualizado)
      mostrarAviso('Perfil atualizado!')
    } catch (err) {
      mostrarAviso('Erro ao salvar.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true)
    try {
      const avatarUrl = await arquivoParaDataUrl(file)
      const usuarioAtualizado = { ...usuario, avatarUrl }
      atualizarUsuarioSalvo(usuarioAtualizado)
      atualizarUsuario(usuarioAtualizado)
      mostrarAviso('Foto atualizada!')
    } catch (err) {
      mostrarAviso('Erro ao enviar a foto.', 'erro')
    } finally {
      setEnviando(false)
      e.target.value = ''
    }
  }

  const urlAvatar = usuario?.avatarUrl || null
  const inicial = (usuario?.displayName || usuario?.username || 'U')[0].toUpperCase()

  return (
    <div className="flex flex-col gap-6 max-w-2xl text-dark-text-1">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-black mb-1">👤 Meu Perfil</h1>
        <p className="text-sm text-dark-text-2">
          Gerencie sua conta e personalize seu perfil
        </p>
      </div>

      {/* Alerta de Feedback */}
      {aviso.mensagem && (
        <p className={`p-3 rounded-xl text-sm font-semibold border ${
          aviso.tipo === 'erro'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {aviso.tipo === 'erro' ? '⚠️' : '✅'} {aviso.mensagem}
        </p>
      )}

      {/* Card Preview Perfil */}
      <div className="rounded-2xl overflow-hidden border border-dark-border bg-dark-card">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-900" />

        {/* Informações */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-9 mb-4 flex-wrap gap-3">
            {/* Avatar */}
            <div 
              onClick={() => fileRef.current?.click()}
              className="relative w-18 h-18 rounded-full bg-purple-600 border-4 border-dark-card flex items-center justify-center text-2xl font-black overflow-hidden cursor-pointer group flex-shrink-0"
            >
              {urlAvatar ? (
                <img src={urlAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                inicial
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-base">
                {enviando ? '...' : '📷'}
              </div>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={enviando}
              className="bg-dark-secondary hover:bg-dark-hover disabled:opacity-50 text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              {enviando ? 'Enviando...' : '📷 Mudar foto'}
            </button>
          </div>

          <h3 className="text-lg font-bold">
            {usuario?.displayName || usuario?.username}
          </h3>
          <p className="text-xs text-dark-text-2 mb-2">@{usuario?.username}</p>
          {bio && <p className="text-sm text-dark-text-1 leading-relaxed">{bio}</p>}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatar}
      />

      {/* Form Editar */}
      <Secao titulo="✏️ Editar informações">
        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dark-text-2 uppercase tracking-wider">
              Nome de exibição
            </label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={usuario?.username}
              maxLength={50}
              className="bg-dark-secondary border border-dark-border rounded-xl p-2.5 text-sm text-dark-text-1 outline-none focus:border-purple-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dark-text-2 uppercase tracking-wider">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Conta um pouco sobre você..."
              maxLength={300}
              className="bg-dark-secondary border border-dark-border rounded-xl p-2.5 text-sm text-dark-text-1 outline-none focus:border-purple-500 transition resize-y"
            />
            <span className="text-[10px] text-dark-text-3 text-right">
              {bio.length}/300
            </span>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="self-start bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </Secao>

      {/* Dados Conta */}
      <Secao titulo="🔐 Dados da conta">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dark-text-2 uppercase tracking-wider">Username</label>
            <input value={usuario?.username || ''} disabled className="bg-dark-secondary/50 border border-dark-border rounded-xl p-2.5 text-sm text-dark-text-2 cursor-not-allowed" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dark-text-2 uppercase tracking-wider">Email</label>
            <input value={usuario?.email || ''} disabled className="bg-dark-secondary/50 border border-dark-border rounded-xl p-2.5 text-sm text-dark-text-2 cursor-not-allowed" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-dark-text-2 uppercase tracking-wider">Função</label>
            <div className="bg-dark-secondary/50 border border-dark-border rounded-xl p-2.5 text-xs font-bold text-purple-400 w-fit">
              {usuario?.role === 'ADMIN' ? '👑 Admin' : '🎮 Usuário'}
            </div>
          </div>
        </div>
      </Secao>

      {/* Danger Zone */}
      <Secao titulo="⚠️ Zona de risco">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-red-400">Excluir conta</p>
            <p className="text-xs text-red-400/70">Esta ação é irreversível</p>
          </div>
          <button disabled className="bg-red-500/10 border border-red-500/20 text-red-400 opacity-50 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">
            Excluir minha conta
          </button>
        </div>
      </Secao>
    </div>
  )
}
