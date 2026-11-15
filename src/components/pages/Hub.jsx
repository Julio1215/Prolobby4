import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import spaceVideo from '../../../spacestars.mp4' 
import newsIMG from '../../assets/hub/news.png'
import guiaIMG from '../../assets/hub/guia.png'
import esportsIMG from '../../assets/hub/e-sports.png'
import fichasRpgIMG from '../../assets/hub/fichas-rpg.png'
import qcdIMG from '../../assets/hub/qcd.png'

export default function Hub() {
  const navigate = useNavigate()
  const [telaAtual, setTelaAtual] = useState('start')
  const [isLogged, setIsLogged] = useState(false)

  const checarStatusLogin = () => {
    return (
      localStorage.getItem('token') || 
      localStorage.getItem('user') || 
      localStorage.getItem('hg_token') || 
      localStorage.getItem('hg_user')
    )
  }

  useEffect(() => {
    setIsLogged(!!checarStatusLogin())
  }, [])

  const fases = [
    { id: 1, titulo: "Fase 1: Noticias", imagem: newsIMG, rota: "/news" },
    { id: 2, titulo: "Fase 2: Guia de Jogos", imagem: guiaIMG, rota: "/guia" },
    { id: 3, titulo: "Fase 3: E - Sports", imagem: esportsIMG, rota: "/esports" },
    { id: 4, titulo: "Fase 4: RPG", imagem: fichasRpgIMG, rota: "/rpg" },
    { id: 5, titulo: "Fase 5: QCD SCORE", imagem: qcdIMG, rota: "/qcd" },
  ]

  const handlePlayersClick = () => {
    if (checarStatusLogin()) {
      navigate('/perfil')
    } else {
      navigate('/login')
    }
  }

  const handleExitClick = () => {
    if (!checarStatusLogin()) {
      alert("Ação Inválida: Você não está logado no site!")
      return
    }
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('hg_token')
    localStorage.removeItem('hg_user')
    
    setIsLogged(false)
    alert("Game Over! Você deslogou com sucesso.")
  }

  return (
    <div className="relative min-h-screen text-white font-mono flex flex-col items-center justify-center p-5 overflow-hidden select-none">
      
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10 pointer-events-none"
      >
        <source src={spaceVideo} type="video/mp4" />
      </video>

      {/* Conteúdo Principal */}
      <div className="z-10 flex flex-col items-center w-full max-w-6xl">
        
        {/* Título Principal (visível na tela START) */}
        {telaAtual === 'start' && (
          <h1 className="font-pressstart text-3xl md:text-4xl text-[#bc34fa] mb-12 tracking-wider text-center drop-shadow-[0_0_15px_rgba(188,52,250,0.8)] leading-relaxed">
            Pro Lobby
          </h1>
        )}

        {/* TELA 1: START */}
        {telaAtual === 'start' && (
          <div className="flex flex-col gap-6 items-center">
            <button 
              onClick={() => setTelaAtual('fases')}
              className="font-pressstart bg-transparent border-none text-white text-lg md:text-xl cursor-pointer animate-pulse"
            >
              Press Start
            </button>
            
            <span 
              onClick={() => navigate('/guia')}
              className="text-xl opacity-90 cursor-pointer hover:text-[#bc34fa] transition-colors"
            >
              Guia
            </span>
            
            <span 
              onClick={handlePlayersClick}
              className={`text-xl opacity-90 cursor-pointer transition-colors ${
                isLogged ? 'hover:text-[#34fa73]' : 'hover:text-[#bc34fa]'
              }`}
            >
              {isLogged ? 'Players (Acessar Conta)' : 'Players (Login)'}
            </span>
            
            <span 
              onClick={handleExitClick}
              className={`text-xl cursor-pointer hover:text-red-500 transition-colors ${
                isLogged ? 'opacity-90' : 'opacity-40'
              }`}
            >
              Exit
            </span>
          </div>
        )}

        {/* TELA 2: FASES */}
        {telaAtual === 'fases' && (
          <div className="w-full flex flex-col gap-6">
            
            {/* Topo com Botão Voltar + Título Alinhados sem sobreposição */}
            <div className="flex items-center justify-between w-full mb-2">
              <button 
                onClick={() => setTelaAtual('start')}
                className="bg-transparent border-2 border-white rounded-full text-white w-10 h-10 md:w-11 md:h-11 cursor-pointer flex items-center justify-center text-lg md:text-xl hover:border-[#bc34fa] hover:text-[#bc34fa] transition-colors shrink-0"
                title="Voltar"
              >
                ←
              </button>

              <h1 className="font-pressstart text-xl md:text-3xl text-[#bc34fa] tracking-wider text-center drop-shadow-[0_0_15px_rgba(188,52,250,0.8)] flex-1 px-2">
                Pro Lobby
              </h1>

              {/* Elemento invisível do mesmo tamanho do botão apenas para centralizar o título */}
              <div className="w-10 md:w-11 shrink-0" />
            </div>

            {/* Grid das Fases */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {fases.map((fase) => (
                <div 
                  key={fase.id}
                  onClick={() => navigate(fase.rota)}
                  className="bg-[#141923]/90 border-2 border-[#3d4f73] p-4 rounded-xl flex justify-between items-center gap-4 cursor-pointer h-36 overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:border-[#bc34fa] hover:shadow-[0_0_25px_rgba(188,52,250,0.7)]"
                >
                  {/* Título da Fase */}
                  <h3 className="font-pressstart flex-1 text-xs leading-relaxed drop-shadow-md">
                    {fase.titulo}
                  </h3>
                  
                  {/* Imagem Direta */}
                  {fase.imagem ? (
                    <img 
                      src={fase.imagem} 
                      alt={fase.titulo}
                      className="w-24 h-24 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-black/40 border border-white/10 shrink-0" />
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}