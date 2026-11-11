// src/services/conteudoApi.js
// Funções que conversam com os módulos de conteúdo da API PHP:
// notícias, jogos (guia), reviews, QCD e e-sports.
// Todas são assíncronas: use com await (ou .then) e trate o erro com try/catch (ou .catch).

const URL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Monta "?a=1&b=2" ignorando valores vazios.
function montarQuery(parametros) {
  const busca = new URLSearchParams();
  Object.keys(parametros || {}).forEach((chave) => {
    const valor = parametros[chave];
    if (valor !== undefined && valor !== null && valor !== '') {
      busca.append(chave, valor);
    }
  });
  const texto = busca.toString();
  return texto ? '?' + texto : '';
}

// Faz a chamada, manda o token (se existir) e devolve o JSON.
// Se o servidor responder com erro, lança um Error com a mensagem da API.
async function chamarApi(caminho, opcoes = {}) {
  const cabecalhos = {};
  const token = localStorage.getItem('hg_token');
  // O login atual é local (token "local-ID"): a API não conhece esse token, então não enviamos.
  if (token && !token.startsWith('local-')) {
    cabecalhos.Authorization = 'Bearer ' + token;
  }
  if (opcoes.body !== undefined) {
    cabecalhos['Content-Type'] = 'application/json';
  }

  const resposta = await fetch(URL_BASE + caminho, {
    method: opcoes.method || 'GET',
    headers: cabecalhos,
    body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
  });

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (erro) {
    dados = null;
  }
  if (!resposta.ok) {
    throw new Error((dados && dados.erro) || 'Erro ao falar com o servidor (' + resposta.status + ')');
  }
  return dados;
}

// ---------------------------------------------------------------------------
// NOTÍCIAS
// ---------------------------------------------------------------------------

// params: { pagina, limite, fonte (id), categoria ('games' | 'esports'), idioma ('pt' | 'en'),
//           busca, ordem ('recentes' | 'antigas') }
// Devolve: { noticias, hasMore, total, precisaAtualizar, atualizadoEm }
export function listarNoticias(params) {
  return chamarApi('/noticias/index.php' + montarQuery(params));
}

// Devolve: { fontes: [{ id, nome, siteUrl, idioma, categoria, totalNoticias, ultimaColeta, ok }] }
export function listarFontesNoticias() {
  return chamarApi('/noticias/fontes.php');
}

// Pede para o servidor buscar notícias novas (ele só executa se já passou o intervalo mínimo).
// Chame quando listarNoticias devolver precisaAtualizar = true e, se vier novas > 0, recarregue a lista.
// Devolve: { executou, novas }
export function atualizarNoticias() {
  return chamarApi('/noticias/atualizar.php', { method: 'POST', body: {} });
}

// ---------------------------------------------------------------------------
// JOGOS (Guia de Jogos)
// ---------------------------------------------------------------------------

// params: { pagina, limite, busca, genero, plataforma, destaque (1), ordem }
// ordem: 'titulo' | 'recentes' | 'antigos' | 'nota' | 'qcd' | 'preco'
// Devolve: { jogos, hasMore, total }
export function listarJogos(params) {
  return chamarApi('/jogos/index.php' + montarQuery(params));
}

// Aceita o id (número) ou o slug (texto, ex.: 'elden-ring'). Devolve: { jogo }
export function buscarJogo(idOuSlug) {
  const parametro = typeof idOuSlug === 'number' || /^\d+$/.test(String(idOuSlug)) ? 'id' : 'slug';
  return chamarApi('/jogos/detalhe.php' + montarQuery({ [parametro]: idOuSlug }));
}

// Devolve: { generos: [{ nome, total }], plataformas: [{ nome, total }] }
export function listarFiltrosJogos() {
  return chamarApi('/jogos/filtros.php');
}

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------

// params: { jogoId, minhas (1, exige login), ordem ('recentes' | 'antigas' | 'melhores' | 'piores'), pagina, limite }
// Devolve: { reviews, hasMore, total, resumo? }
export function listarReviews(params) {
  return chamarApi('/reviews/index.php' + montarQuery(params));
}

export function buscarReview(id) {
  return chamarApi('/reviews/detalhe.php' + montarQuery({ id }));
}

// dados: { jogoId ou jogoNome, titulo, texto, nota (0 a 10), horasJogadas?, precoPago?, plataforma?, recomenda? }
// Exige login. Devolve: { review }
export function criarReview(dados) {
  return chamarApi('/reviews/index.php', { method: 'POST', body: dados });
}

// Só o autor edita. Mande apenas os campos que mudam. Devolve: { review }
export function atualizarReview(id, dados) {
  return chamarApi('/reviews/detalhe.php' + montarQuery({ id }), { method: 'PUT', body: dados });
}

// Só o autor apaga. Devolve: { ok: true }
export function apagarReview(id) {
  return chamarApi('/reviews/detalhe.php' + montarQuery({ id }), { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// QCD (Quanto Custa o Divertimento = preço ÷ horas)
// ---------------------------------------------------------------------------

// params: { ordem ('melhor' | 'pior'), genero, limite }
// Devolve: { ranking: [{ posicao, ...jogo, custoPorHora, qcd }], ordem, faixas, formula }
export function buscarRankingQcd(params) {
  return chamarApi('/qcd/ranking.php' + montarQuery(params));
}

// dados: { preco, horas, jogoId? ou jogoNome?, nota?, score? }
// Qualquer pessoa calcula; só quem está logado tem o cálculo salvo no histórico.
// Devolve: { calculo: { custoPorHora, nivel, rotulo, ... }, salvo }
export function calcularQcd(dados) {
  return chamarApi('/qcd/calculos.php', { method: 'POST', body: dados });
}

// Exige login. Devolve: { calculos, hasMore }
export function listarCalculosQcd(params) {
  return chamarApi('/qcd/calculos.php' + montarQuery(params));
}

export function apagarCalculoQcd(id) {
  return chamarApi('/qcd/calculos.php' + montarQuery({ id }), { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// E-SPORTS (dados da API externa PandaScore, com cache no banco)
// jogo: 'valorant' (padrão) | 'csgo' | 'lol' | 'dota2'
// Todas devolvem também: { pagina, porPagina, total, hasMore, desatualizado, atualizadoEm }
// ---------------------------------------------------------------------------

// params: { jogo, status ('proximas' | 'ao-vivo' | 'encerradas'), timeId, torneioId, serieId, ligaId,
//           definidas (1 = só partidas com os dois times definidos), pagina, limite }
// Devolve: { partidas, ... }
export function listarPartidasEsports(params) {
  return chamarApi('/esports/partidas.php' + montarQuery(params));
}

// params: { jogo, busca, pagina, limite }. Devolve: { times, ... }
export function listarTimesEsports(params) {
  return chamarApi('/esports/times.php' + montarQuery(params));
}

// params: { jogo, periodo ('em-andamento' | 'proximos' | 'encerrados'), pagina, limite }
// Devolve: { eventos, ... }
export function listarEventosEsports(params) {
  return chamarApi('/esports/eventos.php' + montarQuery(params));
}
