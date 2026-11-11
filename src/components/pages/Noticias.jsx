import { useEffect, useState } from 'react'
import { atualizarNoticias, listarNoticias } from '../../services/conteudoApi'

// ============================================================
// NOTÍCIAS — conteúdo escrito pela colega responsável pela seção
// de Notícias, com links reais de sites de games de verdade.
// ============================================================

const CATEGORIAS = [
  { nome: 'Playstation', cor: 'text-blue-600',  corHover: 'hover:text-blue-400',  corGrupoHover: 'group-hover:text-blue-600',  bg: 'bg-blue-600/20'  },
  { nome: 'Xbox',        cor: 'text-green-600', corHover: 'hover:text-green-400', corGrupoHover: 'group-hover:text-green-600', bg: 'bg-green-600/20' },
  { nome: 'Nintendo',    cor: 'text-red-600',   corHover: 'hover:text-red-400',   corGrupoHover: 'group-hover:text-red-600',   bg: 'bg-red-600/20'   },
  { nome: 'Jogos',       cor: 'text-orange-500',corHover: 'hover:text-orange-400',corGrupoHover: 'group-hover:text-orange-500',bg: 'bg-orange-500/20'},
  { nome: 'Retrô',       cor: 'text-purple-500',corHover: 'hover:text-yellow-400',corGrupoHover: 'group-hover:text-purple-600',bg: 'bg-purple-500/20'},
  { nome: 'Geek',        cor: 'text-pink-500',  corHover: 'hover:text-pink-400',  corGrupoHover: 'group-hover:text-pink-600',  bg: 'bg-pink-500/20'  },
]

function corDaCategoria(nomeCategoria) {
  return CATEGORIAS.find(c => c.nome === nomeCategoria) || CATEGORIAS[3]
}

// ------------------------------------------------------------
// Notícias que vêm do banco (API)
// A API só separa "games" e "e-sports". Por isso a categoria de cada card
// (Playstation, Xbox, Nintendo, Jogos, Retrô ou Geek) é descoberta pelo título e pelo endereço.
// ------------------------------------------------------------

// Pedimos só notícias de games e em português (e-sports têm seção própria)
const FILTROS_DA_API = { limite: 50, categoria: 'games', idioma: 'pt' }

const PALAVRAS_RETRO = /retr[ôo]|nostalg|cl[áa]ssic|8[- ]?bits?|16[- ]?bits?|\batari\b|mega drive|master system|super nintendo|\bsnes\b|game ?boy|nintendo 64|\bn64\b|dreamcast|fliperama|arcade|saturn/i
const PALAVRAS_PLAYSTATION = /playstation|\bps ?[1-5]\b|\bpsp\b|ps vita|ps plus|dualsense|\bsony\b|state of play|god of war|astro bot|gran turismo|ghost of (tsushima|y[oō]tei)/i
const PALAVRAS_XBOX = /xbox|game pass|microsoft|\bhalo\b|forza|gears of war|series [xs]\b/i
const PALAVRAS_NINTENDO = /nintendo|switch|zelda|mario|pok[eé]mon|kirby|metroid|splatoon|animal crossing|smash bros|joy-con|donkey kong|fire emblem|xenoblade/i

// ----- Geek: tudo que não é jogo (anime, filmes, séries, livros, tecnologia, ofertas...) -----

// Expressões que têm "jogo(s)" ou "game", mas não são sobre videogame
const FALSOS_AMIGOS = /jogos vorazes|jogos mortais|jogo da lula|squid game|game of thrones|jogos ol[ií]mpicos/gi

