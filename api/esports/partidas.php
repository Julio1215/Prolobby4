<?php
// GET /api/esports/partidas.php
//   ?jogo=valorant|csgo|lol|dota2 (padrão valorant)  &status=proximas|ao-vivo|encerradas (padrão proximas)
//   &timeId=&torneioId=&serieId=&ligaId=  &definidas=1 (só partidas com os dois times definidos)
//   &pagina=&limite=
//   -> { partidas: [...], pagina, porPagina, total, hasMore, desatualizado, atualizadoEm }
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_pandascore.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();
$jogo = esportsLerJogo();

$status = paramTexto('status', 20) ?: 'proximas';
// status -> [trecho da URL da API, segundos de cache, ordenação]
$mapa = [
    'proximas' => ['upcoming', 300, 'scheduled_at'],
    'ao-vivo' => ['running', 60, 'scheduled_at'],
    'encerradas' => ['past', 900, '-scheduled_at'],
];
if (!isset($mapa[$status])) {
    responderErro('status inválido (use proximas, ao-vivo ou encerradas)', 400);
}
[$trecho, $ttl, $ordenacao] = $mapa[$status];
[$pagina, $limite] = lerPaginacao(20, 50);

$filtros = [];
foreach (['timeId' => 'opponent_id', 'torneioId' => 'tournament_id', 'serieId' => 'serie_id', 'ligaId' => 'league_id'] as $param => $campo) {
    $id = paramIdOpcional($param);
    if ($id !== null) {
        $filtros[$campo] = $id;
    }
}
if (paramTexto('definidas', 1) === '1') {
    $filtros['opponents_filled'] = 'true';
}

$query = ['sort' => $ordenacao, 'page' => ['number' => $pagina, 'size' => $limite]];
if ($filtros) {
    $query['filter'] = $filtros;
}

$res = esportsConsultar($pdo, "/$jogo/matches/$trecho", $query, $ttl, 'esportsMapearPartida', $pagina, $limite);
responderJson(['partidas' => $res['itens']] + $res['meta']);
