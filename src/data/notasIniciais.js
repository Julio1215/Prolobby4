// Notas iniciais dos jogos do catálogo.
//
// Servem enquanto o jogo ainda não tem reviews dos usuários do site: aí as telas de Reviews e QCD mostram
// a nota da crítica. Quando aparecerem reviews, a média dos usuários passa a valer (como antes).
//
// Valor = Metascore do Metacritic (0 a 100). Em estrelas (0 a 5) fica metacritic ÷ 20 (ex.: 96 → 4.8).
// Para incluir um jogo novo, acrescente uma linha com o "slug" dele (o mesmo da tabela jogos).
export const NOTAS_INICIAIS = {
  'the-witcher-3-wild-hunt': 93,
  'elden-ring': 96,
  'baldurs-gate-3': 96,
  'hades': 93,
  'hollow-knight': 90,
  'celeste': 92,
  'stardew-valley': 89,
  'red-dead-redemption-2': 97,
  'grand-theft-auto-v': 97,
  'god-of-war-2018': 94,
  'zelda-breath-of-the-wild': 97,
  'super-mario-odyssey': 97,
  'portal-2': 95,
  'cyberpunk-2077': 86,
  'resident-evil-4-remake': 93,
  'doom-eternal': 88,
  'sekiro-shadows-die-twice': 90,
  'disco-elysium': 91,
  'undertale': 92,
  'it-takes-two': 88,
  'persona-5-royal': 95,
  'clair-obscur-expedition-33': 92,
  'counter-strike-2': 82,
  'valorant': 80,
  'league-of-legends': 78,
  'dota-2': 90,
}

// Notas de um jogo para os cards e as telas de detalhe.
//   rating: estrelas (0 a 5). Média dos reviews dos usuários do site; se ainda não houver, a nota inicial da crítica.
//   metacritic: nota da crítica (0 a 100), quando existir.
// Sem nenhuma das duas, rating vem null e a tela mostra "—".
export function notasDoJogo(jogo) {
  const metacritic = NOTAS_INICIAIS[jogo.slug] ?? null
  const dosUsuarios = jogo.notaMedia ? jogo.notaMedia / 2 : null
  const dosCriticos = metacritic ? Math.round(metacritic / 2) / 10 : null
  return { rating: dosUsuarios ?? dosCriticos, metacritic }
}