// Se o título tiver alguma destas palavras, a notícia fala de jogos e NUNCA é Geek
const PALAVRAS_DE_JOGOS = /jogos?\b|jogador|jogabilidade|\bgames?\b|gamescom|gamer|gameplay|console|playstation|\bps ?[1-5]\b|\bpsp\b|xbox|nintendo|\bswitch\b|steam|epic games|game pass|\bdlc\b|\bpatch\b|e-?sports?|speedrun|\bfps\b|\brpg\b|\bmmo|roguelike|souls|\bgta\b|zelda|mario|pok[eé]mon|fortnite|minecraft|roblox|call of duty|battlefield|assassin|resident evil|final fantasy|god of war|elden ring|cyberpunk|witcher|hollow knight|persona \d|tekken|street fighter|mortal kombat|league of legends|valorant|overwatch|diablo|destiny|\bhalo\b|forza|gears of war|starfield|baldur|dying light|silent hill|metal gear|monster hunter|dragon quest|kingdom hearts|\bsonic\b|\bdoom\b|fallout|skyrim|counter-strike|\bdota\b|dualsense|nuuvem/i

// Palavras de assuntos Geek (usadas quando o endereço não diz a seção da notícia)
const PALAVRAS_GEEK = /anime|mang[áa]|\bfilmes?\b|\bs[ée]ries?\b|temporada|epis[óo]dios?|netflix|\bhbo\b|disney\+|disney plus|prime video|apple tv|crunchyroll|cinema|bilheteria|live-action|quadrinhos|\bhq\b|\blivros?\b|\bbox\b|trilogia|\bvolumes?\b|streaming|smart tv|\btv\b|soundbar|notebook|smartphone|iphone|galaxy|tablet|celular|geladeira|novo cap[íi]tulo d[eoa]|dandadan|one piece|jujutsu|demon slayer|chainsaw man|my hero academia|attack on titan|spy x family|solo leveling|frieren|ci[êe]ncia|cientistas/i

// Sites que misturam jogos com filmes, séries, ofertas, ciência e tecnologia, mas separam
// por seção no endereço (ex.: site.com.br/games/titulo). Neles, o que está fora de /games/ é Geek.
const SITES_COM_SECAO_DE_GAMES = ['adrenaline.com.br', 'criticalhits.com.br']

function estaForaDaSecaoDeGames(endereco) {
  try {
    const { hostname, pathname } = new URL(endereco)
    const siteComSecao = SITES_COM_SECAO_DE_GAMES.some(site => hostname === site || hostname.endsWith('.' + site))
    return siteComSecao && !pathname.startsWith('/games/')
  } catch {
    return false // endereço estranho: não dá para saber, então não vira Geek por isso
  }
}

function ehGeek(titulo, endereco) {
  const texto = titulo.replace(FALSOS_AMIGOS, ' ')
  if (PALAVRAS_DE_JOGOS.test(texto)) return false
  return estaForaDaSecaoDeGames(endereco) || PALAVRAS_GEEK.test(texto)
}

// Descobre a categoria olhando o título (e o endereço, para saber se é Geek).
// Geek vem primeiro, depois Retrô; se citar mais de um console (ou nenhum), fica em "Jogos".
function descobrirCategoria(titulo, endereco) {
  if (ehGeek(titulo, endereco)) return 'Geek'
  if (PALAVRAS_RETRO.test(titulo)) return 'Retrô'
  const consoles = []
  if (PALAVRAS_PLAYSTATION.test(titulo)) consoles.push('Playstation')
  if (PALAVRAS_XBOX.test(titulo)) consoles.push('Xbox')
  if (PALAVRAS_NINTENDO.test(titulo)) consoles.push('Nintendo')
  return consoles.length === 1 ? consoles[0] : 'Jogos'
}

// Palavras comuns do inglês e do português, usadas só para descartar títulos em inglês
const PALAVRAS_EM_INGLES = ['and', 'with', 'your', 'you', 'is', 'are', 'was', 'were', 'this', 'that', 'from', 'have', 'has', 'will', 'how', 'why', 'what', 'but', 'they', 'my', 'it', 'its', 'in', 'on', 'to', 'for', 'all', 'after', 'about', 'been', 'since', 'just', 'into', 'out', 'now', 'we', 'our', 'their', 'be', 'can', 'not', 'when', 'who']
const PALAVRAS_EM_PORTUGUES = ['de', 'da', 'do', 'das', 'dos', 'em', 'na', 'nos', 'nas', 'para', 'com', 'que', 'um', 'uma', 'os', 'ao', 'aos', 'por', 'se', 'sem', 'mais', 'como', 'já', 'não', 'é', 'está', 'são', 'foi', 'vai', 'tem', 'seu', 'sua', 'o', 'e']

