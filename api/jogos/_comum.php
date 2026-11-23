<?php
// Funções compartilhadas do módulo de jogos (guia, QCD e reviews usam o mesmo catálogo).
if (!defined('PROLOBBY_CONTEUDO')) {
    http_response_code(403);
    exit;
}

// Consulta base: jogo + nota média e total de reviews (calculados na hora, sem duplicar dado).
const JOGOS_SELECT = 'SELECT j.id, j.slug, j.titulo, j.genero, j.plataformas, j.desenvolvedora, j.publicadora,
        j.ano_lancamento, j.descricao, j.capa_url, j.steam_appid, j.preco_atual, j.horas_principal,
        j.horas_completo, j.destaque, r.nota_media, r.total_reviews
    FROM jogos j
    LEFT JOIN (
        SELECT jogo_id, AVG(nota) AS nota_media, COUNT(*) AS total_reviews
        FROM reviews WHERE jogo_id IS NOT NULL GROUP BY jogo_id
    ) r ON r.jogo_id = j.id';

// Capa: URL salva no banco ou, se o jogo tem steam_appid, a imagem de capa da Steam.
function capaDoJogo(array $j): ?string
{
    $capa = urlHttp($j['capa_url'] ?? null, 500);
    if ($capa !== null) {
        return $capa;
    }
    if (!empty($j['steam_appid'])) {
        return 'https://cdn.cloudflare.steamstatic.com/steam/apps/' . (int) $j['steam_appid'] . '/header.jpg';
    }
    return null;
}

function listaPlataformas(?string $csv): array
{
    if ($csv === null || trim($csv) === '') {
        return [];
    }
    return array_values(array_filter(array_map('trim', explode(',', $csv)), 'strlen'));
}

// Linha do banco -> objeto camelCase que o front usa.
function mapearJogo(array $j): array
{
    $preco = $j['preco_atual'] !== null ? (float) $j['preco_atual'] : null;
    $horas = $j['horas_principal'] !== null ? (float) $j['horas_principal'] : null;
    // Jogo grátis (ou sem horas) não entra no QCD: o custo por hora seria 0 ou indefinido.
    $qcd = ($preco !== null && $preco > 0) ? calcularQcd($preco, $horas) : null;

    return [
        'id' => (int) $j['id'],
        'slug' => $j['slug'],
        'titulo' => $j['titulo'],
        'genero' => $j['genero'],
        'plataformas' => listaPlataformas($j['plataformas']),
        'desenvolvedora' => $j['desenvolvedora'],
        'publicadora' => $j['publicadora'],
        'anoLancamento' => $j['ano_lancamento'] !== null ? (int) $j['ano_lancamento'] : null,
        'descricao' => $j['descricao'],
        'capaUrl' => capaDoJogo($j),
        'precoAtual' => $preco,
        'gratuito' => $preco !== null && $preco == 0.0,
        'horasPrincipal' => $horas,
        'horasCompleto' => $j['horas_completo'] !== null ? (float) $j['horas_completo'] : null,
        'custoPorHora' => $qcd['custoPorHora'] ?? null,
        'qcd' => $qcd ? ['nivel' => $qcd['nivel'], 'rotulo' => $qcd['rotulo']] : null,
        'notaMedia' => $j['nota_media'] !== null ? round((float) $j['nota_media'], 1) : null,
        'totalReviews' => (int) ($j['total_reviews'] ?? 0),
        'destaque' => (bool) $j['destaque'],
    ];
}
