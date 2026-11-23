<?php
// GET    /api/reviews/detalhe.php?id=review_xxx          -> { review }
// PUT    /api/reviews/detalhe.php?id=...  (só o autor)   -> { review }   (envie só os campos que mudam)
// DELETE /api/reviews/detalhe.php?id=...  (só o autor)   -> { ok: true }
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_comum.php';

$metodo = exigirMetodo(['GET', 'PUT', 'DELETE']);
$pdo = conectarBanco();

$id = paramTexto('id', 40);
if (!preg_match('/^[A-Za-z0-9_]{3,40}$/', $id)) {
    responderErro('Informe o id da review', 400);
}
$linha = buscarReviewPorId($pdo, $id);
if (!$linha) {
    responderErro('Review não encontrada', 404);
}

if ($metodo === 'GET') {
    $usuarioAtual = usuarioLogado($pdo);
    responderJson(['review' => mapearReviews($pdo, [$linha], $usuarioAtual)[0]]);
}

// PUT e DELETE: só o autor mexe na própria review
$usuario = exigirLogin($pdo);
if ($linha['usuario_id'] === null || (string) $linha['usuario_id'] !== (string) $usuario['id']) {
    responderErro('Você só pode alterar as suas próprias reviews', 403);
}

if ($metodo === 'DELETE') {
    consultar($pdo, 'DELETE FROM reviews WHERE id = :id', [':id' => $id]);
    responderJson(['ok' => true]);
}

$campos = lerCamposReview(lerCorpoJson(), false);
if (!$campos) {
    responderErro('Nada para atualizar', 400);
}
$sets = [];
$params = [':id' => $id, ':atualizado' => agoraUtc()];
foreach ($campos as $coluna => $valor) {
    // os nomes das colunas vêm de lerCamposReview (lista fixa), nunca do usuário
    $sets[] = "$coluna = :$coluna";
    $params[":$coluna"] = $valor === null ? null : (is_float($valor) ? (string) $valor : $valor);
}
consultar($pdo, 'UPDATE reviews SET ' . implode(', ', $sets) . ', atualizado_em = :atualizado WHERE id = :id', $params);

$linha = buscarReviewPorId($pdo, $id);
responderJson(['review' => mapearReviews($pdo, [$linha], $usuario)[0]]);