// Diz se o título parece estar em inglês: tem 2 ou mais palavras típicas do inglês
// e mais delas do que do português. Títulos com ã, õ ou ç são sempre português.
function tituloEmIngles(titulo) {
  if (/[ãõç]/i.test(titulo)) return false
  const palavras = titulo.toLowerCase().split(/[^a-zà-ÿ']+/)
  const qtdIngles = palavras.filter(p => PALAVRAS_EM_INGLES.includes(p)).length
  const qtdPortugues = palavras.filter(p => PALAVRAS_EM_PORTUGUES.includes(p)).length
  return qtdIngles >= 2 && qtdIngles > qtdPortugues
}

// Converte as notícias da API para o formato dos cards (sem as que estão em inglês)
function prepararNoticiasDoBanco(lista) {
  return lista
    .filter(n => !tituloEmIngles(n.titulo))
    .map(n => ({
      id: n.id,
      titulo: n.titulo,
      link: n.url,
      imagem: n.imagemUrl || '/news-assets/jogo.png',
      categoria: descobrirCategoria(n.titulo, n.url),
      data: n.publicadaEm ? new Date(n.publicadaEm).toLocaleDateString('pt-BR') : '',
    }))
}

// As 4 principais, escolhidas pela colega
const PRINCIPAIS = [
  {
    id: 1,
    imagem: "/news-assets/zelda oot.jpg",
    link: "https://br.ign.com/the-legend-of-zelda-ocarina-of-time/153715/mais-um-pra-conta-remake-de-the-legend-of-zelda-ocarina-of-time-chega-para-nintendo-switch-2-ainda-e",
    categoria: "Nintendo",
    data: "23/06/2026",
    titulo: "Remake de The Legend of Zelda: Ocarina of Time anunciado para 2026",
  },
  {
    id: 2,
    imagem: "/news-assets/p4 revival.jpg",
    link: "https://www.comboinfinito.com.br/principal/persona-4-revival-data-lancamento-xbox-games-showcase/",
    categoria: "Jogos",
    data: "07/06/2026",
    titulo: "Persona 4 Revival: Data de lançamento e trailer | Xbox Games Showcase 2026",
  },
  {
    id: 3,
    imagem: "/news-assets/ps2.png",
    link: "https://olhardigital.com.br/2026/05/28/games-e-consoles/mais-jogos-de-ps2-vao-ganhar-remakes-nesta-geracao-veja-a-lista/",
    categoria: "Playstation",
    data: "28/05/2026",
    titulo: "Mais jogos de PS2 vão ganhar remake nesta geração | Veja a lista",
  },
  {
    id: 4,
    imagem: "/news-assets/luta.webp",
    link: "https://canaltech.com.br/games/melhores-jogos-de-luta-da-historia/",
    categoria: "Jogos",
    data: "07/06/2026",
    titulo: "15 melhores jogos de luta da história | Canaltech",
  },
]

// As outras 16, escritas pela colega
const OUTRAS = [
  { id: 5,  imagem: "/news-assets/jogo.png",              link: "https://www.adrenaline.com.br/games/playstation/jogos-de-playstation-em-oferta-por-menos-de-r-40-veja-lista-16/", categoria: "Playstation", data: "18/06/2026", titulo: "Jogos de PlayStation em oferta por menos de R$ 40 - veja a lista!" },
  { id: 6,  imagem: "/news-assets/re requiem.png",        link: "https://www.tecmundo.com.br/voxel/503813-como-zerar-resident-evil-requiem-em-4-horas-veja-guia-de-speedrun.htm", categoria: "Jogos", data: "23/03/2026", titulo: "Como zerar Resident Evil Requiem em 4 horas? Veja guia de speedrun" },
  { id: 7,  imagem: "/news-assets/ps2.png",               link: "https://www.tecmundo.com.br/voxel/503156-a-historia-de-gta-san-andreas-relembre-a-narrativa-de-cj-antes-de-gta-6.htm", categoria: "Retrô", data: "16/02/2026", titulo: "A história de GTA San Andreas! Relembre a narrativa de CJ antes de GTA 6" },
  { id: 8,  imagem: "/news-assets/gta sa.png",            link: "https://www.fsa.br/minecraft-porta-entrada-arquitetura-criatividade/", categoria: "Jogos", data: "06/04/2026", titulo: "Minecraft como porta de entrada para a arquitetura" },
  { id: 9,  imagem: "/news-assets/xbox-360.jpg",          link: "https://www.omelete.com.br/games/os-50-melhores-jogos-de-xbox-360-lista-completa", categoria: "Xbox", data: "14/05/2026", titulo: "Os 50 melhores jogos de Xbox 360 de todos os tempos | omelete" },
  { id: 10, imagem: "/news-assets/mario galaxy.png",      link: "https://nintendoboy.com.br/2025/10/review-super-mario-galaxy-super-mario-galaxy-2/", categoria: "Nintendo", data: "13/10/2025", titulo: "Review | Super Mario Galaxy + Super Mario Galaxy 2" },
  { id: 11, imagem: "/news-assets/malenia.png",           link: "https://www.tecmundo.com.br/voxel/287844-derrotar-malenia-elden-ring.htm", categoria: "Jogos", data: "11/08/2024", titulo: "Como derrotar Malenia em Elden Ring?" },
  { id: 12, imagem: "/news-assets/dark souls.png",        link: "https://www.gamevicio.com/noticias/2026/05/dark-souls-trilogy-remake-em-desenvolvimento/", categoria: "Jogos", data: "04/05/2026", titulo: "Dark Souls Trilogy Remake pode estar em desenvolvimento, diz YouTuber" },
  { id: 13, imagem: "/news-assets/IAemjogos.png",         link: "https://meiobit.com/467846/ia-em-games-estudo-prejuizo-steam-fim-mito-dev-sem-talento/", categoria: "Jogos", data: "24/06/2026", titulo: "IA em games traz mais danos que benefícios, revela estudo" },
  { id: 14, imagem: "/news-assets/Where-winds-met.png",   link: "https://news.xbox.com/pt-br/2026/06/09/where-winds-meet-ja-esta-disponivel-e-com-beneficios-exclusivos-no-xbox-game-pass/", categoria: "Xbox", data: "09/06/2026", titulo: "Where Winds Meet já está disponível e com benefícios exclusivos no XBOX Game Pass" },
  { id: 15, imagem: "/news-assets/exclusivos-sony.png",   link: "https://www.tecmundo.com.br/voxel/504649-sony-nao-lancara-mais-jogos-exclusivos-de-playstation-no-pc-diz-relatorio-fiscal.htm", categoria: "Playstation", data: "22/06/2026", titulo: "Sony não lançará mais jogos exclusivos de PlayStation no PC, diz relatório fiscal" },
  { id: 16, imagem: "/news-assets/classicos n64.png",     link: "https://www.techtudo.com.br/noticias/2026/06/30-anos-de-nintendo-64-relembre-8-games-nostalgicos-para-jogar-agora-edjogos.ghtml", categoria: "Nintendo", data: "25/06/2026", titulo: "30 anos de Nintendo 64: relembre 8 games nostálgicos para jogar agora" },
  { id: 17, imagem: "/news-assets/gta vi.png",            link: "https://www.tudocelular.com/novos-produtos/noticias/n257220/gta-6-pre-venda-brasil-preco-comprar-desconto.html", categoria: "Jogos", data: "25/06/2026", titulo: "GTA 6 inicia pré-venda no Brasil com preço recorde; saiba onde comprar com desconto" },
  { id: 18, imagem: "/news-assets/ghost of tsushima.png", link: "https://br.ign.com/descontos/153435/oferta-em-dose-dupla-ghost-of-tsushima-e-ghost-of-yotei-para-ps5-ganham-descontos", categoria: "Playstation", data: "01/06/2025", titulo: "Oferta em dose dupla: Ghost of Tsushima e Ghost of Yōtei para PS5 ganham descontos" },
  { id: 19, imagem: "/news-assets/halo.png",              link: "https://www.omelete.com.br/games/halo-campaign-evolved-ganha-data-de-lancamento", categoria: "Xbox", data: "07/06/2026", titulo: "Halo: Campaign Evolved ganha data de lançamento; assista ao trailer" },
  { id: 20, imagem: "/news-assets/ds1.png",               link: "https://www.tecmundo.com.br/voxel/237245-tempo-demora-zerar-dark-souls.htm", categoria: "Jogos", data: "24/04/2022", titulo: "Quanto tempo demora para zerar Dark Souls?" },
]

const TODAS_AS_NOTICIAS = [...PRINCIPAIS, ...OUTRAS]

// Top 5 mais lidas, escolhidas pela colega (lista fixa, usada só quando a API não responde)
const MAIS_LIDAS = [
  "Remake de The Legend of Zelda: Ocarina of Time anunciado para 2026",
  "Minecraft como porta de entrada para a arquitetura",
  "30 anos de Nintendo 64: relembre 8 games nostálgicos para jogar agora",
  "Como derrotar a Malenia em Elden Ring?",
  "Quanto tempo demora para zerar Dark Souls?",
]

const BANNER = {
  imagem: "/news-assets/forza banner.jpg",
  titulo: "Forza Horizon 5 | Já disponível para Xbox Game Pass e PC",
  link: "https://forza.net/pt-BR/",
}

// Card de notícia — visual da colega (card claro, sobe e ganha sombra no hover)
function CardNoticia({ artigo }) {
  const meta = corDaCategoria(artigo.categoria)
  return (
    <a
      href={artigo.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-gray-200 rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <img src={artigo.imagem} alt={artigo.titulo} className="w-full h-40 object-cover" />
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className={`${meta.cor} font-bold uppercase`}>{artigo.categoria}</span>
          <span className="text-gray-600">{artigo.data}</span>
        </div>
        <h3 className={`font-bold text-sm text-gray-900 leading-snug transition-colors duration-200 ${meta.corGrupoHover}`}>
          {artigo.titulo}
        </h3>
      </div>
    </a>
  )
}

export default function Noticias() {
  const [categoriaAtiva, setCategoriaAtiva] = useState(null) // null = mostrar todas
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(8) // quantas notícias mostrar por vez
  const [noticiasDoBanco, setNoticiasDoBanco] = useState(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const resposta = await listarNoticias(FILTROS_DA_API)
        if (!ativo) return
        setNoticiasDoBanco(prepararNoticiasDoBanco(resposta.noticias))
        if (resposta.precisaAtualizar) {
          atualizarNoticias().then(() => listarNoticias(FILTROS_DA_API)).then(atualizada => {
            if (ativo) setNoticiasDoBanco(prepararNoticiasDoBanco(atualizada.noticias))
          }).catch(() => {})
        }
      } catch {
        // Mantém as notícias estáticas se a API ainda não estiver configurada.
      }
    }
    carregar()
    return () => { ativo = false }
  }, [])

  const todasAsNoticias = noticiasDoBanco ?? TODAS_AS_NOTICIAS
  // Sem filtro, a lista principal mostra só jogos. As notícias Geek aparecem ao clicar em "Geek".
  let noticiasFiltradas = todasAsNoticias.filter(n => n.categoria !== 'Geek')
  if (categoriaAtiva) {
    noticiasFiltradas = todasAsNoticias.filter(n => n.categoria === categoriaAtiva)
  }

  const noticiasExibidas = noticiasFiltradas.slice(0, quantidadeVisivel)
  const temMaisNoticias = quantidadeVisivel < noticiasFiltradas.length

  // Mais lidas: a API ainda não conta leituras, então com dados do banco mostramos as 5 mais recentes de jogos
  // (cada uma abre a notícia). Sem a API, continua a lista fixa da colega.
  const maisLidas = noticiasDoBanco
    ? noticiasDoBanco.filter(n => n.categoria !== 'Geek').slice(0, 5)
    : MAIS_LIDAS.map(titulo => ({ titulo }))

  function selecionarCategoria(nomeCategoria) {
    setCategoriaAtiva(categoriaAtiva === nomeCategoria ? null : nomeCategoria)
    setQuantidadeVisivel(8) // volta a mostrar só as 8 primeiras ao trocar de categoria
  }

  function verMaisNoticias() {
    setQuantidadeVisivel(quantidadeVisivel + 8)
  }

  return (
    <main className="max-w-7xl mx-auto px-4">
      {/* Categorias — clicáveis, filtram a lista abaixo */}
      <div className="flex flex-wrap gap-3 md:gap-10 justify-center md:justify-between items-center py-2.5 px-4 bg-dark-secondary/60 rounded-lg mb-8">
        {CATEGORIAS.map(cat => (
          <button
            key={cat.nome}
            onClick={() => selecionarCategoria(cat.nome)}
            className={`font-bold transition-colors duration-300 cursor-pointer ${cat.cor} ${cat.corHover} ${categoriaAtiva === cat.nome ? 'underline underline-offset-4' : ''}`}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      <h2 className="text-3xl text-dark-text-1 text-center font-bold mb-8">
        {categoriaAtiva ? `Notícias de ${categoriaAtiva}` : 'Principais Notícias'}
      </h2>

      {/* Grade principal de notícias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {noticiasExibidas.map(artigo => (
          <CardNoticia key={artigo.id} artigo={artigo} />
        ))}
      </div>

      {/* Aviso quando a categoria escolhida ainda não tem notícias */}
      {noticiasExibidas.length === 0 && (
        <p className="text-center text-dark-text-2 mb-12">
          {categoriaAtiva ? `Nenhuma notícia de ${categoriaAtiva} por enquanto.` : 'Nenhuma notícia por enquanto.'}
        </p>
      )}

      {/* Veja mais — carrega mais 8 notícias da lista filtrada */}
      {temMaisNoticias && (
        <div className="flex justify-center mb-12">
          <button
            onClick={verMaisNoticias}
            className="bg-dark-secondary/80 hover:bg-dark-hover border border-dark-border px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-dark-text-1"
          >
            Veja mais
          </button>
        </div>
      )}

      {/* Banner promocional — fixo, não filtra */}
      {!categoriaAtiva && (
        <section className="max-w-4xl mx-auto mb-12">
          <h2 className="text-xl text-dark-text-1 text-center py-2 font-bold mb-4">{BANNER.titulo}</h2>
          <a href={BANNER.link} target="_blank" rel="noopener noreferrer">
            <div className="w-full h-56 overflow-hidden rounded-xl shadow-2xl hover:scale-[1.02] transition duration-300">
              <img src={BANNER.imagem} alt={BANNER.titulo} className="w-full h-full object-cover" style={{ objectPosition: 'center 65%' }} />
            </div>
          </a>
        </section>
      )}

      {/* Mais lidas — não filtra */}
      {!categoriaAtiva && maisLidas.length > 0 && (
        <section className="max-w-2xl mx-auto mb-12">
          <div className="bg-purple-800 rounded-lg flex items-center px-4 py-2 mb-4">
            <h2 className="text-xl text-dark-text-1 font-bold">Mais lidas</h2>
          </div>
          <ul className="bg-dark-secondary/60 rounded-lg p-4 flex flex-col gap-3">
            {maisLidas.map((noticia, i) => (
              <li key={i} className="flex items-start gap-3 border-b border-dark-border last:border-b-0 pb-3 last:pb-0">
                <div className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center font-bold text-xs bg-purple-500 text-white">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-dark-text-1 text-sm">
                  {noticia.link ? (
                    <a href={noticia.link} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors duration-200">
                      {noticia.titulo}
                    </a>
                  ) : noticia.titulo}
                </h3>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
