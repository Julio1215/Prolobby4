<?php
/*
 * base_conteudo.php — base comum dos módulos de conteúdo do ProLobby:
 * notícias, jogos (guia), reviews, QCD e e-sports.
 *
 * É independente do config.php/utils.php: usa o mesmo api/env.php, o mesmo token
 * de login (coluna usuarios.token) e o mesmo formato de erro {"erro": "mensagem"}.
 */

define('PROLOBBY_CONTEUDO', true);

// Este arquivo é só biblioteca: se alguém abrir a URL dele direto no navegador, nega.
if (PHP_SAPI !== 'cli' && isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(403);
    exit;
}

// ---------------------------------------------------------------------------
// Configuração (env.php)
// ---------------------------------------------------------------------------
if (!is_file(__DIR__ . '/env.php')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['erro' => 'Servidor sem o arquivo api/env.php'], JSON_UNESCAPED_UNICODE);
    exit;
}
require_once __DIR__ . '/env.php';

// Lê uma constante opcional do env.php (ou devolve o valor padrão).
function valorEnv(string $nome, $padrao = null)
{
    return defined($nome) ? constant($nome) : $padrao;
}

// Erros do PHP não podem sujar o JSON: vão para o log do servidor.
ini_set('display_errors', '0');

set_exception_handler(function ($e) {
    error_log('[ProLobby] ' . get_class($e) . ': ' . $e->getMessage() . ' em ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    $mensagem = valorEnv('APP_DEBUG', false) ? $e->getMessage() : 'Erro interno do servidor';
    echo json_encode(['erro' => $mensagem], JSON_UNESCAPED_UNICODE);
});

// ---------------------------------------------------------------------------
// CORS (mesma regra do config.php: FRONTEND_URL + localhost do Vite)
// ---------------------------------------------------------------------------
$origensPermitidas = ['http://localhost:5173'];
if (defined('FRONTEND_URL') && FRONTEND_URL !== '') {
    $origensPermitidas[] = rtrim(FRONTEND_URL, '/');
}
$origemDaRequisicao = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origemDaRequisicao !== '' && in_array($origemDaRequisicao, $origensPermitidas, true)) {
    header('Access-Control-Allow-Origin: ' . $origemDaRequisicao);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
header('X-Content-Type-Options: nosniff');

// ---------------------------------------------------------------------------
// Respostas JSON
// ---------------------------------------------------------------------------
function responderJson($dados, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(
        $dados,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR
    );
    exit;
}

function responderErro(string $mensagem, int $status = 400): void
{
    responderJson(['erro' => $mensagem], $status);
}

// Confere o método HTTP (405 se não for permitido) e devolve o método usado.
function exigirMetodo(array $permitidos): string
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($metodo, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));
        responderErro('Método não permitido', 405);
    }
    return $metodo;
}

function lerCorpoJson(): array
{
    $limite = 200000; // 200 KB: de sobra para reviews e cálculos
    $cru = file_get_contents('php://input', false, null, 0, $limite + 1);
    if ($cru === false || trim($cru) === '') {
        return [];
    }
    if (strlen($cru) > $limite) {
        responderErro('Corpo da requisição grande demais', 413);
    }
    $dados = json_decode($cru, true);
    if (!is_array($dados)) {
        responderErro('JSON inválido', 400);
    }
    return $dados;
}

// ---------------------------------------------------------------------------
// Banco de dados (MariaDB/MySQL via PDO)
// ---------------------------------------------------------------------------
function conectarBanco(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    try {
        $pdo = new PDO(DB_DSN, DB_USER, DB_SENHA, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_FOUND_ROWS => true, // rowCount() = linhas que bateram no WHERE
        ]);
        $pdo->exec("SET NAMES utf8mb4");
    } catch (PDOException $e) {
        error_log('[ProLobby] Falha ao conectar no banco: ' . $e->getMessage());
        responderErro('Não foi possível conectar ao banco de dados', 500);
    }
    return $pdo;
}

// Executa uma consulta com parâmetros (nomeados ou posicionais) e devolve o statement.
function consultar(PDO $pdo, string $sql, array $params = []): PDOStatement
{
    $st = $pdo->prepare($sql);
    foreach ($params as $nome => $valor) {
        if (is_int($valor)) {
            $tipo = PDO::PARAM_INT;
        } elseif ($valor === null) {
            $tipo = PDO::PARAM_NULL;
        } else {
            $tipo = PDO::PARAM_STR;
        }
        $st->bindValue(is_int($nome) ? $nome + 1 : $nome, $valor, $tipo);
    }
    $st->execute();
    return $st;
}

