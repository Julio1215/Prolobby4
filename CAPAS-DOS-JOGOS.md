# Capas dos jogos

Nas telas de **Reviews** e **QCD Score**, cada jogo mostra uma capa. Ela vem de um destes lugares, nesta ordem:

1. **Endereço manual:** a coluna `capa_url` da tabela `jogos`, se estiver preenchida.
2. **Steam:** se o jogo tem `steam_appid`, a API usa a imagem da Steam. A tela mostra a capa vertical
   (cabe no card sem cortar) e, se ela não existir, a imagem horizontal inteira.
3. **IGDB:** para os jogos que não estão na Steam (Nintendo, PlayStation, Riot...), a API busca a capa
   na IGDB (base de dados de jogos da Twitch) e guarda em `capa_url`. Só funciona com as chaves abaixo.
4. **Sem imagem:** a tela mostra um ícone com o nome do jogo.

## Ligar a busca automática (IGDB), uma vez só

1. Crie uma conta na Twitch (ela pede verificação em duas etapas, com o celular).
2. Em <https://dev.twitch.tv/console> clique em *Register Your Application*. Nome: `ProLobby`;
   URL de redirecionamento: `http://localhost`; categoria: *Website Integration*; tipo: *Confidential*.
3. Abra o app criado, copie o **Client ID** e clique em **New Secret** para gerar o **Client Secret**.
4. No servidor (InfinityFree > gerenciador de arquivos), abra `htdocs/api/env.php` e acrescente estas
   duas linhas no fim:

   ```php
   define('IGDB_CLIENT_ID', 'seu-client-id');
   define('IGDB_CLIENT_SECRET', 'seu-client-secret');
   ```

   O `env.php` nunca vai para o GitHub, e a publicação automática não mexe nele.
5. Pronto. Quando alguém abrir Reviews ou QCD e houver jogo sem capa, o site pede à API para buscar.
   A API tenta no máximo uma vez a cada 12 horas e só aceita a capa de um jogo com **exatamente o mesmo
   nome** (é melhor ficar sem capa do que com a capa errada).

Boa prática: credite a IGDB (igdb.com) no projeto.

## Capa manual (lojas oficiais)

Se a busca não achar um jogo, ou você quiser outra imagem, veja `database/capas-manuais.sql`:
é só copiar o endereço da capa na página do jogo (Nintendo eShop, PlayStation Store, Xbox Store...)
e rodar o comando no phpMyAdmin.

## Por que não buscamos direto na Nintendo eShop e na PlayStation Store?

Essas lojas não têm uma API pública para imagens. As páginas delas carregam o conteúdo por JavaScript e
bloqueiam acesso automático, então qualquer busca direta quebra com facilidade. A IGDB entrega as mesmas
capas de todas as plataformas, com endereço estável e de graça para projetos sem fins comerciais.
