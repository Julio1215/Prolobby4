# ProLobby: banco PHP e hospedagem no Render

O projeto tem duas partes: React/Vite (site estático) e PHP (API). A API enviada no ZIP usa MySQL/MariaDB e os arquivos `database/schema-conteudo.sql` e `database/seed-conteudo.sql`. O Render oferece PostgreSQL gerenciado, mas também documenta um serviço MySQL próprio com disco persistente — é essa opção que mantém compatibilidade com os SQLs enviados. Um provedor MySQL externo também funciona. Não use armazenamento efêmero para o banco.

## Rodar localmente

1. Crie um banco MySQL/MariaDB chamado `prolobby` e importe, nesta ordem, `database/schema-conteudo.sql` e `database/seed-conteudo.sql`.
2. Copie `api/env.php.example` para `api/env.php` e ajuste as credenciais locais.
3. Na raiz do projeto, rode `php -S localhost:8000`.
4. Copie `.env.example` para `.env` e deixe `VITE_API_URL=http://localhost:8000/api`.
5. Rode `npm install` e `npm run dev`.

## Publicar

### 1. Banco MySQL no Render

1. Siga [Deploy MySQL no Render](https://render.com/docs/deploy-mysql) e crie um **Private Service** a partir do template oficial `render-examples/mysql`.
2. Defina `MYSQL_DATABASE=prolobby`, `MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`. Guarde usuário e senha.
3. Em **Advanced > Disk**, monte um disco em `/var/lib/mysql` (o guia do Render sugere 10 GB). O banco precisa do disco persistente para conservar os dados entre deploys.
4. Para importar os dois arquivos SQL, crie temporariamente um serviço Adminer seguindo [Deploy Adminer no Render](https://render.com/docs/deploy-adminer). No Adminer, conecte usando o endereço interno do MySQL (visível em **Connect > Internal**, por exemplo `mysql-abc:3306`), usuário, senha e banco `prolobby`. Importe primeiro `database/schema-conteudo.sql`, depois `database/seed-conteudo.sql`. Proteja o Adminer durante o uso e remova o serviço ao terminar; ele ficará público enquanto existir.
5. Anote o host e a porta internos do serviço MySQL. A API PHP e o MySQL devem ficar na mesma região para usar a rede privada.

Se preferir um provedor de banco externo com phpMyAdmin, também pode usá-lo; importe os mesmos dois SQLs e informe as credenciais externas nas variáveis da API.

### 2. API PHP no Render

Suba este projeto em um repositório Git. No Render, escolha **New > Web Service**, conecte o repositório e selecione **Docker**. Use `Dockerfile.api` como caminho do Dockerfile (contexto de build: raiz do repositório). O serviço deve expor a porta `10000`.

Em **Environment**, configure (use o host interno `mysql-abc` da etapa 1 como `HOST`):

- `DB_DSN`: `mysql:host=HOST;port=3306;dbname=NOME;charset=utf8mb4`.
- `DB_USER`: usuário do banco.
- `DB_PASSWORD`: senha do banco.
- `FRONTEND_URL`: URL HTTPS do site estático criado no passo seguinte, sem `/` no final.
- `PANDASCORE_TOKEN`: opcional, necessário para dados reais de e-sports.
- `ADMIN_CHAVE`: opcional, chave longa para forçar a coleta de notícias.

Depois do deploy, a API ficará em `https://NOME-DA-API.onrender.com/api`. Abra `.../api/jogos/index.php`; uma resposta JSON com a lista de jogos confirma que o serviço respondeu. Se aparecer erro de conexão, confira o DSN, credenciais e regra de rede no provedor do banco.

### 3. Site React no Render

No Render, escolha **New > Static Site** e conecte o mesmo repositório. Configure:

- **Build command:** `npm ci && npm run build`
- **Publish directory:** `dist`
- **Environment variable:** `VITE_API_URL=https://NOME-DA-API.onrender.com/api`

Em **Redirects/Rewrites**, adicione uma regra `/*` para `/index.html` com status `200`, para que rotas do React funcionem ao recarregar a página. Salve e publique. Copie a URL do site e atualize `FRONTEND_URL` no serviço PHP; depois redeploy a API para liberar o CORS.

### 4. Servidor de sinalização da chamada (página /chamada)

A chamada de voz, vídeo e tela usa o PeerJS. O servidor público dele cai com frequência (o erro aparece como `network`), então use o seu, que está na pasta `servidor-peer`. Ele só ajuda as pessoas a se encontrarem; o vídeo e o áudio vão direto entre elas.

No Render, escolha **New > Web Service**, conecte o mesmo repositório e configure:

- **Root Directory:** `servidor-peer`
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Instance type:** Free

Quando ficar **Live**, copie o endereço (ex.: `prolobby-peer.onrender.com`) e, no **Static Site**, crie a variável `VITE_PEER_HOST` com esse endereço, sem `https://`. Faça um novo deploy do site. Para testar no seu computador, coloque a mesma linha no `.env`.

No plano grátis o servidor dorme depois de uns 15 minutos sem uso; a primeira conexão depois disso leva até 1 minuto e a chamada tenta de novo sozinha.

## O que já usa esse banco

O pacote PHP enviado fornece as rotas de notícias, jogos, reviews, QCD e e-sports. As telas de notícias, QCD e reviews usam o catálogo/reviews da API quando ela está configurada; se a conexão falhar, preservam os dados locais já existentes. A tela Guia de Jogos e as páginas de e-sports ainda exibem o conteúdo estático original. Em particular, cadastro/login, perfil, comunidade e ferramentas de RPG usam `localStorage` no navegador, pois o ZIP enviado não inclui essas rotas/tabelas de backend. Para várias pessoas compartilharem esses dados, será necessário um backend próprio para esses módulos.

Tailwind CSS v4 continua configurado pelo plugin do Vite e pelo `@import "tailwindcss"` existente; não é necessário mudar a configuração para publicar.