// ---------------------------------------------------------------------------
// Datas (o banco guarda tudo em UTC; a API devolve ISO 8601 com "Z")
// ---------------------------------------------------------------------------
function agoraUtc(): string
{
    return gmdate('Y-m-d H:i:s');
}

function dataIso(?string $utc): ?string
{
    if ($utc === null || $utc === '' || strpos($utc, '0000-00-00') === 0) {
        return null;
    }
    $ts = strtotime($utc . ' UTC');
    return $ts === false ? null : gmdate('Y-m-d\TH:i:s\Z', $ts);
}

// ---------------------------------------------------------------------------
// Texto e parâmetros
// ---------------------------------------------------------------------------
function tamanhoChars(string $t): int
{
    return function_exists('mb_strlen') ? mb_strlen($t, 'UTF-8') : strlen($t);
}

function cortarChars(string $t, int $max): string
{
    return function_exists('mb_substr') ? mb_substr($t, 0, $max, 'UTF-8') : substr($t, 0, $max);
}

function garantirUtf8(string $t): string
{
    if (preg_match('//u', $t)) {
        return $t;
    }
    $limpo = @iconv('UTF-8', 'UTF-8//IGNORE', $t);
    return $limpo === false ? '' : $limpo;
}

// Texto de uma linha: sem caracteres de controle, aparado e limitado a $max caracteres.
function limparTexto($valor, int $max = 255): string
{
    if (is_array($valor) || is_object($valor)) {
        return '';
    }
    $t = garantirUtf8((string) $valor);
    $t = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $t) ?? '';
    return cortarChars(trim($t), $max);
}

// Texto com várias linhas (reviews): mantém \n e \t.
function limparTextoLongo($valor, int $max = 5000): string
{
    if (is_array($valor) || is_object($valor)) {
        return '';
    }
    $t = garantirUtf8((string) $valor);
    $t = str_replace("\r\n", "\n", $t);
    $t = preg_replace('/[\x00-\x08\x0B\x0C\x0D\x0E-\x1F\x7F]/', '', $t) ?? '';
    return cortarChars(trim($t), $max);
}

// Resume com reticências sem cortar palavra no meio.
function resumirTexto(string $t, int $max): string
{
    if (tamanhoChars($t) <= $max) {
        return $t;
    }
    $corte = cortarChars($t, $max - 1);
    $pos = strrpos($corte, ' ');
    if ($pos !== false && $pos > (int) ($max * 0.6)) {
        $corte = substr($corte, 0, $pos);
    }
    return rtrim($corte, " ,.;:-") . '…';
}

// Escapa % e _ para usar em LIKE ... ESCAPE '!'
function escaparLike(string $t): string
{
    return str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $t);
}

function paramTexto(string $nome, int $max = 100): string
{
    $v = $_GET[$nome] ?? '';
    return is_string($v) ? limparTexto($v, $max) : '';
}

// Id numérico opcional na query string: null se não veio; 400 se veio inválido.
function paramIdOpcional(string $nome): ?int
{
    $v = $_GET[$nome] ?? '';
    if ($v === '' || $v === null) {
        return null;
    }
    if (!is_string($v) || !preg_match('/^\d{1,10}$/', $v) || (int) $v < 1) {
        responderErro("Parâmetro '$nome' inválido", 400);
    }
    return (int) $v;
}

// [pagina, limite, deslocamento]
function lerPaginacao(int $limitePadrao = 20, int $limiteMax = 50): array
{
    $pagina = (int) ($_GET['pagina'] ?? 1);
    $limite = (int) ($_GET['limite'] ?? $limitePadrao);
    $pagina = max(1, min($pagina, 10000));
    if ($limite < 1) {
        $limite = $limitePadrao;
    }
    $limite = min($limite, $limiteMax);
    return [$pagina, $limite, ($pagina - 1) * $limite];
}

// Só aceita URLs http/https (evita "javascript:" etc.). Devolve null se inválida.
function urlHttp($url, int $max = 700): ?string
{
    if (!is_string($url)) {
        return null;
    }
    $url = trim($url);
    if ($url === '' || strlen($url) > $max || !preg_match('~^https?://[^\s<>"\']+$~i', $url)) {
        return null;
    }
    return $url;
}

function gerarIdConteudo(string $prefixo): string
{
    return $prefixo . '_' . bin2hex(random_bytes(10));
}

// ---------------------------------------------------------------------------
// Login (mesmo token Bearer do resto da API)
// ---------------------------------------------------------------------------
function lerTokenBearer(): ?string
{
    $cabecalho = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($cabecalho === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $nome => $valor) {
            if (strcasecmp($nome, 'Authorization') === 0) {
                $cabecalho = $valor;
            }
        }
    }
    if (preg_match('/^Bearer\s+(\S+)$/i', trim($cabecalho), $m)) {
        return $m[1];
    }
    return null;
}

