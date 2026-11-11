<?php
// DIAGNÓSTICO TEMPORÁRIO da API do ProLobby.
// Abra: /api/diagnostico.php?chave=pl-diag-7f3a   e copie o resultado.
// IMPORTANTE: apague este arquivo do servidor depois de usar.
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');

if (($_GET['chave'] ?? '') !== 'pl-diag-7f3a') {
    http_response_code(403);
    echo json_encode(['erro' => 'Chave inválida']);
    exit;
}

$r = ['php' => PHP_VERSION, 'servidor' => PHP_SAPI];

// 1) extensões e funções que a coleta de notícias usa
foreach (['curl', 'simplexml', 'dom', 'mbstring', 'pdo_mysql', 'json', 'openssl'] as $e) {
    $r['extensoes'][$e] = extension_loaded($e);
}
foreach (['curl_init', 'curl_multi_init', 'simplexml_load_string', 'mb_substr', 'set_time_limit'] as $f) {
    $r['funcoes'][$f] = function_exists($f);
}

// 2) arquivos da API (tamanho e impressão digital, para saber se é a versão certa)
foreach (['env.php', 'base_conteudo.php', 'noticias/index.php', 'noticias/_coletor.php', 'noticias/atualizar.php'] as $a) {
    $c = __DIR__ . '/' . $a;
    $r['arquivos'][$a] = is_file($c) ? ['bytes' => filesize($c), 'md5' => substr(md5_file($c), 0, 10)] : 'NÃO EXISTE';
}

// 3) carrega a base e o coletor dentro de try/catch (erro de sintaxe também é capturado)
function passo(array &$r, string $nome, callable $fn): void
{
    try {
        $r[$nome] = $fn();
    } catch (Throwable $e) {
        $r[$nome] = 'ERRO ' . get_class($e) . ': ' . $e->getMessage() . ' (linha ' . $e->getLine() . ' de ' . basename($e->getFile()) . ')';
    }
}
passo($r, 'carregou_base', function () { require_once __DIR__ . '/base_conteudo.php'; return 'ok'; });
passo($r, 'carregou_coletor', function () { require_once __DIR__ . '/noticias/_coletor.php'; return 'ok'; });

$pdo = null;
passo($r, 'banco', function () use (&$pdo) {
    // conexão feita aqui (e não por conectarBanco) para o erro verdadeiro aparecer no resultado
    $pdo = new PDO(DB_DSN, DB_USER, DB_SENHA, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $pdo->exec('SET NAMES utf8mb4');
    return 'conectou; versão ' . $pdo->query('SELECT VERSION()')->fetchColumn();
});

if ($pdo instanceof PDO) {
    foreach (['noticias', 'fontes_noticias', 'jogos', 'reviews', 'controle_execucao', 'limite_uso', 'qcd_calculos', 'cache_externo', 'usuarios'] as $t) {
        passo($r, 'tabela_' . $t, function () use ($pdo, $t) { return (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn() . ' linhas'; });
    }
    passo($r, 'controle_execucao', function () use ($pdo) { return $pdo->query('SELECT * FROM controle_execucao')->fetchAll(PDO::FETCH_ASSOC); });
    passo($r, 'fontes', function () use ($pdo) {
        return $pdo->query('SELECT nome, falhas_seguidas, proxima_tentativa_em, SUBSTRING(ultimo_erro, 1, 160) AS ultimo_erro FROM fontes_noticias WHERE ativa = 1')->fetchAll(PDO::FETCH_ASSOC);
    });
    if (function_exists('estadoColetaNoticias')) {
        passo($r, 'estadoColetaNoticias', function () use ($pdo) { return estadoColetaNoticias($pdo); });
    }
    passo($r, 'consulta_da_lista', function () use ($pdo) {
        return $pdo->query('SELECT COUNT(*) FROM noticias n JOIN fontes_noticias f ON f.id = n.fonte_id WHERE f.ativa = 1')->fetchColumn() . ' notícias visíveis';
    });

    // 4) teste de saída para a internet (a coleta precisa baixar os feeds)
    passo($r, 'internet', function () use ($pdo) {
        if (!function_exists('curl_init')) {
            return 'cURL indisponível';
        }
        $url = $pdo->query('SELECT feed_url FROM fontes_noticias WHERE ativa = 1 ORDER BY id LIMIT 1')->fetchColumn();
        if (!$url) {
            return 'sem fonte ativa';
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_FOLLOWLOCATION => true, CURLOPT_USERAGENT => 'ProLobbyDiagnostico/1.0']);
        $t0 = microtime(true);
        $corpo = curl_exec($ch);
        $info = ['url' => $url, 'http' => curl_getinfo($ch, CURLINFO_HTTP_CODE), 'ms' => (int) ((microtime(true) - $t0) * 1000), 'bytes' => is_string($corpo) ? strlen($corpo) : 0];
        if ($corpo === false) {
            $info['erro_curl'] = curl_errno($ch) . ': ' . curl_error($ch);
        }
        return $info;
    });
}

echo json_encode($r, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_PARTIAL_OUTPUT_ON_ERROR);
