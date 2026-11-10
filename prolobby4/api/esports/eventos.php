<?php
// GET /api/esports/eventos.php?jogo=valorant&periodo=em-andamento|proximos|encerrados&pagina=&limite=
//   -> { eventos: [{id, nome, temporada, ano, inicioEm, fimEm, status, liga, vencedorId}], pagina, ... }
// "Evento" = uma edição de campeonato (série da PandaScore). Para filtrar VCT etc. use liga.nome no front.
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_pandascore.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();
$jogo = esportsLerJogo();

$periodo = paramTexto('periodo', 20) ?: 'em-andamento';
// periodo -> [trecho da URL da API, segundos de cache, ordenação]
$mapa = [
    'em-andamento' => ['running', 600, 'begin_at'],
    'proximos' => ['upcoming', 1800, 'begin_at'],
    'encerrados' => ['past', 3600, '-begin_at'],
];
if (!isset($mapa[$periodo])) {
    responderErro('periodo inválido (use em-andamento, proximos ou encerrados)', 400);
}
[$trecho, $ttl, $ordenacao] = $mapa[$periodo];
[$pagina, $limite] = lerPaginacao(20, 50);

$query = ['sort' => $ordenacao, 'page' => ['number' => $pagina, 'size' => $limite]];
$res = esportsConsultar($pdo, "/$jogo/series/$trecho", $query, $ttl, 'esportsMapearSerie', $pagina, $limite);
responderJson(['eventos' => $res['itens']] + $res['meta']);
