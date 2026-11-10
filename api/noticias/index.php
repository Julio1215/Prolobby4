<?php
// GET /api/noticias/index.php
//   ?pagina=&limite=&fonte=<id>&categoria=games|esports&idioma=pt|en&busca=&ordem=recentes|antigas
//   -> { noticias: [...], hasMore, total, precisaAtualizar, atualizadoEm }
// Se "precisaAtualizar" vier true, o front chama POST /api/noticias/atualizar.php (sem esperar a resposta)
// e depois recarrega a lista — é assim que as notícias novas entram sem precisar de cron.
require_once __DIR__ . '/../base_conteudo.php';
require_once __DIR__ . '/_coletor.php';

exigirMetodo(['GET']);
$pdo = conectarBanco();
[$pagina, $limite, $deslocamento] = lerPaginacao(12, 50);

$onde = ['f.ativa = 1'];
$params = [];

$fonte = paramIdOpcional('fonte');
if ($fonte !== null) {
    $onde[] = 'n.fonte_id = :fonte';
    $params[':fonte'] = $fonte;
}
$categoria = paramTexto('categoria', 20);
if ($categoria !== '') {
    $onde[] = 'f.categoria = :categoria';
    $params[':categoria'] = $categoria;
}
$idioma = paramTexto('idioma', 5);
if ($idioma !== '') {
    $onde[] = 'f.idioma = :idioma';
    $params[':idioma'] = $idioma;
}
$busca = paramTexto('busca', 60);
if (tamanhoChars($busca) >= 2) {
    $like = '%' . escaparLike($busca) . '%';
    $onde[] = "(n.titulo LIKE :b1 ESCAPE '!' OR n.resumo LIKE :b2 ESCAPE '!')";
    $params[':b1'] = $like;
    $params[':b2'] = $like;
}
$direcao = paramTexto('ordem', 10) === 'antigas' ? 'ASC' : 'DESC';

$condicao = implode(' AND ', $onde);
$total = (int) consultar(
    $pdo,
    "SELECT COUNT(*) FROM noticias n JOIN fontes_noticias f ON f.id = n.fonte_id WHERE $condicao",
    $params
)->fetchColumn();

$params[':lim'] = $limite + 1;
$params[':off'] = $deslocamento;
$linhas = consultar(
    $pdo,
    "SELECT n.id, n.titulo, n.resumo, n.url, n.imagem_url, n.publicada_em,
            f.id AS fonte_id, f.nome AS fonte_nome, f.site_url, f.categoria, f.idioma
     FROM noticias n JOIN fontes_noticias f ON f.id = n.fonte_id
     WHERE $condicao
     ORDER BY n.publicada_em $direcao, n.id $direcao
     LIMIT :lim OFFSET :off",
    $params
)->fetchAll();

$temMais = count($linhas) > $limite;
$linhas = array_slice($linhas, 0, $limite);

$noticias = [];
foreach ($linhas as $l) {
    $noticias[] = [
        'id' => (int) $l['id'],
        'titulo' => $l['titulo'],
        'resumo' => $l['resumo'],
        'url' => $l['url'],
        'imagemUrl' => $l['imagem_url'],
        'fonte' => $l['fonte_nome'],
        'fonteId' => (int) $l['fonte_id'],
        'fonteSite' => $l['site_url'],
        'categoria' => $l['categoria'],
        'idioma' => $l['idioma'],
        'publicadaEm' => dataIso($l['publicada_em']),
    ];
}

responderJson(['noticias' => $noticias, 'hasMore' => $temMais, 'total' => $total] + estadoColetaNoticias($pdo));
