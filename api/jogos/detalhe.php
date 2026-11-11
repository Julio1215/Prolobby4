<?php
// GET /api/jogos/detalhe.php?id=12  ou  ?slug=the-witcher-3-wild-hunt  -> { jogo }
// Inclui o QCD "da comunidade": média do custo por hora das reviews que informaram preço e horas.
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_comum.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();

$id = paramIdOpcional('id');
$slug = strtolower(paramTexto('slug', 120));
if ($id === null && !preg_match('/^[a-z0-9-]{1,120}$/', $slug)) {
    responderErro('Informe id ou slug do jogo', 400);
}

if ($id !== null) {
    $linha = consultar($pdo, JOGOS_SELECT . ' WHERE j.id = :id', [':id' => $id])->fetch();
} else {
    $linha = consultar($pdo, JOGOS_SELECT . ' WHERE j.slug = :slug', [':slug' => $slug])->fetch();
}
if (!$linha) {
    responderErro('Jogo não encontrado', 404);
}

$jogo = mapearJogo($linha);

$com = consultar(
    $pdo,
    'SELECT COUNT(*) AS amostras, AVG(preco_pago / horas_jogadas) AS custo
     FROM reviews WHERE jogo_id = :id AND preco_pago IS NOT NULL AND horas_jogadas > 0',
    [':id' => $jogo['id']]
)->fetch();
$jogo['qcdComunidade'] = null;
if ($com && (int) $com['amostras'] > 0) {
    $faixa = calcularQcd((float) $com['custo'], 1);
    $jogo['qcdComunidade'] = [
        'amostras' => (int) $com['amostras'],
        'custoPorHora' => $faixa['custoPorHora'],
        'nivel' => $faixa['nivel'],
        'rotulo' => $faixa['rotulo'],
    ];
}

responderJson(['jogo' => $jogo]);
