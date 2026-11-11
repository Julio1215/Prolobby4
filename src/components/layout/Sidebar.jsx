import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

// ============================================
// NAV ITEMS — espelha o índice "Navegação" combinado
// com a equipe (ver footer do layout oficial de Notícias):
// Home, E-Sports, Notícias, Comunidade, Fichas de RPG, Guia de Jogos
// + páginas já existentes no app que ainda não estão no índice combinado
// ============================================
const NAV_ITEMS = [
  {
    to: '/', end: true, label: 'Home',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    to: '/news', label: 'Notícias',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>,
  },
  {
    // E-Sports tem sub-itens — por isso marcamos com isEsports: true
    to: '/esports', label: 'E-Sports', isEsports: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  },
  {
    to: '/community', label: 'Comunidade',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    to: '/rpg', label: 'RPG',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 18.5 3.5-9.5L10.5 12 12 6l1.5 6 3.5-3 3.5 9.5"/><path d="M3 18h18"/></svg>,
  },
  {
    to: '/chamada', label: 'Chamada',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  },
  {
    to: '/guia', label: 'Guia de Jogos',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    to: '/qcd', label: 'QCD Score',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  },
  {
    to: '/reviews', label: 'Reviews',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>,
  },
]

// Sub-itens da seção E-Sports — aparecem quando o menu está expandido
const ESPORTS_SUB_ITEMS = [
  { to: '/esports/noticias', label: 'Notícias',  icone: '📰' },
  { to: '/esports/partidas', label: 'Partidas',  icone: '🎮' },
  { to: '/esports/times',    label: 'Times',     icone: '🏆' },
  { to: '/esports/eventos',  label: 'Eventos',   icone: '📅' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  // A seção E-Sports fica aberta automaticamente quando o usuário está em qualquer rota /esports/*
  const esportsAtivo = location.pathname.startsWith('/esports')
  const [esportsAberto, setEsportsAberto] = useState(esportsAtivo)

  useEffect(() => {
    function verificarTamanhoDaTela() {
      setCollapsed(window.innerWidth < 1024)
    }
    verificarTamanhoDaTela()
    window.addEventListener('resize', verificarTamanhoDaTela)
    return () => window.removeEventListener('resize', verificarTamanhoDaTela)
  }, [])

  function alternarMenuRecolhido() {
    setCollapsed(!collapsed)
  }

  function alternarEsportsAberto() {
    setEsportsAberto(!esportsAberto)
  }

  // Largura do menu muda dependendo se está recolhido ou não
  let larguraDoMenu = 'w-[200px]'
  if (collapsed) {
    larguraDoMenu = 'w-16'
  }

  return (
    <aside className={`${larguraDoMenu} transition-[width] duration-300 min-h-full flex flex-col shrink-0 bg-dark-secondary border-r border-dark-border relative pb-4`}>

      {/* Botão de recolher/expandir o menu */}
      <BotaoRecolher collapsed={collapsed} onClick={alternarMenuRecolhido} />

      <nav className="flex flex-col gap-0.5 pt-10 px-2 pb-2">
        {NAV_ITEMS.map(item => {
          if (item.isEsports) {
            return (
              <ItemEsports
                key={item.to}
                item={item}
                collapsed={collapsed}
                esportsAtivo={esportsAtivo}
                esportsAberto={esportsAberto}
                onToggle={alternarEsportsAberto}
              />
            )
          }
          return <ItemMenu key={item.to} item={item} collapsed={collapsed} />
        })}
      </nav>

      {!collapsed && <Rodape />}
    </aside>
  )
}

// Botão redondo que recolhe/expande o menu lateral
function BotaoRecolher({ collapsed, onClick }) {
  let posicaoDoBotao = 'right-2'
  if (collapsed) {
    posicaoDoBotao = 'right-1/2 translate-x-1/2'
  }

  return (
    <button
      onClick={onClick}
      title={collapsed ? 'Expandir' : 'Recolher'}
      className={`absolute top-3 ${posicaoDoBotao} w-[22px] h-[22px] rounded-full flex items-center justify-center bg-dark-card border border-dark-border text-dark-text-2 cursor-pointer z-10 text-[10px] transition-all duration-200`}
    >
      {collapsed ? '›' : '‹'}
    </button>
  )
}

// Um item normal do menu (Home, Notícias, Comunidade, Fichas de RPG...)
function ItemMenu({ item, collapsed }) {
  return (
    <NavLink
      to={item.comingSoon ? '#' : item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
      className={`no-underline ${item.comingSoon ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {({ isActive }) => {
        // Escolhe a cor do item dependendo do estado dele
        let corDoItem = 'bg-transparent text-dark-text-2 hover:bg-dark-hover hover:text-dark-text-1'
        if (item.comingSoon) {
          corDoItem = 'bg-transparent text-dark-text-3 opacity-55'
        } else if (isActive) {
          corDoItem = 'bg-[rgba(124,58,237,0.12)] text-brand-light'
        }

        // Escolhe o espaçamento dependendo se o menu está recolhido
        let espacamento = 'py-[0.6rem] px-[0.85rem] justify-start'
        if (collapsed) {
          espacamento = 'p-[0.65rem] justify-center'
        }

        return (
          <div className={`group flex items-center gap-3 ${espacamento} rounded-xl relative overflow-hidden min-h-[42px] transition-all duration-150 ${corDoItem}`}>
            {isActive && !item.comingSoon && <BarraLateralAtiva />}

            <span className="shrink-0 leading-[0]">{item.icon}</span>

            {!collapsed && (
              <span className="text-[0.8rem] font-semibold whitespace-nowrap flex-1">
                {item.label}
              </span>
            )}

            {!collapsed && item.badge && (
              <span className="py-[0.1rem] px-[0.4rem] rounded-full text-[0.55rem] font-extrabold bg-linear-to-br from-[#7c3aed] to-[#bf00ff] text-white tracking-[0.04em]">
                {item.badge}
              </span>
            )}

            {!collapsed && item.comingSoon && (
              <span className="py-[0.08rem] px-[0.4rem] rounded-full text-[0.52rem] font-bold border border-dark-border text-dark-text-3 tracking-[0.03em] whitespace-nowrap">
                em breve
              </span>
            )}

            {collapsed && (
              <span className="absolute left-[110%] top-1/2 -translate-y-1/2 bg-dark-card border border-dark-border rounded-lg py-[0.3rem] px-[0.65rem] text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 z-[100] shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-opacity duration-150 group-hover:opacity-100">
                {item.label}{item.comingSoon ? ' (em breve)' : ''}
              </span>
            )}
          </div>
        )
      }}
    </NavLink>
  )
}

// O item de E-Sports, que ao clicar abre uma lista de sub-páginas
function ItemEsports({ item, collapsed, esportsAtivo, esportsAberto, onToggle }) {
  let corDoBotao = 'bg-transparent text-dark-text-2 hover:bg-dark-hover hover:text-dark-text-1'
  if (esportsAtivo) {
    corDoBotao = 'bg-[rgba(124,58,237,0.12)] text-brand-light'
  }

  let espacamento = 'py-[0.6rem] px-[0.85rem] justify-start'
  if (collapsed) {
    espacamento = 'p-[0.65rem] justify-center'
  }

  let rotacaoDaSeta = ''
  if (esportsAberto) {
    rotacaoDaSeta = 'rotate-90'
  }

  return (
    <div>
      <button
        onClick={onToggle}
        title={collapsed ? item.label : undefined}
        className={`w-full flex items-center gap-3 ${espacamento} rounded-xl min-h-[42px] border-none cursor-pointer transition-all duration-150 relative ${corDoBotao}`}
      >
        {esportsAtivo && <BarraLateralAtiva />}

        <span className="shrink-0 leading-[0]">{item.icon}</span>

        {!collapsed && (
          <>
            <span className="text-[0.8rem] font-semibold flex-1 text-left">
              {item.label}
            </span>
            <span className={`text-[10px] transition-transform duration-200 text-dark-text-3 ${rotacaoDaSeta}`}>▶</span>
          </>
        )}
      </button>

      {esportsAberto && (
        <div className={`flex flex-col gap-px ${collapsed ? 'pl-0' : 'pl-3'}`}>
          {ESPORTS_SUB_ITEMS.map(sub => (
            <ItemEsportsSub key={sub.to} sub={sub} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  )
}

// Um sub-item dentro da lista de E-Sports (Notícias, Partidas, Times, Eventos)
function ItemEsportsSub({ sub, collapsed }) {
  return (
    <NavLink to={sub.to} title={collapsed ? sub.label : undefined} className="no-underline">
      {({ isActive }) => {
        let corDoItem = 'bg-transparent text-dark-text-3 hover:bg-dark-hover hover:text-dark-text-2'
        if (isActive) {
          corDoItem = 'bg-[rgba(124,58,237,0.15)] text-brand-light'
        }

        let espacamento = 'py-[0.45rem] px-3 justify-start'
        if (collapsed) {
          espacamento = 'p-2 justify-center'
        }

        return (
          <div className={`flex items-center gap-[0.6rem] ${espacamento} rounded-[10px] min-h-[36px] transition-all duration-150 ${corDoItem}`}>
            <span className="text-[13px]">{sub.icone}</span>
            {!collapsed && <span className="text-xs font-medium">{sub.label}</span>}
          </div>
        )
      }}
    </NavLink>
  )
}

// Barrinha roxa que aparece do lado esquerdo do item ativo
function BarraLateralAtiva() {
  return (
    <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-[3px] bg-linear-to-b from-[#7c3aed] to-[#bf00ff]" />
  )
}

// Rodapé com o nome do site, só aparece com o menu expandido
function Rodape() {
  return (
    <div className="mt-auto px-3">
      <div className="p-3 rounded-xl bg-[rgba(124,58,237,0.07)] border border-[rgba(124,58,237,0.12)]">
        <p className="text-[0.63rem] text-dark-text-3 text-center leading-[1.4]">
          ProLobby v1.0<br/>
          <span className="text-brand-light opacity-60">Hub Gamer</span>
        </p>
      </div>
    </div>
  )
}