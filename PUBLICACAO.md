# Como o site é publicado

O site (React) e a API (PHP) são publicados no InfinityFree **automaticamente**.
A cada `git push` na branch principal, o GitHub compila o site e envia tudo por FTP para a
pasta `htdocs` do InfinityFree. Ninguém precisa rodar `npm run build` nem mexer nas pastas
`dist` e `assets` do servidor. Quem faz isso é o arquivo `.github/workflows/publicar.yml`.

## Configuração (uma vez só)

1. **Dados de FTP do InfinityFree.** No painel (Client Area > sua conta de hospedagem > FTP Details),
   anote o servidor (normalmente `ftpupload.net`), o usuário (começa com `if0_`) e a senha.
2. **Segredos no GitHub.** No repositório, vá em *Settings > Secrets and variables > Actions >
   New repository secret* e crie três segredos:
   - `FTP_SERVER`: o servidor FTP
   - `FTP_USERNAME`: o usuário
   - `FTP_PASSWORD`: a senha

   Nunca coloque essas informações dentro do código.
3. **Primeira publicação.** Faça um `git push` (ou vá em *Actions > Publicar no InfinityFree >
   Run workflow*). A primeira vez demora alguns minutos, porque envia tudo.

## No dia a dia

1. Mexa no código e teste no computador com `npm run dev`.
2. `git add .`, `git commit -m "o que mudou"` e `git push`.
3. Acompanhe na aba **Actions** do GitHub: bolinha verde = publicado; vermelha = deu erro
   (clique para ver o motivo).
4. Depois de publicado, abra o site. O `.htaccess` já manda o navegador conferir o `index.html` a cada
   visita; se mesmo assim aparecer a versão antiga, use Ctrl+Shift+R uma vez.

## O que não vai para o servidor

- `api/env.php`: a senha do banco continua só no servidor (nunca no GitHub).
- `api/diagnostico.php` e `api/env.php.example`.

## Se algo der errado

- **Erro de login ou de conexão FTP:** confira os três segredos e se `server-dir` no workflow
  é `/htdocs/`.
- **Alguém apagou ou mudou algo na htdocs na mão:** o GitHub lembra do que já enviou (arquivo
  `.ftp-deploy-sync-state.json` na htdocs). Apague esse arquivo no servidor e rode o workflow de
  novo: ele reenvia tudo. Por isso, evite mexer em arquivos do site direto no servidor.
- **Sobras antigas em `assets` (opcional):** as próximas publicações já apagam sozinhas os arquivos
  que deixaram de existir. As sobras de antes da automação só saem se você apagar a pasta `assets`
  do servidor pouco antes da primeira publicação.
- **Servidor da chamada (opcional):** para usar um servidor PeerJS próprio, crie em *Settings >
  Secrets and variables > Actions > Variables* a variável `VITE_PEER_HOST` com o endereço (sem
  `https://`) e publique de novo.

## Trocar o endereço do site (domínio)

O site e a API usam o **mesmo endereço** (a API é chamada por `/api`, sem endereço completo), então
**trocar o endereço não exige mexer em nenhum código**. O link de convite da chamada também já usa o
endereço de onde o site foi aberto.

**Sobre o `prolobby.com`:** esse endereço já tem dono e está à venda num site de revenda de domínios
(a HugeDomains). Lá, a maioria dos domínios `.com` custa mais de US$ 1.000, então não compensa para o
projeto. Opções:

1. **Grátis, com nome melhor:** no painel do InfinityFree, em *Domains*, dá para adicionar outro
   subdomínio grátis com o nome `prolobby` (quem pedir primeiro leva; a lista de domínios grátis do
   InfinityFree muda de tempos em tempos).
2. **Domínio próprio (pago):** registre um endereço livre, por exemplo `prolobby.com.br` (Registro.br) ou
   outra terminação. Preço e disponibilidade variam: consulte direto no site de registro.
   - No registrador, troque os *nameservers* para `ns1.infinityfree.com` e `ns2.infinityfree.com`.
   - No InfinityFree: *Add Domain* > *Custom Domain*, e depois peça o certificado SSL grátis no painel
     (sem SSL o navegador **bloqueia o microfone** da chamada).

**Importante (pasta do site):** no InfinityFree só o primeiro domínio da conta usa a pasta `htdocs`.
Para o endereço novo mostrar o **mesmo site** (e o deploy do GitHub continuar valendo), adicione-o como
**Parked Domain** do endereço atual. Se for adicionado como *Addon Domain*, ele ganha uma pasta própria e
a publicação automática não chega nela. Confira no guia do InfinityFree (*Parked Domains* x *Addon Domains*).

**Redirecionar o endereço antigo (opcional):** só depois que o novo estiver funcionando com https, acrescente
no começo do `public/.htaccess` (troque `NOVO-ENDERECO`):

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^lonelywolf\.site\.je$ [NC]
RewriteRule ^(.*)$ https://NOVO-ENDERECO/$1 [R=301,L]
```

Obs.: as contas de login do site ficam salvas **no navegador** de cada pessoa (por endereço). Ao trocar o
endereço, quem já tinha conta precisa criar de novo no endereço novo.