// Usuário do token (ou null se não houver login válido).
function usuarioLogado(PDO $pdo): ?array
{
    $token = lerTokenBearer();
    if ($token === null) {
        return null;
    }
    try {
        $st = consultar(
            $pdo,
            'SELECT id, username, display_name, avatar_url FROM usuarios WHERE token = :t AND token_expira > :agora LIMIT 1',
            [':t' => $token, ':agora' => agoraUtc()]
        );
    } catch (Throwable $e) {
        // Tabela usuarios ausente (o login ainda não está neste banco): segue como visitante, sem erro 500
        return null;
    }
    $usuario = $st->fetch();
    return $usuario ?: null;
}

function exigirLogin(PDO $pdo): array
{
    $usuario = usuarioLogado($pdo);
    if ($usuario === null) {
        responderErro('Não autenticado', 401);
    }
    return $usuario;
}

// ---------------------------------------------------------------------------
// Trava + intervalo mínimo entre execuções (coleta de notícias etc.)
// Funciona em hospedagem sem cron: quem chegar primeiro depois do intervalo executa.
// ---------------------------------------------------------------------------
function reivindicarExecucao(PDO $pdo, string $chave, int $intervaloSeg, int $bloqueioSeg): bool
{
    $agora = time();
    consultar($pdo, 'INSERT IGNORE INTO controle_execucao (chave) VALUES (:c)', [':c' => $chave]);
    $st = consultar(
        $pdo,
        'UPDATE controle_execucao SET ultima_execucao = :agora1, bloqueado_ate = :ate
         WHERE chave = :c
           AND (ultima_execucao IS NULL OR ultima_execucao <= :limite)
           AND (bloqueado_ate IS NULL OR bloqueado_ate <= :agora2)',
        [
            ':agora1' => gmdate('Y-m-d H:i:s', $agora),
            ':ate' => gmdate('Y-m-d H:i:s', $agora + $bloqueioSeg),
            ':c' => $chave,
            ':limite' => gmdate('Y-m-d H:i:s', $agora - $intervaloSeg),
            ':agora2' => gmdate('Y-m-d H:i:s', $agora),
        ]
    );
    return $st->rowCount() === 1;
}

function liberarExecucao(PDO $pdo, string $chave): void
{
    consultar($pdo, 'UPDATE controle_execucao SET bloqueado_ate = NULL WHERE chave = :c', [':c' => $chave]);
}

// ---------------------------------------------------------------------------
// QCD — Quanto Custa o Divertimento: custo por hora = preço ÷ horas
// ---------------------------------------------------------------------------
function faixasQcd(): array
{
    return [
        ['nivel' => 'excelente', 'rotulo' => 'Excelente', 'ate' => 1.0],
        ['nivel' => 'muito_bom', 'rotulo' => 'Muito bom', 'ate' => 2.5],
        ['nivel' => 'bom', 'rotulo' => 'Bom', 'ate' => 5.0],
        ['nivel' => 'regular', 'rotulo' => 'Regular', 'ate' => 10.0],
        ['nivel' => 'caro', 'rotulo' => 'Caro', 'ate' => null],
    ];
}

