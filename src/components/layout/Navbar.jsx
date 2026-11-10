import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

// ============================================================
// ThemeToggle — botão de alternar tema claro/escuro
// ============================================================
function ThemeToggle() {
  const [tema, setTema] = useState(
    () => localStorage.getItem('hg_theme') || 'dark'
  )

  function alternarTema() {
    const novoTema = tema === 'dark' ? 'light' : 'dark'
    localStorage.setItem('hg_theme', novoTema)
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(novoTema)
    setTema(novoTema)
  }

  const isDark = tema === 'dark'

  return (
    <button
      onClick={alternarTema}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-dark-secondary dark:bg-dark-secondary border border-dark-border cursor-pointer transition-all duration-200 hover:border-brand shrink-0 overflow-hidden p-0"
    >
      {isDark ? (
        // Sol para quando o tema atual for escuro
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-gray-200 block"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Lua para quando o tema atual for claro (cor roxa para dar contraste total)
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#4c1d95" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-purple-900 block"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

// ============================================================
// UserDropdown — menu do usuário logado
// ============================================================
function UserDropdown({ usuario, onLogout }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function fecharSeForaDo(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fecharSeForaDo)
    return () => document.removeEventListener('mousedown', fecharSeForaDo)
  }, [])

  const urlAvatar = usuario?.avatarUrl || null
  const inicial = (usuario?.displayName || usuario?.username || 'U')[0].toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(a => !a)}
        className="flex items-center gap-1.5 sm:gap-2 p-[0.25rem] sm:py-[0.3rem] sm:pr-3 sm:pl-[0.3rem] bg-dark-secondary border border-dark-border rounded-full cursor-pointer transition-all duration-200 hover:border-brand"
      >
        <span className="w-7 h-7 rounded-full bg-linear-to-br from-[#7c3aed] to-[#bf00ff] flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
          {urlAvatar
            ? <img src={urlAvatar} alt="" className="w-full h-full object-cover" />
            : inicial
          }
        </span>
        
        {/* Escondido no mobile (hidden), visível apenas no desktop (sm:inline) */}
        <span className="hidden sm:inline text-[0.8rem] font-semibold text-dark-text-1 max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
          {usuario?.displayName || usuario?.username}
        </span>

        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-dark-text-2 transition-transform duration-200 mr-1 sm:mr-0 ${aberto ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute top-[calc(100%_+_8px)] right-0 min-w-[180px] bg-dark-card border border-dark-border rounded-2xl p-[0.4rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[1000] animate-[fadeInUp_0.15s_ease]">
          <ItemDropdown icon="👤" label="Meu Perfil" onClick={() => { navigate('/perfil'); setAberto(false) }} />
          <div className="h-px bg-dark-border mx-2 my-[0.3rem]" />
          <ItemDropdown icon="🚪" label="Sair" onClick={() => { onLogout(); setAberto(false) }} perigo />
        </div>
      )}
    </div>
  )
}

// ============================================================
// GuestDropdown — ícone de "foto vazia" para quem não tá logado.
// ============================================================
function GuestDropdown() {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function fecharSeForaDo(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fecharSeForaDo)
    return () => document.removeEventListener('mousedown', fecharSeForaDo)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto(a => !a)}
        aria-label="Entrar ou criar conta"
        className="w-9 h-9 rounded-full flex items-center justify-center bg-dark-secondary border border-dark-border cursor-pointer text-dark-text-2 transition-all duration-200 hover:border-brand hover:text-brand-light"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute top-[calc(100%_+_8px)] right-0 min-w-[160px] bg-dark-card border border-dark-border rounded-2xl p-[0.4rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[1000] animate-[fadeInUp_0.15s_ease]">
          <ItemDropdown icon="🔑" label="Entrar" onClick={() => { navigate('/login'); setAberto(false) }} />
          <ItemDropdown icon="✨" label="Criar conta" onClick={() => { navigate('/register'); setAberto(false) }} />
        </div>
      )}
    </div>
  )
}

function ItemDropdown({ icon, label, onClick, perigo }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-[0.6rem] py-[0.55rem] px-3 rounded-[10px] bg-transparent cursor-pointer text-[0.82rem] font-medium text-left transition-colors duration-150 ${
        perigo ? 'text-red-500 hover:bg-red-500/10' : 'text-dark-text-1 hover:bg-dark-hover'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ============================================================
// Navbar principal
// ============================================================
export default function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="h-14 flex items-center justify-between px-4 sm:px-5 bg-[rgba(13,13,26,0.9)] backdrop-blur-[20px] border-b border-dark-border sticky top-0 z-50 transition-colors">
      {/* LOGO — Ajustada para ficar alinhada e não encostar nos itens da direita */}
      <Link
        to="/"
        className="flex items-center gap-[0.6rem] no-underline shrink-0"
      >
        <div className="w-[30px] h-[30px] rounded-lg bg-linear-to-br from-[#7c3aed] to-[#bf00ff] flex items-center justify-center text-base shadow-[0_0_12px_rgba(191,0,255,0.4)]">
          🎮
        </div>
        <span className="font-orbitron text-sm sm:text-base font-black tracking-wide sm:tracking-wider text-dark-text-1">
          PRO<span className="text-brand-light">LOBBY</span>
        </span>
      </Link>

      {/* LADO DIREITO */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {usuario ? (
          <UserDropdown usuario={usuario} onLogout={handleLogout} />
        ) : (
          <>
            {/* Mobile: um ícone só, que abre Entrar/Criar conta */}
            <div className="sm:hidden">
              <GuestDropdown />
            </div>
            {/* Desktop: os 2 botões de sempre */}
            <div className="hidden sm:flex gap-2">
              <Link to="/login"
                className="py-[0.4rem] px-4 rounded-[10px] border border-dark-border text-dark-text-2 text-[0.82rem] font-semibold no-underline transition-all duration-200 hover:border-brand hover:text-brand-light"
              >
                Entrar
              </Link>
              <Link to="/register"
                className="py-[0.4rem] px-4 rounded-[10px] bg-linear-to-br from-[#7c3aed] to-[#a855f7] text-white text-[0.82rem] font-semibold no-underline transition-all duration-200 shadow-[0_0_12px_rgba(124,58,237,0.3)] hover:opacity-90"
              >
                Criar conta
              </Link>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}
