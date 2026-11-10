<?php
// Funções compartilhadas do módulo de reviews.
if (!defined('PROLOBBY_CONTEUDO')) {
    http_response_code(403);
    exit;
}
require_once __DIR__ . '/../jogos/_comum.php';

const REVIEWS_SELECT = 'SELECT r.id, r.jogo_id, r.jogo_nome, r.usuario_id, r.autor_nome, r.origem, r.titulo, r.texto,
        r.nota, r.horas_jogadas, r.preco_pago, r.plataforma, r.recomenda, r.criado_em, r.atualizado_em,
        j.slug AS jogo_slug, j.capa_url AS capa_url, j.steam_appid AS steam_appid
    FROM reviews r
    LEFT JOIN jogos j ON j.id = r.jogo_id';

// Linhas do banco -> objetos camelCase. Os autores vêm de uma consulta separada à tabela
// usuarios (em vez de JOIN), então não importa a collation daquela tabela.
function mapearReviews(PDO $pdo, array $linhas, ?array $usuarioAtual): array
{
    $ids = [];
    foreach ($linhas as $l) {
        if ($l['usuario_id'] !== null) {
            $ids[(string) $l['usuario_id']] = true;
        }
    }
    $autores = [];
    $autoresIndisponiveis = false;
    if ($ids) {
        try {
            $lista = array_map('strval', array_keys($ids));
            $marcas = implode(',', array_fill(0, count($lista), '?'));
            $sql = "SELECT id, username, display_name, avatar_url FROM usuarios WHERE id IN ($marcas)";
            foreach (consultar($pdo, $sql, $lista)->fetchAll() as $u) {
                $autores[(string) $u['id']] = $u;
            }
        } catch (PDOException $e) {
            // Se a tabela usuarios tiver colunas diferentes do esperado, a lista continua funcionando.
            error_log('[ProLobby] Não consegui ler os autores das reviews: ' . $e->getMessage());
            $autoresIndisponiveis = true;
        }
    }

    $saida = [];
    foreach ($linhas as $l) {
        if ($l['usuario_id'] === null) {
            $autor = ['id' => null, 'username' => null, 'displayName' => $l['autor_nome'] ?: 'Equipe ProLobby', 'avatarUrl' => null];
        } elseif (isset($autores[(string) $l['usuario_id']])) {
            $u = $autores[(string) $l['usuario_id']];
            // Avatar em base64 pesa muito para listar; só devolvemos avatar que seja um link curto.
            $avatar = (is_string($u['avatar_url']) && strlen($u['avatar_url']) <= 2000) ? urlHttp($u['avatar_url'], 2000) : null;
            $autor = [
                'id' => $u['id'],
                'username' => $u['username'],
                'displayName' => $u['display_name'] ?: $u['username'],
                'avatarUrl' => $avatar,
            ];
        } else {
            $autor = ['id' => $l['usuario_id'], 'username' => null, 'displayName' => $autoresIndisponiveis ? 'Usuário' : 'Usuário removido', 'avatarUrl' => null];
        }

        $preco = $l['preco_pago'] !== null ? (float) $l['preco_pago'] : null;
        $horas = $l['horas_jogadas'] !== null ? (float) $l['horas_jogadas'] : null;
        $qcd = ($preco !== null && $preco > 0) ? calcularQcd($preco, $horas) : null;

        $saida[] = [
            'id' => $l['id'],
            'jogoId' => $l['jogo_id'] !== null ? (int) $l['jogo_id'] : null,
            'jogoNome' => $l['jogo_nome'],
            'jogoSlug' => $l['jogo_slug'],
            'jogoCapaUrl' => capaDoJogo($l),
            'titulo' => $l['titulo'],
            'texto' => $l['texto'],
            'nota' => (float) $l['nota'],
            'horasJogadas' => $horas,
            'precoPago' => $preco,
            'plataforma' => $l['plataforma'],
            'recomenda' => $l['recomenda'] !== null ? (bool) $l['recomenda'] : null,
            'origem' => $l['origem'],
            'autor' => $autor,
            'qcd' => $qcd,
            'criadoEm' => dataIso($l['criado_em']),
            'atualizadoEm' => dataIso($l['atualizado_em']),
            'minha' => $usuarioAtual !== null && $l['usuario_id'] !== null && (string) $l['usuario_id'] === (string) $usuarioAtual['id'],
        ];
    }
    return $saida;
}

// Valida os campos enviados pelo front (criando = todos os obrigatórios; senão, só os enviados).
function lerCamposReview(array $c, bool $criando): array
{
    $campos = [];

    if ($criando || array_key_exists('titulo', $c)) {
        $t = limparTexto($c['titulo'] ?? '', 150);
        if (tamanhoChars($t) < 3) {
            responderErro('O título precisa ter pelo menos 3 caracteres', 400);
        }
        $campos['titulo'] = $t;
    }
    if ($criando || array_key_exists('texto', $c)) {
        $t = limparTextoLongo($c['texto'] ?? '', 5000);
        if (tamanhoChars($t) < 20) {
            responderErro('O texto da review precisa ter pelo menos 20 caracteres', 400);
        }
        $campos['texto'] = $t;
    }
    if ($criando || array_key_exists('nota', $c)) {
        $n = $c['nota'] ?? null;
        if (!is_numeric($n) || $n < 0 || $n > 10) {
            responderErro('A nota precisa estar entre 0 e 10', 400);
        }
        $campos['nota'] = round((float) $n, 1);
    }

    $numericos = ['horasJogadas' => ['horas_jogadas', 100000, 1], 'precoPago' => ['preco_pago', 10000, 2]];
    foreach ($numericos as $chave => [$coluna, $max, $casas]) {
        if (!array_key_exists($chave, $c)) {
            continue;
        }
        $v = $c[$chave];
        if ($v === null || $v === '') {
            $campos[$coluna] = null;
        } elseif (!is_numeric($v) || $v < 0 || $v > $max) {
            responderErro("Valor inválido em $chave", 400);
        } else {
            $campos[$coluna] = round((float) $v, $casas);
        }
    }

    if (array_key_exists('plataforma', $c)) {
        $p = limparTexto($c['plataforma'], 40);
        $campos['plataforma'] = $p === '' ? null : $p;
    }
    if (array_key_exists('recomenda', $c)) {
        $campos['recomenda'] = $c['recomenda'] === null ? null : ($c['recomenda'] ? 1 : 0);
    }
    return $campos;
}

function buscarReviewPorId(PDO $pdo, string $id): ?array
{
    $linha = consultar($pdo, REVIEWS_SELECT . ' WHERE r.id = :id', [':id' => $id])->fetch();
    return $linha ?: null;
}
