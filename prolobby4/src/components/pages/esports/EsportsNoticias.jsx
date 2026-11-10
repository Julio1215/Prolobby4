import { useState } from 'react'
import EsportsSubNav from './EsportsSubNav'
import NewsArticle from './NewsArticle'
import FiltroEsports from './FiltroEsports'

// Notícias escritas pelo colega responsável pela seção de E-Sports
const NEWS = [
  {
    image: "/Imagens/HJdHytsXkAEbYGc.jpg",
    title: "Kru anuncia saída do Silentzz após eliminação da EWC",
    paragraphs: [
      "Após um inicio avassalador da equipe, conseguindo seed 1 do grupo alpha e com desempenhos individual impactantes, o final do split no VCT americas foi bem abaixo e terminando sua participação com duas derrotas nos playoffs.",
      "Com a eliminação precoce nos playoffs, um alerta acendeu em todos da equipe e a midia começou se questionar se o elenco já teria chegado ao teto de sua performece.",
      "Após alguns minutos da elimanação na EWC, A Kru anuncia que não contará com Silentzz para o proximo split.",
    ],
  },
  {
    image: "/Imagens/liquidvisa.jpg",
    title:
      "Team LiquidVisa após a classificação historica para o VCB, encerra sua participação na liga Brasileira sem nenhuma vitoria",
    paragraphs: [
      "Atual campeã do mundo no cenario inclusivo, a team liquid não consegue nenhuma vitoria e devido a combinações de resultados não há possíbilidade em disputar os playoffs.",
      "O time fez um open qualify historico e foi o primeiro time inclusivo do Brasil que conseguiu consquistar uma vaga para disputar a liga brasileira.",
      "Team liquid ainda entra no servidor para disputar a ultima partida na fase de grupos contra Elevate.",
    ],
  },
  {
    image:
      "/Imagens/onur_valorant-mibr-nova-lineup-2026-zekken-verno-mazino-tex_1766086730634.jpg",
    title: "MIBR classifica para EWC em Paris",
    paragraphs: [
      'O "Dream Team" consegue conquistar a vaga para o campeonato que ocorrerá em Paris após uma serie avassaladora contra a Kru e posteriomente contra a Leviatán.',
      "Após eliminação melancolica no playoffs do VCT americas stage 1, o time recuperou o bom desempenho e está em Paris para disputar campeonato que a prize pool é 2 milhões de dolares.",
      "O time brasileiro se junta a G2, NGR e 100Thieves para representar a região Americas.",
    ],
  },
  {
    image: "/Imagens/hq720.jpg",
    title:
      "Shaw anuncia os convocados para disputar a copa do mundo de Valorant",
    paragraphs: [
      "Após muitas especulação e duvidas da comunidade, a lista final saiu e conta com algumas surpresas.",
      "A seleção contará com o Aspas considerado por muitos como o Goat do Valorant, Less considerado como o melhor sentinela do VCT Americas, Artizin que fez uma temporada 2025 e 2026 muita acima da media e assumirá como IGL (Capitão) do time, SpikeziN destaque da campanha historica no Acession da 2G em 2024 atualmente brilhando na equipe da Leviatán, Luk xo destaque da Loud vem para ser reserva do Less, Sato jovem promessa do cenario brasileiro atualmente na Leviatán vem para ser reserva do Aspas e a grande surpresa Sacy, jogador tinha se aponsentado no inicio de 2025 encerrando sua trajetoria muito vitoriosa onde conquistou o mundial em 2022 pela Loud voltá para disputar essa copa do mundo",
    ],
  },
]

export default function EsportsNoticias() {
  const [ordem, setOrdem] = useState('Mais recentes')
  const noticias = ordem === 'Mais recentes' ? NEWS : [...NEWS].reverse()

  return (
    <div className="text-dark-text-1 pb-12">
      <EsportsSubNav ativa="noticias" />

      <div className="max-w-5xl mx-auto px-6 pt-6">
        <FiltroEsports
          opcoes={['Mais recentes', 'Mais antigas']}
          selecionado={ordem}
          onSelecionar={setOrdem}
        />
      </div>

      <section className="w-full">
        {noticias.map((n, i) => (
          <NewsArticle key={i} {...n} />
        ))}
        <div className="max-w-5xl mx-auto flex justify-center py-10">
          <button className="bg-dark-secondary/80 hover:bg-dark-hover border border-dark-border px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            Carregar mais
          </button>
        </div>
      </section>
    </div>
  )
}
