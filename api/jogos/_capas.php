<?php
// Busca de capas na IGDB (a base de dados de jogos da Twitch) para os jogos que ainda estão sem imagem.
// É o caso dos jogos que não estão na Steam (Nintendo, PlayStation, Riot...): a IGDB tem a capa de todas as plataformas.
//
// Precisa de duas chaves no api/env.php (grátis, criadas em https://dev.twitch.tv/console):
//   define('IGDB_CLIENT_ID', '...');
//   define('IGDB_CLIENT_SECRET', '...');
// Sem as chaves nada acontece: os jogos continuam com o ícone no lugar da capa.
if (!defined('PROLOBBY_CONTEUDO')) {
    http_response_code(403);
    exit;
}

function igdbConfigurada(): bool
{
    return (string) valorEnv('IGDB_CLIENT_ID', '') !== '' && (string) valorEnv('IGDB_CLIENT_SECRET', '') !== '';
}

// Envia um POST com cURL. Devolve ['codigo' => HTTP, 'corpo' => texto, 'erro' => ?string].
function igdbEnviar(string $url, array $cabecalhos, string $corpo): array
{
    if (!function_exists('curl_init')) {
        return ['codigo' => 0, 'corpo' => '', 'erro' => 'Extensão cURL do PHP não está ativa'];
    }
    $verificarSsl = (bool) valorEnv('HTTP_VERIFICAR_SSL', true);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $corpo,
        CURLOPT_HTTPHEADER => $cabecalhos,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => $verificarSsl,
        CURLOPT_SSL_VERIFYHOST => $verificarSsl ? 2 : 0,
        CURLOPT_USERAGENT => 'ProLobby/1.0',
    ]);
    $resposta = curl_exec($ch);
    $erro = $resposta === false ? curl_error($ch) : null;
    $codigo = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    unset($ch);
    return ['codigo' => $codigo, 'corpo' => is_string($resposta) ? $resposta : '', 'erro' => $erro];
}

// Pede à Twitch o token de acesso. Devolve [token ou null, mensagem de erro ou null].
function igdbObterToken(): array
{
    $url = (string) valorEnv('IGDB_TOKEN_URL', 'https://id.twitch.tv/oauth2/token');
    $corpo = http_build_query([
        'client_id' => (string) valorEnv('IGDB_CLIENT_ID', ''),
        'client_secret' => (string) valorEnv('IGDB_CLIENT_SECRET', ''),
        'grant_type' => 'client_credentials',
    ]);
    $r = igdbEnviar($url, ['Content-Type: application/x-www-form-urlencoded'], $corpo);
    if ($r['erro'] !== null) {
        return [null, 'Não foi possível falar com a Twitch: ' . $r['erro']];
    }
    $dados = json_decode($r['corpo'], true);
    if ($r['codigo'] !== 200 || !is_array($dados) || empty($dados['access_token'])) {
        return [null, 'A Twitch recusou as chaves (HTTP ' . $r['codigo'] . '). Confira IGDB_CLIENT_ID e IGDB_CLIENT_SECRET no env.php'];
    }
    return [(string) $dados['access_token'], null];
}

// Deixa o nome só com letras e números minúsculos, sem acento e sem o que vem entre parênteses.
// Assim "God of War (2018)" e "God of War" ficam iguais na comparação.
function normalizarNomeDeJogo(string $nome): string
{
    $nome = preg_replace('/\s*\([^)]*\)/u', '', $nome) ?? $nome;
    $nome = function_exists('mb_strtolower') ? mb_strtolower($nome, 'UTF-8') : strtolower($nome);
    $nome = strtr($nome, [
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'ç' => 'c', 'ñ' => 'n',
    ]);
    return preg_replace('/[^a-z0-9]+/', '', $nome) ?? '';
}

