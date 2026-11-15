<?php
// POST /api/jogos/buscar-capas.php
//   Procura na IGDB a capa dos jogos que estão sem imagem (os que não estão na Steam)
//   e guarda o endereço em jogos.capa_url. Precisa das chaves IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no env.php.
//   Só executa depois do intervalo mínimo (CAPAS_INTERVALO_HORAS, padrão 12 h); as outras chamadas
//   só recebem { executou: false }.
//   Para forçar (ignora o intervalo): corpo { "forcar": true, "chave": "<ADMIN_CHAVE do env.php>" }
//   -> { executou, configurada, tentadas, atualizadas }   (com a chave de admin vem também o detalhe por jogo)
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_capas.php';

exigirMetodo(['POST']);

// Sem as chaves da IGDB não há o que fazer (e nem precisa abrir o banco).
if (!igdbConfigurada()) {
    responderJson(['executou' => false, 'configurada' => false]);
}

$pdo = conectarBanco();
$corpo = lerCorpoJson();

$forcar = !empty($corpo['forcar']);
$ehAdmin = false;
if ($forcar) {
    $chaveAdmin = (string) valorEnv('ADMIN_CHAVE', '');
    $enviada = is_string($corpo['chave'] ?? null) ? $corpo['chave'] : '';
    if ($chaveAdmin === '' || !hash_equals($chaveAdmin, $enviada)) {
        responderErro('Chave de administrador inválida', 403);
    }
    $ehAdmin = true;
}

$intervalo = $forcar ? 0 : max(1, (int) valorEnv('CAPAS_INTERVALO_HORAS', 12)) * 3600;
if (!reivindicarExecucao($pdo, 'capas', $intervalo, 120)) {
    responderJson(['executou' => false, 'configurada' => true, 'motivo' => 'buscado_recentemente_ou_em_andamento']);
}

$falha = null;
try {
    $resultado = buscarCapasFaltando($pdo);
} catch (Throwable $e) {
    $falha = $e;
} finally {
    liberarExecucao($pdo, 'capas');
}

if ($falha !== null) {
    error_log('[ProLobby] busca de capas: ' . get_class($falha) . ': ' . $falha->getMessage());
    $resposta = ['executou' => true, 'configurada' => true, 'tentadas' => 0, 'atualizadas' => 0, 'erro' => 'falha_na_busca'];
    if (valorEnv('APP_DEBUG', false)) {
        $resposta['detalhe'] = cortarChars(get_class($falha) . ': ' . $falha->getMessage(), 250);
    }
    responderJson($resposta);
}

$resposta = [
    'executou' => true,
    'configurada' => true,
    'tentadas' => $resultado['tentadas'],
    'atualizadas' => $resultado['atualizadas'],
];
if ($ehAdmin || valorEnv('APP_DEBUG', false)) {
    $resposta['detalhe'] = $resultado['detalhe'];
    $resposta['erro'] = $resultado['erro'];
}
responderJson($resposta);
