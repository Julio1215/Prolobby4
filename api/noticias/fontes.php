<?php
// GET /api/noticias/fontes.php -> { fontes: [{id, nome, siteUrl, idioma, categoria, totalNoticias, ultimaColeta, ok}] }
// Para montar o filtro por fonte na tela de notícias.
require_once __DIR__ . '/../base_conteudo.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();

$linhas = consultar(
    $pdo,
    'SELECT f.id, f.nome, f.site_url, f.idioma, f.categoria, f.ultima_coleta, f.falhas_seguidas,
            (SELECT COUNT(*) FROM noticias n WHERE n.fonte_id = f.id) AS total
     FROM fontes_noticias f WHERE f.ativa = 1 ORDER BY f.nome'
)->fetchAll();

$fontes = [];
foreach ($linhas as $l) {
    $fontes[] = [
        'id' => (int) $l['id'],
        'nome' => $l['nome'],
        'siteUrl' => $l['site_url'],
        'idioma' => $l['idioma'],
        'categoria' => $l['categoria'],
        'totalNoticias' => (int) $l['total'],
        'ultimaColeta' => dataIso($l['ultima_coleta']),
        'ok' => (int) $l['falhas_seguidas'] === 0,
    ];
}
responderJson(['fontes' => $fontes]);
