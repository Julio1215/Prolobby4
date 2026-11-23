// Layout.jsx — estrutura visual das páginas internas
// (Navbar no topo, Sidebar à esquerda, conteúdo no centro, DiceWidget flutuante)
//
// O que mudou:
// - Imports ajustados para a nova localização (estava em components/layout/)
// - Código idêntico ao original

import { lazy, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

// O DiceWidget usa a biblioteca Three.js (pesada) pra desenhar o dado 3D.
// Com lazy(), esse peso só é baixado quando o usuário entra em /rpg ou
// /mestre — nas outras páginas o Three.js nem chega a ser baixado.
const DiceWidget = lazy(() => import('../ui/DiceWidget'))

export default function Layout() {
  const location = useLocation()

  // O dado flutuante só faz sentido nas páginas de RPG
  const mostrarDado = location.pathname.startsWith('/rpg')

  return (
    <div className="flex flex-col min-h-screen bg-dark-base transition-colors">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main
          key={location.pathname}
          className="page-enter flex-1 p-6 max-w-full overflow-x-hidden overflow-y-auto bg-linear-to-b from-[#1e1b4b] via-[#2e1065] to-[#0f0a24]"
        >
          <Outlet />
        </main>
      </div>
      {mostrarDado && (
        <Suspense fallback={null}>
          <DiceWidget />
        </Suspense>
      )}
    </div>
  )
}