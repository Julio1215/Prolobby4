<?php
// POST /api/noticias/atualizar.php
//   Coleta as notícias novas dos feeds. Quem chamar depois do intervalo mínimo
//   (NOTICIAS_INTERVALO_MIN, padrão 30 min) executa; as outras chamadas só recebem { executou: false }.
//   Para forçar (ignora intervalo e pausas): corpo { "forcar": true, "chave": "<ADMIN_CHAVE do env.php>" }
//   -> { executou, novas }   (com a chave de admin vem também o detalhe por fonte)
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_coletor.php';

exigirMetodo(['POST']);
$pdo = conectarBanco();
$corpo = lerCorpoJson();

$forcar = !empty($corpo['forcar']);
if ($forcar) {
    $chaveAdmin = (string) valorEnv('ADMIN_CHAVE', '');
    $enviada = is_string($corpo['chave'] ?? null) ? $corpo['chave'] : '';
    if ($chaveAdmin === '' || !hash_equals($chaveAdmin, $enviada)) {
        responderErro('Chave de administrador inválida', 403);
    }
}

$intervalo = $forcar ? 0 : max(1, (int) valorEnv('NOTICIAS_INTERVALO_MIN', 30)) * 60;
if (!reivindicarExecucao($pdo, 'noticias', $intervalo, 120)) {
    responderJson(['executou' => false, 'motivo' => 'atualizado_recentemente_ou_em_andamento']);
}

$falha = null;
try {
    $resultado = coletarNoticias($pdo, $forcar);
} catch (Throwable $e) {
    $falha = $e;
} finally {
    liberarExecucao($pdo, 'noticias');
}

if ($falha !== null) {
    // Em vez de erro 500, guarda o motivo em fontes_noticias.ultimo_erro (dá para ver no phpMyAdmin)
    error_log('[ProLobby] coleta de notícias: ' . get_class($falha) . ': ' . $falha->getMessage());
    $motivo = cortarChars(get_class($falha) . ': ' . $falha->getMessage(), 250);
    consultar($pdo, 'UPDATE fontes_noticias SET ultimo_erro = :e WHERE ativa = 1', [':e' => $motivo]);
    $resposta = ['executou' => true, 'novas' => 0, 'erro' => 'falha_na_coleta'];
    if (valorEnv('APP_DEBUG', false)) {
        $resposta['detalhe'] = $motivo;
    }
    responderJson($resposta);
}

$resposta = ['executou' => true, 'novas' => $resultado['novas']];
if ($forcar) {
    $resposta['removidas'] = $resultado['removidas'];
    $resposta['fontes'] = $resultado['fontes'];
}
responderJson($resposta);
