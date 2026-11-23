<?php
// GET /api/esports/times.php?jogo=valorant&busca=&pagina=&limite=
//   -> { times: [{id, nome, sigla, logoUrl, pais, slug, jogadores: [...]}], pagina, porPagina, total, hasMore, ... }
// Para ver os próximos jogos de um time use /api/esports/partidas.php?timeId=<id>&status=proximas
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_pandascore.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();
$jogo = esportsLerJogo();
[$pagina, $limite] = lerPaginacao(20, 50);

$query = ['sort' => 'name', 'page' => ['number' => $pagina, 'size' => $limite]];
$busca = paramTexto('busca', 40);
if (tamanhoChars($busca) >= 2) {
    $query['search'] = ['name' => $busca];
}

// times mudam pouco: cache de 6 horas
$res = esportsConsultar($pdo, "/$jogo/teams", $query, 21600, 'esportsMapearTime', $pagina, $limite);
responderJson(['times' => $res['itens']] + $res['meta']);
