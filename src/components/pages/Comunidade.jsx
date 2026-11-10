// pages/Comunidade.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarPosts } from '../../services/localDb'
import { useAuth } from '../../contexts/AuthContext'
import CommunityCard from '../community/CommunityCard'
import CreatePostModal from '../community/CreatePostModal'

const FILTROS = [
  { valor: '',         label: 'Tudo',        icone: '🌐' },
  { valor: 'REVIEW',    label: 'Reviews',     icone: '⭐' },
  { valor: 'SCREENSHOT',label: 'Screenshots', icone: '📸' },
  { valor: 'ARTWORK',   label: 'Artworks',    icone: '🎨' },
  { valor: 'DISCUSSION',label: 'Discussões',  icone: '💬' },
]

export default function Comunidade() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts]             = useState([])
  const [filtro, setFiltro]           = useState('')
  const [pagina, setPagina]           = useState(1)
  const [temMais, setTemMais]         = useState(true)
  const [carregando, setCarregando]   = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)

  // Carrega posts do banco local
  function carregarPosts(numeroPagina, tipoFiltro, reiniciar) {
    setCarregando(true)
    try {
      const { posts: novosPosts, hasMore } = listarPosts({ pagina: numeroPagina, limite: 18, tipo: tipoFiltro })
      setPosts(prev => reiniciar ? novosPosts : [...prev, ...novosPosts])
      setTemMais(hasMore)
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  // Recarrega do zero quando o filtro muda
  useEffect(() => {
    setPosts([])
    setPagina(1)
    setTemMais(true)
    carregarPosts(1, filtro, true)
  }, [filtro])

  function handleCarregarMais() {
    const proxima = pagina + 1
    setPagina(proxima)
    carregarPosts(proxima, filtro, false)
  }

  function handlePostCriado(novoPost) {
    setPosts(prev => [novoPost, ...prev])
    setMostrarModal(false)
  }

  function handlePostDeletado(id) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  function handleNovo() {
    if (!usuario) { navigate('/login'); return }
    setMostrarModal(true)
  }

  return (
    /* Reduzimos o padding lateral no mobile (px-2 sm:px-4) para dar mais espaço aos cards */
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-2 sm:px-4 mt-4 sm:mt-6 w-full">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 mb-1 text-dark-text-1">
            🌐 Comunidade
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Reviews, screenshots, artworks e discussões da galera
          </p>
        </div>
        <button
          onClick={handleNovo}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
        >
          + Publicar
        </button>
      </div>

      {/* Filtros de tipo */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer border ${
              filtro === f.valor
                ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                : 'bg-transparent border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400'
            }`}
          >
            {f.icone} {f.label}
          </button>
        ))}
      </div>

      {/* Skeletons de carregamento */}
      {carregando && posts.length === 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4 bg-gray-800/40 rounded-xl animate-pulse">
              <div className="h-40 bg-gray-700 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de posts em colunas (masonry) */}
      {posts.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {posts.map(post => (
            <div key={post.id} className="break-inside-avoid mb-4">
              <CommunityCard
                post={post}
                currentUser={usuario}
                onDeleted={handlePostDeletado}
              />
            </div>
          ))}
        </div>
      )}

      {/* Botão carregar mais */}
      {posts.length > 0 && temMais && (
        <div className="flex justify-center">
          <button
            onClick={handleCarregarMais}
            disabled={carregando}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {carregando ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}

      {/* Estado vazio */}
      {!carregando && posts.length === 0 && (
        <div className="text-center py-16 flex flex-col items-center gap-4 text-gray-400">
          <span className="text-5xl">🌐</span>
          <p className="font-semibold">Nenhum post ainda</p>
          <p className="text-sm">Seja o primeiro a publicar!</p>
          <button
            onClick={handleNovo}
            className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Criar post
          </button>
        </div>
      )}

      {/* Modal de criação de post */}
      {mostrarModal && (
        <CreatePostModal
          onClose={() => setMostrarModal(false)}
          onCreated={handlePostCriado}
        />
      )}
    </div>
  )
}