// Entre os resultados da IGDB, escolhe a capa do jogo que tem EXATAMENTE o mesmo nome
// (se tiver mais de um, o mais avaliado). Sem nome igual, devolve null: é melhor ficar sem capa do que com a errada.
function escolherCapaDaIgdb(string $titulo, array $resultados): ?string
{
    $alvo = normalizarNomeDeJogo($titulo);
    if ($alvo === '') {
        return null;
    }
    $melhor = null;
    $melhorVotos = -1;
    foreach ($resultados as $jogo) {
        if (!is_array($jogo)) {
            continue;
        }
        $imagem = $jogo['cover']['image_id'] ?? null;
        $nome = $jogo['name'] ?? null;
        if (!is_string($imagem) || !preg_match('/^[a-z0-9]+$/i', $imagem) || !is_string($nome)) {
            continue;
        }
        if (normalizarNomeDeJogo($nome) !== $alvo) {
            continue;
        }
        $votos = (int) ($jogo['total_rating_count'] ?? 0);
        if ($votos > $melhorVotos) {
            $melhor = $imagem;
            $melhorVotos = $votos;
        }
    }
    return $melhor === null ? null : 'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/' . $melhor . '.jpg';
}

// Procura um jogo pelo título. Devolve [endereço da capa ou null, mensagem de erro ou null].
function igdbBuscarCapa(string $titulo, string $token): array
{
    $base = rtrim((string) valorEnv('IGDB_API_URL', 'https://api.igdb.com/v4'), '/');
    $pesquisa = trim(str_replace(['"', '\\', ';'], ' ', $titulo));
    $consulta = 'search "' . $pesquisa . '"; fields name,total_rating_count,cover.image_id; limit 10;';
    $r = igdbEnviar($base . '/games', [
        'Client-ID: ' . (string) valorEnv('IGDB_CLIENT_ID', ''),
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
        'Content-Type: text/plain',
    ], $consulta);
    if ($r['erro'] !== null) {
        return [null, 'Falha na conexão com a IGDB: ' . $r['erro']];
    }
    if ($r['codigo'] === 429) {
        return [null, 'A IGDB pediu para esperar (muitos pedidos)'];
    }
    $dados = json_decode($r['corpo'], true);
    if ($r['codigo'] !== 200 || !is_array($dados)) {
        return [null, 'A IGDB respondeu HTTP ' . $r['codigo']];
    }
    return [escolherCapaDaIgdb($titulo, $dados), null];
}

// Procura a capa dos jogos que estão sem imagem (sem capa_url e sem steam_appid) e grava em jogos.capa_url.
// Tenta no máximo $maximo jogos por vez. Devolve ['tentadas', 'atualizadas', 'detalhe' => [slug => resultado], 'erro'].
function buscarCapasFaltando(PDO $pdo, int $maximo = 6): array
{
    $st = consultar(
        $pdo,
        "SELECT id, slug, titulo FROM jogos
          WHERE (capa_url IS NULL OR capa_url = '') AND (steam_appid IS NULL OR steam_appid = 0)
          ORDER BY id LIMIT " . max(1, $maximo)
    );
    $pendentes = $st->fetchAll(PDO::FETCH_ASSOC);
    $resultado = ['tentadas' => 0, 'atualizadas' => 0, 'detalhe' => [], 'erro' => null];
    if (!$pendentes) {
        return $resultado;
    }

    [$token, $erroToken] = igdbObterToken();
    if ($token === null) {
        $resultado['erro'] = $erroToken;
        return $resultado;
    }

    foreach ($pendentes as $posicao => $jogo) {
        if ($posicao > 0) {
            usleep(300000); // a IGDB aceita 4 pedidos por segundo
        }
        [$url, $erro] = igdbBuscarCapa((string) $jogo['titulo'], $token);
        $resultado['tentadas']++;
        $resultado['detalhe'][$jogo['slug']] = $url ?? ($erro ?? 'capa não encontrada');
        if ($url !== null) {
            consultar(
                $pdo,
                "UPDATE jogos SET capa_url = :url WHERE id = :id AND (capa_url IS NULL OR capa_url = '')",
                [':url' => $url, ':id' => (int) $jogo['id']]
            );
            $resultado['atualizadas']++;
        }
    }
    return $resultado;
}
