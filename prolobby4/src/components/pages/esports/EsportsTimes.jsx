import { useState } from 'react'
import EsportsSubNav from './EsportsSubNav'
import TeamUpcomingGame from './TeamUpcomingGame'
import PlayerCard from './PlayerCard'
import FiltroEsports from './FiltroEsports'

const MIBR_LOGO = "/Imagens/MIBR Logo1.png"
const UPCOMING_GAMES = [
  { logoB: "/logos/nrg.png.png", date: "18/07/2026" },
  { logoB: "/logos/50px-Team_Envy_2018_darkmode.png", date: "23/07/2026" },
  { logoB: "/logos/51px-FURIA_Esports_allmode.png", date: "26/07/2026" },
  { logoB: "/logos/EG.png", date: "31/07/2026" },
  { logoB: "/logos/lev.png", date: "08/08/2026" },
]
const LINEUP = [
  {
    image: "/Imagens/Aspas.JPG",
    name: "Aspas (Erick Santos)",
    description:
      "Considerado por muitos o melhor jogador do mundo e o principal duelista da história do VALORANT. Campeão mundial em 2022, ele traz para o time uma mira cirúrgica incontestável, além de uma capacidade absurda de decidir rounds sozinho.",
  },
  {
    image: "/Imagens/Zekken.JPG",
    name: "Zekken (Zachary Patrone)",
    description:
      "Um dos duelistas e flex mais impactantes e explosivos do cenário global. Conhecido por sua agressividade e mecânica impecável, ele chegou no grande pacotão de reforços no fim de 2025 para elevar a equipe.",
  },
  {
    image: "/Imagens/Verno.jpg",
    name: "Verno (Andrew Maust)",
    description:
      "Jovem prodígio norte-americano de apenas 20 anos, Verno atua como o capitão e líder estratégico dentro do jogo (IGL). Contratado no início de 2025, ele foi o grande motor da evolução tática do time.",
  },
  {
    image: "/Imagens/Mazino.jpg",
    name: "Mazino (Roberto Rivas)",
    description:
      "Estrela chilena de altíssimo nível. Mazino é o controlador ideal, famoso por sua consistência absurda em campeonatos internacionais e leitura rápida de jogo.",
  },
  {
    image: "/Imagens/Tex.jpg",
    name: "tex (Ian Botsch)",
    description:
      "Jogador extremamente versátil e inteligente na função de sentinela ou flex. Campeão internacional com vasta experiência em times norte-americanos, tex dá a estabilidade defensiva.",
  },
  {
    image: "/Imagens/FROD.jpg",
    name: "fRoD (Daniel Montaner - Treinador)",
    description:
      "Nascido nos EUA e de origem cubana, é uma lenda viva do FPS. Ex-jogador profissional histórico de Counter-Strike, ele migrou para o VALORANT como técnico em 2020. Antes de assumir o MIBR no fim de 2023, ele liderou a LOUD na conquista do título do VCT Américas 2023. É conhecido por sua liderança firme e capacidade de moldar identidades de equipe fortes.",
  },
]
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Descobre o mês de um jogo a partir da data no formato DD/MM/AAAA
function mesDoJogo(dataBr) {
  const partes = dataBr.split('/')
  return MESES[Number(partes[1]) - 1]
}

const MESES_DISPONIVEIS = ['Todos', ...new Set(UPCOMING_GAMES.map(g => mesDoJogo(g.date)))]

export default function EsportsTimes() {
  const [filtro, setFiltro] = useState('Todos')

  const jogosFiltrados = filtro === 'Todos'
    ? UPCOMING_GAMES
    : UPCOMING_GAMES.filter(g => mesDoJogo(g.date) === filtro)

  return (
    <div className="text-dark-text-1 pb-12 w-full">
      <EsportsSubNav ativa="times" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 mt-4 sm:mt-6">
          <FiltroEsports opcoes={MESES_DISPONIVEIS} selecionado={filtro} onSelecionar={setFiltro} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col gap-6">
            <div className="bg-dark-secondary/40 backdrop-blur-sm border border-dark-border rounded-2xl p-6 flex items-center justify-center h-44">
              <img
                src={MIBR_LOGO}
                alt="Emblema da equipe"
                className="max-h-32 w-auto object-contain"
              />
            </div>
            <div className="bg-dark-secondary/40 backdrop-blur-sm border border-dark-border rounded-2xl p-6 flex-1 min-h-[300px]">
              <h2 className="text-lg font-bold border-b border-purple-900/50 pb-2 mb-4 text-purple-400">
                Jogos a seguir
              </h2>
              {jogosFiltrados.length === 0 && (
                <p className="text-sm text-dark-text-3">Nenhum jogo encontrado.</p>
              )}
              {jogosFiltrados.map((g, i) => (
                <TeamUpcomingGame
                  key={i}
                  logoA={MIBR_LOGO}
                  logoB={g.logoB}
                  date={g.date}
                />
              ))}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-6 justify-between">
            <div className="bg-dark-secondary/40 backdrop-blur-sm border border-dark-border rounded-2xl p-6">
              <h2 className="text-lg font-bold border-b border-purple-900/50 pb-2 mb-3 text-purple-400">
                História da Equipe
              </h2>
              <p className="text-sm text-dark-text-1 leading-relaxed">
                A trajetória da MIBR (Made in Brazil) no VALORANT começou em
                2022 e se consolidou ao se tornar uma das organizações parceiras
                da Riot Games na liga oficial das Américas (VCT Américas). A Era
                de Estrelas começou em 2026, a organização foi adquirida pela
                Spun Mídia/EZOR no final de 2025. E para a temporada 26, o MIBR
                montou uma das escalações mais fortes do mundo, trazendo grandes
                estrelas do cenário. O elenco atual conta com aspas, um dos
                maiores campeões do jogo, além de Verno, Mazino, tex e zekken.
              </p>
            </div>
            <div className="flex justify-end flex-1 min-h-[184px]">
              <div className="bg-dark-secondary/40 backdrop-blur-sm border border-dark-border rounded-2xl p-6 w-full md:w-80">
                <h2 className="text-lg font-bold border-b border-purple-900/50 pb-2 mb-3 text-purple-400">
                  Títulos
                </h2>
                <p className="text-sm text-dark-text-1">-</p>
              </div>
            </div>
          </div>
        </div>
        <section className="bg-dark-secondary/20 backdrop-blur-sm border border-dark-border/60 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-purple-400 mb-6 px-2">
            Line-up Oficial
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {LINEUP.map((p, i) => (
              <PlayerCard key={i} {...p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
