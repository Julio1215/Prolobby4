<?php
// GET /api/qcd/ranking.php?ordem=melhor|pior&genero=&limite=10
//   -> { ranking: [{posicao, ...jogo, custoPorHora, qcd}], ordem, faixas, formula }
// Ranking do catálogo pelo custo por hora (preço ÷ horas da campanha). Jogos grátis ou sem horas ficam de fora.
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/../jogos/_comum.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();

$limite = (int) ($_GET['limite'] ?? 10);
$limite = max(1, min($limite, 50));
$pior = paramTexto('ordem', 10) === 'pior';
$direcao = $pior ? 'DESC' : 'ASC';

$onde = 'j.preco_atual > 0 AND j.horas_principal > 0';
$params = [];
$genero = paramTexto('genero', 40);
if ($genero !== '') {
    $onde .= ' AND j.genero = :genero';
    $params[':genero'] = $genero;
}
$params[':lim'] = $limite;

$linhas = consultar(
    $pdo,
    JOGOS_SELECT . " WHERE $onde ORDER BY (j.preco_atual / j.horas_principal) $direcao, j.titulo ASC LIMIT :lim",
    $params
)->fetchAll();

$ranking = [];
foreach ($linhas as $i => $linha) {
    $ranking[] = ['posicao' => $i + 1] + mapearJogo($linha);
}

responderJson([
    'ranking' => $ranking,
    'ordem' => $pior ? 'pior' : 'melhor',
    'faixas' => faixasQcd(),
    'formula' => 'custoPorHora = preço ÷ horas da campanha (em R$ por hora)',
]);
