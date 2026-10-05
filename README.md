# StoreLab Web

O StoreLab Web é apenas a interface da aplicação. Ele renderiza telas, coleta entradas do usuário e envia requisições HTTP à StoreLab API. Autenticação, cadastro, sessão, autorização, regras de negócio e persistência pertencem ao backend.

O contrato de negócio do ZIP foi preservado. A fronteira de autenticação foi preparada para a nova arquitetura solicitada, que ainda depende de evolução da StoreLab API. Nenhum backend, proxy ou fluxo social é implementado no Next.js.

## Stack e requisitos

- Next.js 16.3.8, React 19.2.8, TypeScript estrito, App Router, Tailwind CSS 4 e ESLint.
- Node.js 24 LTS (24.15 ou superior na linha 24) e npm.
- StoreLab API acessível pelo navegador. Para uso autenticado, ela deverá oferecer sessão e CORS com credenciais.
- Vitest, jsdom e React Testing Library somente para testes de desenvolvimento. Nenhuma dependência é usada para integrar provedores no browser.

## Instalação e execução

```sh
npm ci
```

Copie `.env.example` para `.env.local` (PowerShell: `Copy-Item .env.example .env.local`), sem sobrescrever uma configuração existente. A única variável necessária é:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

```sh
npm run dev
```

Abra http://localhost:3000. Reinicie dev depois de alterar a variável; em produção, gere um novo build. Tudo que usa o prefixo `NEXT_PUBLIC_` é público. Não há configuração social ou secrets no frontend. Se um arquivo local de uma versão anterior contiver configurações de provedores, remova-as; elas não são mais lidas.

## Separação de responsabilidades

```text
Browser / Next.js: interface, navegação, formulários e HTTP
        ↓
StoreLab API / Quarkus: autenticação, cadastro, sessão, autorização e negócio
        ↓
Google / Apple / Firestore: integrações exclusivas do backend
```

As chamadas da interface usam `fetch` direto para a API com `credentials: "include"`. O navegador cuida do transporte do cookie da API; JavaScript não lê, cria ou altera esse cookie. Next.js não implementa BFF, Route Handler de autenticação, Server Action de login, banco ou sessão própria.

`AuthProvider` guarda somente o usuário devolvido por `/auth/me`, estado visual de carregamento/erro e referências a operações HTTP. Em cada montagem, consulta novamente a API: 200 mostra a aplicação, 401 mostra login. Falha de rede/500 mostra erro com nova tentativa, sem fingir anonimato nem confiar em um perfil anterior. Um 401 de uma operação também devolve a interface ao login; 403 apenas apresenta a falta de permissão.

Quando a sessão backend existir, recarregar a página não exigirá novo login enquanto ela permanecer válida: o frontend simplesmente consultará `/auth/me` novamente. O frontend não cria usuários, interpreta credenciais, gerencia renovação de sessão ou participa do protocolo social.

## Contrato de autenticação previsto — backend pendente

Caminhos centralizados em `src/lib/api/config.ts`:

| Operação             | Caminho                  | Situação                                               |
| -------------------- | ------------------------ | ------------------------------------------------------ |
| Consultar usuário    | `GET /auth/me`           | Endpoint existente; deverá reconhecer a sessão backend |
| Iniciar login Google | `GET /auth/google/login` | Previsto; ainda não existe no ZIP                      |
| Iniciar login Apple  | `GET /auth/apple/login`  | Previsto; ainda não existe no ZIP                      |
| Encerrar sessão      | `POST /auth/logout`      | Previsto; ainda não existe no ZIP                      |

Os três novos caminhos são pontos de integração propostos, não endpoints existentes ou simulados. Devem ser confirmados ou ajustados nesse arquivo quando o backend definir o contrato final. Os botões são links HTTP nativos para a base da API, sem SDK, popup gerenciado pelo frontend ou chamada direta ao provedor. Eles podem retornar 404 enquanto os endpoints previstos não forem implementados; a tela informa essa dependência.

Fluxo esperado: clique no link → API inicia login → provedor → callback na API → API cria/localiza a pessoa e estabelece a sessão → API redireciona ao frontend → frontend consulta `/auth/me`. O retorno ao frontend e qualquer destino autorizado de redirecionamento são definidos pelo backend; não inventamos callback ou parâmetros adicionais no frontend.

O botão Sair solicita o POST previsto. Após confirmação de sucesso (preparado para 204 sem corpo) ou 401 indicando ausência de sessão, apresenta login. Um 404/500/falha de rede é mostrado e não simula encerramento da sessão. O frontend não tenta apagar cookies.

Antes da validação integrada, a StoreLab API precisa implementar:

