import { useState } from 'react'
import EsportsSubNav from './EsportsSubNav'
import MatchCard from './MatchCard'
import FiltroEsports from './FiltroEsports'

// Partidas escritas pelo colega responsável pela seção de E-Sports
const TODAY_MATCHES = [
  {
    time: "11:00",
    teamA: "FUT",
    logoA: "/logos/fut.png.png",
    teamB: "NRG",
    logoB: "/logos/nrg.png.png",
    tournament: "VALORANT Masters London • Fase Suíça",
    format: "Melhor de 3",
  },
  {
    time: "14:00",
    teamA: "GE",
    logoA: "/logos/Global.png",
    teamB: "XLG",
    logoB: "/logos/xlg.png",
    tournament: "VALORANT Masters London • Fase Suíça",
    format: "Melhor de 3",
  },
  {
    time: "17:00",
    teamA: "EG",
    logoA: "/logos/EG.png",
    teamB: "RATO",
    logoB: "/logos/Valorant.png",
    tournament: "Game Changers BR • Fase Suíça",
    format: "Melhor de 3",
  },
  {
    time: "17:00",
    teamA: "TLV",
    logoA: "/logos/tlv.png",
    teamB: "ARS",
    logoB: "/logos/Valorant.png",
    tournament: "Game Changers BR • Fase Suíça",
    format: "Melhor de 3",
  },
  {
    time: "20:00",
    teamA: "TLZ",
    logoA: "/logos/Valorant.png",
    teamB: "UCHI",
    logoB: "/logos/Valorant.png",
    tournament: "Game Changers BR • Fase Suíça",
    format: "Melhor de 3",
  },
]

const FRIDAY_MATCHES = [
  {
    time: "11:00",
    teamA: "PRX",
    logoA: "/logos/PRX.png",
    teamB: "LEV",
    logoB: "/logos/lev.png",
    tournament: "VALORANT Masters London • Fase Suíça",
    format: "Melhor de 3",
  },
  {
    time: "14:00",
    teamA: "TH",
    logoA: "/logos/TH.png",
    teamB: "VIT",
    logoB: "/logos/41px-Team_Vitality_2023_darkmode.png",
    tournament: "VALORANT Masters London • Fase Suíça",
    format: "Melhor de 3",
  },
  {
    time: "19:00",
    teamA: "OPG",
    logoA: "/logos/OPG.png",
    teamB: "Kru Blaze",
    logoB: "/logos/KRUBlaze.png",
    tournament: "Game Changers LATAM • Semana 5",
    format: "Melhor de 3",
  },
  {
    time: "22:00",
    teamA: "CAT",
    logoA: "/logos/Valorant.png",
    teamB: "AKV",
    logoB: "/logos/AKV.png",
    tournament: "Game Changers LATAM • Semana 5",
    format: "Melhor de 3",
  },
]



// Lista de torneios únicos, direto dos dados acima, pra montar as opções do filtro
const TORNEIOS = ['Todos', ...new Set([...TODAY_MATCHES, ...FRIDAY_MATCHES].map(m => m.tournament))]

export default function EsportsPartidas() {
  const [filtro, setFiltro] = useState('Todos')

  const hojeFiltradas = filtro === 'Todos'
    ? TODAY_MATCHES
    : TODAY_MATCHES.filter(m => m.tournament === filtro)

  const sextaFiltradas = filtro === 'Todos'
    ? FRIDAY_MATCHES
    : FRIDAY_MATCHES.filter(m => m.tournament === filtro)

  return (
    <div className="text-dark-text-1 min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      <EsportsSubNav ativa="partidas" />
      <main className="max-w-4xl mx-auto space-y-8 sm:space-y-12 mt-4 sm:mt-6">
        <FiltroEsports opcoes={TORNEIOS} selecionado={filtro} onSelecionar={setFiltro} />

        <section>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2.5 text-purple-300">
            <i className="bi bi-calendar-event text-lg sm:text-xl"></i> 
            <span>Partidas de Hoje</span>
          </h2>

          {hojeFiltradas.length === 0 && (
            <p className="text-dark-text-3 text-sm">Nenhuma partida encontrada.</p>
          )}
          <div className="flex flex-col gap-3 sm:gap-4">
            {hojeFiltradas.map((m, i) => (
              <MatchCard key={m.id || i} {...m} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2.5 text-purple-300">
            <i className="bi bi-calendar-event text-lg sm:text-xl"></i> 
            <span>Sexta-feira, 12 de jun</span>
          </h2>

          {sextaFiltradas.length === 0 && (
            <p className="text-dark-text-3 text-sm">Nenhuma partida encontrada.</p>
          )}
          <div className="flex flex-col gap-3 sm:gap-4">
            {sextaFiltradas.map((m, i) => (
              <MatchCard key={m.id || i} {...m} />
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
