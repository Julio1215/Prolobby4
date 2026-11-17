import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Layout from './components/layout/Layout'

// Sua nova página inicial estilo videogame (Press Start / Seleção de fases)
// O Hub continua com import normal porque é a primeira coisa que todo mundo vê.
import Hub from './components/pages/Hub'

// As outras páginas usam lazy() — o código de cada uma só é baixado
// quando o usuário realmente visita aquela rota, em vez de tudo junto
// no carregamento inicial do site. Isso deixa o pacote inicial bem menor.
const Noticias = lazy(() => import('./components/pages/Noticias'))
const QcdScore = lazy(() => import('./components/pages/QcdScore'))
const Reviews = lazy(() => import('./components/pages/Reviews'))
const RpgDashboard = lazy(() => import('./components/pages/rpg/Dashboard'))
const RpgCampanhas = lazy(() => import('./components/pages/rpg/Campanhas'))
const RpgFichas = lazy(() => import('./components/pages/rpg/Fichas'))
const RpgMesa = lazy(() => import('./components/pages/rpg/Mesa'))
const RpgFerramentas = lazy(() => import('./components/pages/rpg/Ferramentas'))
const RpgMestreIA = lazy(() => import('./components/pages/rpg/MestreIA'))
const Perfil = lazy(() => import('./components/pages/Perfil'))
const Comunidade = lazy(() => import('./components/pages/Comunidade'))

const Login = lazy(() => import('./components/pages/Login'))
const Cadastro = lazy(() => import('./components/pages/Cadastro'))
const EsqueciSenha = lazy(() => import('./components/pages/EsqueciSenha'))
const RedefinirSenha = lazy(() => import('./components/pages/RedefinirSenha'))

const EsportsNoticias = lazy(() => import('./components/pages/esports/EsportsNoticias'))
const EsportsPartidas = lazy(() => import('./components/pages/esports/EsportsPartidas'))
const EsportsTimes = lazy(() => import('./components/pages/esports/EsportsTimes'))
const EsportsEventos = lazy(() => import('./components/pages/esports/EsportsEventos'))

const GuiaDeJogos = lazy(() => import('./components/pages/GuiaDeJogos'))

// Chamada de voz, vídeo e tela (layouts Conversa, Apresentação e RPG)
const Chamada = lazy(() => import('./components/pages/Chamada'))

// Espaço reservado onde a página da chamada é desenhada quando a rota /chamada está aberta.
// A chamada é só para quem fez login: quem não entrou vê um aviso com os botões Entrar e Criar conta.
function EspacoDaChamada() {
  const { usuario } = useAuth()
  const { search } = useLocation() // guarda o convite (?sala=...) para voltar a ele depois do login

  if (usuario) return <div id="slot-chamada" />

  const aoEntrar = { voltarPara: '/chamada' + search } // o Login e o Cadastro usam isso para voltar para cá
  return (
    <div className="mx-auto mt-10 grid max-w-md gap-4 rounded-xl border border-dark-border bg-dark-card p-6 text-center text-dark-text-1">
      <div className="text-4xl">🔒</div>
      <h1 className="text-xl font-bold">A chamada é só para quem fez login</h1>
      <p className="text-sm text-dark-text-2">Entre na sua conta, ou crie uma (é grátis), para usar a chamada de voz, vídeo e tela.</p>
      <div className="grid grid-cols-2 gap-2">
        <Link to="/login" state={aoEntrar} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500">Entrar</Link>
        <Link to="/register" state={aoEntrar} className="rounded-lg border border-dark-border px-4 py-2 font-semibold text-dark-text-1 hover:bg-dark-secondary">Criar conta</Link>
      </div>
    </div>
  )
}

// Mantém a chamada viva em todas as rotas: ela fica montada depois da primeira visita a /chamada
// (o código só é baixado nessa primeira visita), então trocar de página não derruba a chamada.
function ChamadaPersistente() {
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const [jaVisitou, setJaVisitou] = useState(false)

  useEffect(() => {
    if (!usuario) setJaVisitou(false)                    // saiu da conta (ou nem entrou): a chamada some de vez
    else if (pathname === '/chamada') setJaVisitou(true) // só conta como visita quem fez login
  }, [pathname, usuario])

  // Sem login a chamada não existe. Se a pessoa sair da conta no meio da chamada, ela é encerrada.
  if (!jaVisitou || !usuario) return null
  return (
    <Suspense fallback={null}>
      <Chamada naPagina={pathname === '/chamada'} />
    </Suspense>
  )
}

// Tela simples mostrada por uma fração de segundo enquanto o código
// da página escolhida termina de baixar.
function CarregandoPagina() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-base">
      <div className="w-12 h-12 border-3 border-purple-600/20 border-t-purple-600 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const temaSalvo = localStorage.getItem('hg_theme') || 'dark'
    document.documentElement.classList.add(temaSalvo)
  }, [])

  return (
    <>
    <Suspense fallback={<CarregandoPagina />}>
    <Routes>
      {/* 1. SUA TELA INICIAL "PRESS START" (Tela cheia isolada) */}
      <Route path="/" element={<Hub />} />

      {/* Páginas de autenticação */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Cadastro />} />
      <Route path="/forgot-password" element={<EsqueciSenha />} />
      <Route path="/reset-password" element={<RedefinirSenha />} />

      {/* 2. AS ROTAS DO HUB COM LAYOUT (Mantendo os links originais!) */}
      {/* ATENÇÃO: Removemos o path="/hub". Agora o Layout renderiza, mas a URL continua limpa. */}
      <Route element={<Layout />}>
        <Route path="news" element={<Noticias />} />
        <Route path="qcd" element={<QcdScore />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="rpg" element={<RpgDashboard />} />
        <Route path="rpg/campanhas" element={<RpgCampanhas />} />
        <Route path="rpg/fichas" element={<RpgFichas />} />
        <Route path="rpg/mesa" element={<RpgMesa />} />
        <Route path="rpg/ferramentas" element={<RpgFerramentas />} />
        <Route path="rpg/mestre" element={<RpgMestreIA />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="community" element={<Comunidade />} />
        <Route path="guia" element={<GuiaDeJogos />} />
        <Route path="chamada" element={<EspacoDaChamada />} />

        {/* Rotas do módulo E-Sports */}
        <Route path="esports" element={<EsportsNoticias />} />
        <Route path="esports/noticias" element={<EsportsNoticias />} />
        <Route path="esports/partidas" element={<EsportsPartidas />} />
        <Route path="esports/times" element={<EsportsTimes />} />
        <Route path="esports/eventos" element={<EsportsEventos />} />
      </Route>
    </Routes>
    </Suspense>
    <ChamadaPersistente />
    </>
  )
}