1. Início de login e callback para Google e Apple, com toda a configuração de provedores no backend.
2. Criação/localização de Person e criação de sessão no backend.
3. Cookie HttpOnly, Secure em produção e SameSite adequado ao ambiente.
4. `/auth/me` e demais endpoints reconhecendo essa sessão, com 401 para sessão ausente/expirada.
5. Encerramento da sessão e cookie no logout, além do redirecionamento de volta ao frontend no login.
6. CORS com credenciais e proteção de requisições com cookie, incluindo controles de CSRF no backend conforme o contrato final.

Não há cadastro local. O campo `MeResponse.provider` permanece somente como dado de exibição do DTO existente; não seleciona autenticação nem altera requisições.

## CORS e cookies

Em desenvolvimento, Next.js usa `http://localhost:3000` e a API `http://localhost:8080`. São origens diferentes. A API deverá autorizar explicitamente a origem do frontend, permitir credenciais, métodos utilizados e headers JSON, além de emitir cookie compatível com seu ambiente. A configuração do ZIP atualmente desabilita credenciais CORS e ainda não oferece sessão: portanto, este frontend não é compatível com a autenticação atual até essa evolução.

`credentials: "include"` não supera bloqueios de CORS, SameSite ou cookies do navegador. A API não deve responder às chamadas JSON com páginas de login: deve retornar 401. Os redirects sociais ocorrem pela navegação de documento dos links de login. Não existe workaround de CORS no frontend.

## Validação integrada após a evolução da API

1. Confirme os caminhos previstos e configure somente a base da API no Next.js.
2. Abra o frontend: `/auth/me` sem sessão deve responder 401 e exibir login.
3. Use Google primeiro, depois Apple. O backend deve concluir o fluxo e retornar ao frontend; `/auth/me` deve responder 200 com o perfil interno.
4. Confirme `/stores` e as telas permitidas pela role recebida por Store.
5. Recarregue a página: a sessão válida deve ser reconhecida por nova consulta a `/auth/me`.
6. Use Sair, confirme o encerramento no backend e recarregue: `/auth/me` deve responder 401.
7. Verifique sessão expirada, falhas de rede e conflitos. Não considere testes HTTP isolados como prova de implementação da sessão no backend.

## Páginas

| Rota                                     | Uso                                    |
| ---------------------------------------- | -------------------------------------- |
| `/`                                      | Login; após autenticação, dashboard    |
| `/dashboard`                             | Listagem e criação de lojas            |
| `/stores/[storeId]`                      | Visão geral e navegação contextual     |
| `/stores/[storeId]/products`             | Produtos, filtros, cursor e criação    |
| `/stores/[storeId]/products/[productId]` | Detalhes, edição, estoque e movimentos |
| `/stores/[storeId]/categories`           | Listagem, criação, edição e status     |
| `/stores/[storeId]/members`              | Gestão por personId, somente OWNER     |
| `/stores/[storeId]/settings`             | Nome e status da Store, somente OWNER  |

A navegação “Produtos e estoque” leva aos produtos; os movimentos ficam na página de cada produto, conforme o escopo real do endpoint. Uma URL protegida acessada sem sessão apresenta login. O destino após o login será definido pelo backend.

## Permissões por Store

| Ação                                | OWNER | MANAGER | EMPLOYEE |
| ----------------------------------- | ----- | ------- | -------- |
| Consultar loja/catálogo             | Sim   | Sim     | Sim      |
| Consultar/registrar movimentos      | Sim   | Sim     | Sim      |
| Criar/alterar catálogo              | Sim   | Sim     | Não      |
| Administrar membros e configurações | Sim   | Não     | Não      |

A UI usa `StoreResponse.role` da loja atual somente para apresentação. Links e componentes restritos são ocultados, inclusive no acesso direto à rota; a API continua validando cada operação. Depois de alterar/remover membros, a Store é consultada novamente para refletir mudanças no próprio acesso.

## Estrutura

```text
src/app/                   Rotas, layouts servidor, loading/error e CSS
  (workspace)/             Grupo de páginas autenticadas (não aparece na URL)
src/components/auth/       Contexto, login e proteção visual
src/components/store/      Dashboard, contexto da Store, categorias, membros, configurações
src/components/products/   Lista, formulário, detalhes e movimentos
src/components/ui.tsx      Apresentação reutilizada: campos, feedback, erros, cabeçalhos
src/lib/api/               DTOs, fetch e as 18 funções do contrato
src/lib/api/config.ts      Base HTTP e caminhos previstos de autenticação backend
src/lib/hooks/             Carregamento cancelável e paginação por cursor
src/lib/format.ts          Datas, inteiros e conversão exata de centavos
src/lib/permissions.ts     Permissões de apresentação
 tests/                    Testes isolados, sem chamadas a provedores ou backend real
```

