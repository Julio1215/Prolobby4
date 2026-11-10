import { useState } from 'react'
import { alternarCurtida, comentarPost, deletarPost } from '../../services/localDb'

const TYPE_CFG = {
REVIEW: {
label: 'Review',
color: 'text-yellow-400',
bg: 'bg-yellow-400/10',
icon: '⭐',
},

SCREENSHOT: {
label: 'Screenshot',
color: 'text-blue-400',
bg: 'bg-blue-400/10',
icon: '📸',
},

ARTWORK: {
label: 'Artwork',
color: 'text-pink-400',
bg: 'bg-pink-400/10',
icon: '🎨',
},

DISCUSSION: {
label: 'Discussão',
color: 'text-emerald-400',
bg: 'bg-emerald-400/10',
icon: '💬',
},
}

function formatarTempo(data) {
const diff = Date.now() - new Date(data)

const minutos = Math.floor(diff / 60000)
const horas = Math.floor(diff / 3600000)
const dias = Math.floor(diff / 86400000)

if (minutos < 1) return 'agora'
if (minutos < 60) return `${minutos}m`
if (horas < 24) return `${horas}h`
if (dias < 7) return `${dias}d`

return new Date(data).toLocaleDateString('pt-BR')
}

function urlAsset(caminho) {
  return caminho || null
}

function Avatar({ user }) {
return ( <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-semibold text-white overflow-hidden shrink-0">
{user?.avatarUrl ? ( <img
       src={urlAsset(user.avatarUrl)}
       alt=""
       className="w-full h-full object-cover"
     />
) : ( <span>
{user?.username?.[0]?.toUpperCase() || '?'} </span>
)} </div>
)
}

export default function CommunityCard({
post,
currentUser,
onDeleted,
}) {
const [curtiu, setCurtiu] = useState(post.likedByMe || false)

const [totalCurtidas, setTotalCurtidas] = useState(
post.likesCount || 0
)

const [mostrarComentarios, setMostrarComentarios] =
useState(false)

const [comentarios, setComentarios] = useState(post.comentarios || [])

const [textoComentario, setTextoComentario] =
useState('')

const [expandido, setExpandido] = useState(false)

const cfg =
TYPE_CFG[post.type] ||
TYPE_CFG.DISCUSSION

const temImagem =
(post.type === 'SCREENSHOT' ||
post.type === 'ARTWORK') &&
post.imageUrl

const ehDono =
currentUser?.id === post.user?.id

const textoLongo =
post.content &&
post.content.length > 200

function handleCurtir() {
if (!currentUser) return


setCurtiu(v => !v)

setTotalCurtidas(v =>
  curtiu ? v - 1 : v + 1
)

alternarCurtida(post.id)


}

function handleVerComentarios() {
setMostrarComentarios(v => !v)
}

function handleEnviarComentario(e) {
e.preventDefault()


if (!textoComentario.trim()) return

try {
  const novoComentario = comentarPost(post.id, currentUser, textoComentario)

  setComentarios(v => [
    ...v,
    novoComentario,
  ])

  setTextoComentario('')
} catch (err) {
  console.error(err)
}


}

function handleDeletar() {
if (!window.confirm('Remover este post?')) {
return
}


try {
  deletarPost(post.id)
  onDeleted?.(post.id)
} catch (err) {
  console.error(err)
  alert('Erro ao remover post')
}


}

return ( <div className="bg-dark-card border border-dark-border/50 rounded-xl overflow-hidden hover:border-purple-500/30 hover:shadow-lg transition-all">


  {temImagem && (
    <div className="w-full overflow-hidden max-h-52">
      <img
        src={urlAsset(post.imageUrl)}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  )}

  <div className="flex items-center justify-between px-3.5 pt-3 gap-2">

    <div className="flex items-center gap-2">
      <Avatar user={post.user} />

      <div>
        <span className="text-sm font-semibold block leading-tight">
          {post.user?.displayName ||
            post.user?.username ||
            'Usuário'}
        </span>

        <span className="text-xs text-dark-text-2">
          {formatarTempo(post.createdAt)}
        </span>
      </div>
    </div>

    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  </div>

  <div className="px-3.5 py-2.5">

    {post.gameTitle && (
      <span className="text-xs text-dark-text-2 block mb-1.5">
        🎮 {post.gameTitle}
      </span>
    )}

    {post.rating &&
      post.type === 'REVIEW' && (
        <div className="flex gap-0.5 mb-1">
          {[1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              className={
                i <= post.rating
                  ? 'text-yellow-400'
                  : 'text-dark-text-3'
              }
            >
              ★
            </span>
          ))}
        </div>
      )}

    {post.title &&
      post.type !== 'REVIEW' && (
        <h3 className="text-sm font-semibold mb-1.5">
          {post.title}
        </h3>
      )}

    {post.content && (
      <p className="text-sm text-dark-text-1 leading-relaxed">

        {expandido || !textoLongo
          ? post.content
          : post.content.slice(0, 200) + '...'}

        {textoLongo && (
          <button
            onClick={() =>
              setExpandido(v => !v)
            }
            className="text-purple-400 text-xs ml-1 hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            {expandido
              ? 'ver menos'
              : 'ver mais'}
          </button>
        )}
      </p>
    )}
  </div>

  <div className="flex items-center gap-2 px-3.5 pb-3 pt-2 border-t border-dark-border/50">

    <button
      onClick={handleCurtir}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all ${
        curtiu
          ? 'bg-purple-500/10 border-purple-500 text-purple-400'
          : 'border-dark-border text-dark-text-2 hover:border-purple-500 hover:text-purple-400'
      }`}
    >
      👍 {totalCurtidas}
    </button>

    <button
      onClick={handleVerComentarios}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dark-border text-xs text-dark-text-2 hover:border-purple-500 hover:text-purple-400 transition-all"
    >
      💬 {comentarios.length || 0}
    </button>

    {ehDono && (
      <button
        onClick={handleDeletar}
        className="ml-auto text-sm opacity-40 hover:opacity-100 hover:text-red-400 bg-transparent border-none cursor-pointer transition-all"
      >
        🗑️
      </button>
    )}
  </div>

  {mostrarComentarios && (
    <div className="px-3.5 pb-3 border-t border-dark-border/50 flex flex-col gap-2 pt-2">

      {comentarios.map(comentario => (
        <div
          key={comentario.id}
          className="flex gap-2 items-start"
        >
          <Avatar user={comentario.user} />

          <div>
            <span className="text-xs font-semibold">
              {comentario.user?.displayName ||
                comentario.user?.username ||
                'Usuário'}
            </span>

            <p className="text-xs text-dark-text-1 mt-0.5 leading-snug">
              {comentario.content}
            </p>
          </div>
        </div>
      ))}

      {currentUser ? (
        <form
          onSubmit={handleEnviarComentario}
          className="flex gap-1.5 mt-1"
        >
          <input
            value={textoComentario}
            onChange={e =>
              setTextoComentario(e.target.value)
            }
            placeholder="Adicionar comentário..."
            className="flex-1 px-3 py-1.5 bg-dark-secondary border border-dark-border rounded-full text-xs text-dark-text-1 focus:border-purple-500 outline-none transition-colors placeholder:text-dark-text-3"
          />

          <button
            type="submit"
            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-full transition-colors"
          >
            →
          </button>
        </form>
      ) : (
        <p className="text-xs text-dark-text-3">
          <a
            href="/login"
            className="text-purple-400 hover:underline"
          >
            Faça login
          </a>{' '}
          para comentar
        </p>
      )}
    </div>
  )}
</div>


)
}