function calcularQcd($preco, $horas): ?array
{
    if ($preco === null || $horas === null || !is_numeric($preco) || !is_numeric($horas)) {
        return null;
    }
    $preco = (float) $preco;
    $horas = (float) $horas;
    if ($horas <= 0 || $preco < 0) {
        return null;
    }
    $custo = round($preco / $horas, 2);
    foreach (faixasQcd() as $faixa) {
        if ($faixa['ate'] === null || $custo <= $faixa['ate']) {
            return ['custoPorHora' => $custo, 'nivel' => $faixa['nivel'], 'rotulo' => $faixa['rotulo']];
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// HTTP de saída (cURL): baixa várias URLs ao mesmo tempo, com limite de tamanho.
// $pedidos: [chave => ['url' =>, 'cabecalhos' => [...], 'etag' =>, 'modificado' =>]]
// Retorna:  [chave => ['codigo' =>, 'corpo' =>, 'erro' => ?string, 'cabecalhos' => [nome => valor]]]
// ---------------------------------------------------------------------------
function httpBaixar(array $pedidos, int $timeoutSeg = 8, int $limiteBytes = 3000000): array
{
    if (!function_exists('curl_init')) {
        $falhas = [];
        foreach ($pedidos as $chave => $p) {
            $falhas[$chave] = ['codigo' => 0, 'corpo' => '', 'erro' => 'Extensão cURL do PHP não está ativa', 'cabecalhos' => []];
        }
        return $falhas;
    }

    // Algumas hospedagens (ex.: InfinityFree) desativam o curl_multi_exec: nesse caso baixa uma fonte de cada vez.
    $usarMulti = function_exists('curl_multi_init') && function_exists('curl_multi_exec');
    $multi = $usarMulti ? curl_multi_init() : null;
    $estados = [];
    $handles = [];
    $verificarSsl = (bool) valorEnv('HTTP_VERIFICAR_SSL', true);

    foreach ($pedidos as $chave => $pedido) {
        $estado = new stdClass();
        $estado->corpo = '';
        $estado->cabecalhos = [];
        $estado->estourou = false;
        $estado->adiada = false;
        $estados[$chave] = $estado;

        $cabecalhos = $pedido['cabecalhos'] ?? [];
        if (!empty($pedido['etag'])) {
            $cabecalhos[] = 'If-None-Match: ' . $pedido['etag'];
        }
        if (!empty($pedido['modificado'])) {
            $cabecalhos[] = 'If-Modified-Since: ' . $pedido['modificado'];
        }

        $ch = curl_init($pedido['url']);
        curl_setopt_array($ch, [
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 4,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $timeoutSeg,
            CURLOPT_ENCODING => '',
            CURLOPT_USERAGENT => 'ProLobbyBot/1.0 (projeto academico; leitor de feeds RSS)',
            CURLOPT_HTTPHEADER => $cabecalhos,
            CURLOPT_SSL_VERIFYPEER => $verificarSsl,
            CURLOPT_SSL_VERIFYHOST => $verificarSsl ? 2 : 0,
            CURLOPT_HEADERFUNCTION => function ($ch, $linha) use ($estado) {
                if (stripos($linha, 'HTTP/') === 0) {
                    $estado->cabecalhos = []; // nova resposta (ex.: depois de um redirecionamento)
                } elseif (strpos($linha, ':') !== false) {
                    [$nome, $valor] = explode(':', $linha, 2);
                    $estado->cabecalhos[strtolower(trim($nome))] = trim($valor);
                }
                return strlen($linha);
            },
            CURLOPT_WRITEFUNCTION => function ($ch, $dados) use ($estado, $limiteBytes) {
                $estado->corpo .= $dados;
                if (strlen($estado->corpo) > $limiteBytes) {
                    $estado->estourou = true;
                    return 0; // aborta o download
                }
                return strlen($dados);
            },
        ]);
        if ($multi !== null) {
            curl_multi_add_handle($multi, $ch);
        }
        $handles[$chave] = $ch;
    }

    $codigosCurl = [];
    if ($multi !== null) {
        do {
            $status = curl_multi_exec($multi, $ativos);
            if ($ativos && curl_multi_select($multi, 0.5) === -1) {
                usleep(50000);
            }
        } while ($ativos && $status === CURLM_OK);

        // No curl_multi o resultado de cada transferência (erro de DNS, timeout, SSL...) só fica disponível
        // depois de ler as mensagens da fila; sem isso curl_errno()/curl_error() voltam vazios.
        while (($info = curl_multi_info_read($multi)) !== false) {
            if ($info['msg'] === CURLMSG_DONE) {
                $codigosCurl[spl_object_id($info['handle'])] = (int) $info['result'];
            }
        }
    } else {
        // Uma de cada vez, com um limite de tempo total para não estourar o tempo máximo do servidor.
        $inicio = microtime(true);
        foreach ($handles as $chave => $ch) {
            if (microtime(true) - $inicio > 25) {
                $estados[$chave]->adiada = true; // fica para a próxima coleta
                continue;
            }
            curl_exec($ch);
            $codigosCurl[spl_object_id($ch)] = curl_errno($ch);
        }
    }

    $resultados = [];
    foreach ($handles as $chave => $ch) {
        $estado = $estados[$chave];
        $erro = null;
        $codigoCurl = $codigosCurl[spl_object_id($ch)] ?? curl_errno($ch);
        if ($codigoCurl !== 0) {
            $erro = curl_error($ch);
            if ($erro === '' || $erro === false) {
                $erro = curl_strerror($codigoCurl);
            }
            if (in_array($codigoCurl, [35, 51, 58, 60, 77], true)) {
                $erro .= ' (problema de certificado SSL: veja HTTP_VERIFICAR_SSL no LEIA-ME)';
            }
        }
        if ($estado->estourou) {
            $erro = 'Resposta grande demais';
        }
        if ($estado->adiada) {
            $erro = 'Adiada para a próxima coleta (pouco tempo disponível no servidor)';
        }
        $resultados[$chave] = [
            'codigo' => (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE),
            'corpo' => $estado->corpo,
            'erro' => $erro,
            'cabecalhos' => $estado->cabecalhos,
        ];
        if ($multi !== null) {
            curl_multi_remove_handle($multi, $ch);
        }
    }
    return $resultados;
}