Veja [STUDY-GUIDE.md](STUDY-GUIDE.md) para a sequência de estudo e arquivos a abrir.

## Contrato consumido

Todas as operações exigem autenticação. Tipos completos ficam em `src/lib/api/types.ts`; o mapeamento HTTP fica em `src/lib/api/resources.ts`.

| Método        | Caminho                                                      |
| ------------- | ------------------------------------------------------------ |
| GET           | `/auth/me`                                                   |
| GET, POST     | `/stores`                                                    |
| GET, PATCH    | `/stores/{storeId}`                                          |
| GET, POST     | `/stores/{storeId}/members`                                  |
| PATCH, DELETE | `/stores/{storeId}/members/{personId}`                       |
| GET, POST     | `/stores/{storeId}/categories`                               |
| PATCH         | `/stores/{storeId}/categories/{categoryId}`                  |
| GET, POST     | `/stores/{storeId}/products`                                 |
| GET, PATCH    | `/stores/{storeId}/products/{productId}`                     |
| GET, POST     | `/stores/{storeId}/products/{productId}/inventory-movements` |

As criações retornam 201, leituras/alterações 200 e remoção de membro 204. Erros preservam `status`, `code`, `message`, `path`, `timestamp` e `validationErrors`. Falhas 500 recebem apresentação genérica; 401 sem JSON também é tratado. Erros não são apresentados como sucesso; dados do formulário permanecem para correção.

## Limitações preservadas

- Membros: somente personId; sem pesquisa de pessoas, email, convite ou perfil alheio. O próprio personId fica no menu do perfil.
- Store inativa continua operacional segundo o papel; a UI apenas mostra o status.
- Categorias inativas não desativam produtos. Criação/troca de categoria usa categoria ativa; editar outro campo preserva a categoria inalterada, mesmo inativa.
- Não há DELETE de Store/categoria/produto nem edição/remoção de movimentos.
- Histórico: até 100 movimentos, sem paginação. `initialStock` não gera movimento.
- Produtos: filtros `categoryId` e `active`, limite 20 e botão “Carregar mais” com cursor; sem busca textual, número de página, totais ou ordenação inventada. Ao trocar filtros, a consulta recomeça.
- A API não declara moeda: o helper exibe unidades decimais em pt-BR, sem presumir R$, BRL ou USD. Conversão usa strings/BigInt, sem `parseFloat * 100`.
- Inteiros JSON maiores que `Number.MAX_SAFE_INTEGER` não podem ser representados exatamente no JavaScript. A UI sinaliza valores recebidos fora dessa precisão e rejeita entradas inseguras. Ao editar um produto com preço inseguro, esse preço não é reenviado. Esse é um limite do cliente, não uma regra nova do backend.
- Datas ISO-8601 são exibidas em pt-BR no fuso local do navegador; não são manipuladas como textos sem timezone.
- Nome/email vêm de `/auth/me`; sem edição de perfil. Cadastro e eventual vinculação de contas pertencem ao backend.
- Não há catálogo público, sessão própria Next.js, BFF, busca textual, imagens ou recursos de e-commerce. A sessão persistente depende do backend.
- Movimentos não têm chave de idempotência para o cliente. Não há retry automático de gravações; após falha de conexão, confira saldo/histórico antes de repetir.
- A API não oferece atualização em tempo real. Após mutações, as consultas afetadas são recarregadas sem refresh completo da aplicação.

## Qualidade e testes

```sh
npm run lint
npm test
npm run typecheck
npm run build
npm start
```

`npm run test:watch` mantém os testes em observação. Os testes cobrem ApiError, as 18 operações existentes, cookies nas chamadas HTTP, 204, `/auth/me` 200/401, falhas de consulta, logout previsto, links de login backend, permissões visuais por Store, cursores, valores monetários e formulário de produto.

Não existe modo mock/demo no app. `fetch` é substituído somente dentro dos testes. Nenhum protocolo social é simulado. Respostas controladas dos caminhos previstos não significam que eles já existem no backend.

A UI utiliza grids responsivos e tabelas com rolagem horizontal local, campos com labels, foco visível, regiões de erro/status e navegação por teclado. Telas privadas exigem a sessão da API para revisão integrada.

A auditoria de dependências de produção não reportou vulnerabilidades nesta implementação. A auditoria completa reportou avisos na cadeia de desenvolvimento `eslint-config-next → fast-glob → micromatch → braces`; não foi aplicado o downgrade automático incompatível sugerido pelo npm. Consulte `npm audit` para o estado atual.
