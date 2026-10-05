# StoreLab Web — guia de estudo

Este guia acompanha o código implementado. A regra central é manter a StoreLab API como autoridade do contrato e das regras de negócio. Leia em sequência e acompanhe uma ação de UI até `fetch`, depois a resposta voltando ao componente.

## 1. Estrutura Next.js

Abra `package.json`, `tsconfig.json`, `next.config.ts` e `src/app/layout.tsx`.

O Next.js fornece desenvolvimento, navegação e build. TypeScript usa `strict: true`; `@/` aponta para `src/`. Código de interface fica em `components`, comunicação em `lib/api` e testes em `tests`. Não há backend dentro deste projeto.

Execute `npm run dev` e veja como uma alteração aparece pelo Fast Refresh. Uma recarga completa consulta `/auth/me` novamente; a continuidade do acesso depende da sessão no backend.

## 2. App Router

Abra `src/app/page.tsx` e `src/app/(workspace)/dashboard/page.tsx`.

Pastas definem segmentos; `page.tsx` torna a rota navegável. O grupo `(workspace)` organiza arquivos, mas não acrescenta `/workspace` à URL. As páginas são pequenas: definem metadata e compõem o componente responsável pela interação.

## 3. Layouts

Abra `src/app/layout.tsx`, `src/app/(workspace)/layout.tsx` e `src/app/(workspace)/stores/[storeId]/layout.tsx`.

O layout raiz define documento, idioma e provider de autenticação. O layout do grupo aplica o gate visual. O layout de Store carrega o contexto da loja e sua navegação. Layouts compartilhados preservam a árvore durante a navegação; por isso o provider raiz mantém o perfil visual entre páginas. A sessão real pertence à API. A `key` da Store descarta estado quando o ID muda.

## 4. Server Components

Abra as páginas e os layouts em `src/app`.

Eles permanecem Server Components para estrutura, metadata e leitura de parâmetros de rota. `params` é uma Promise nesta versão do Next.js e é aguardado nos segmentos dinâmicos.

A sessão é criada pela API para o navegador. Os wrappers servidor cuidam da estrutura e não encaminham cookies ou implementam um BFF. As chamadas autenticadas são feitas no browser com `credentials: "include"`, sem JavaScript ler o cookie.

## 5. Client Components

Abra `src/components/auth/login-panel.tsx`, `src/components/store/dashboard.tsx` e `src/components/products/products-page.tsx`.

Esses componentes usam eventos, estado, contexto e requisições HTTP à API. Precisam executar suas partes interativas no navegador. Client Components ainda podem participar da renderização inicial do HTML; a diretiva não significa “sem renderização inicial no servidor”. Os efeitos consultam a API depois da montagem; não há SDK social nem leitura de credenciais no browser.

## 6. `"use client"`

Compare `src/app/page.tsx` com `src/components/auth/auth-gate.tsx`.

A diretiva estabelece uma fronteira de módulos. Imports de um módulo cliente entram no bundle cliente. Ela não converte automaticamente um Server Component recebido por `children` em código cliente. Isso permite o layout servidor compor um provider cliente sem marcar toda a aplicação com a diretiva.

`src/components/ui.tsx` não precisa da diretiva: é apresentação reutilizável, executada conforme o componente que a importa. Não guarda sessão nem inicia requisições.

## 7. TypeScript

Abra `src/lib/api/types.ts`.

Interfaces representam o JSON do backend, não classes Java nem objetos da persistência. `Role` e `MovementType` são unions. O campo `MeResponse.provider` é apenas um dado do perfil retornado pelo backend. `description`, `reason` e `email` aceitam `null`. Campos opcionais de PATCH refletem atualização parcial. `PagedResponse<T>` reutiliza somente a forma real da página.

Tipos não validam magicamente um JSON remoto em runtime. O cliente trata o envelope de erro como `unknown` e confere sua forma antes de utilizá-lo. As respostas de sucesso são tipadas conforme o contrato fornecido.

## 8. Tailwind

Abra `src/app/globals.css` e a renderização de `src/components/store/dashboard.tsx`.

Classes utilitárias definem espaçamento, grids e breakpoints. Poucos padrões repetidos viram classes (`panel`, `input`, `btn-primary`, `table-wrap`); não há design system. Em telas estreitas os formulários empilham e tabelas rolam dentro da própria região. Foco visível, labels e texto de ações não dependem apenas de cor.

## 9. Environment variables

Abra `.env.example` e leia `src/lib/api/config.ts`. A única variável é `NEXT_PUBLIC_API_BASE_URL`.

`NEXT_PUBLIC_*` entra no JavaScript entregue ao usuário. Configuração social e segredos pertencem exclusivamente ao backend. `.env.local` evita versionar configurações, mas não torna variáveis públicas em segredos. Reinicie dev após mudar valores e reconstrua o bundle de produção quando necessário.

## 10. API client

Abra `src/lib/api/client.ts` e `src/lib/api/resources.ts`.

`apiFetch` resolve URL, headers, JSON, falhas e 204. `createApi` oferece funções pequenas, uma por operação real. Não há classe genérica de CRUD, proxy, cache global ou tradução de modelos de persistência. IDs são codificados como segmentos de URL.

O teste `tests/api.test.ts` enumera as 18 combinações de método/caminho. Compare cada uma aos Resources do ZIP antes de mudar o contrato.

## 11. `fetch`

Siga `createStore` em `resources.ts` até `apiFetch`.

`fetch` não rejeita automaticamente uma resposta 400/500; é preciso conferir `response.ok`. Um 204 não contém JSON. `URLSearchParams` preserva `false` e codifica cursores. `credentials: "include"` pede ao navegador que envie os cookies aplicáveis à API; isso não permite ao JavaScript acessar um cookie HttpOnly. `cache: no-store` evita reutilizar dados protegidos pelo cache HTTP do cliente.

Consultas recebem `AbortSignal`. Mutações não têm retry automático: especialmente movimentos de estoque podem duplicar efeitos se repetidos após falha de rede.

## 12. Sessão controlada pelo backend

Abra `src/components/auth/auth-provider.tsx`.

O contexto não autentica ninguém. Ele consulta `/auth/me` e representa o resultado: carregando, autenticado, anônimo ou erro. Credenciais, criação de usuário e persistência da sessão ficam no backend. Uma resposta 401 muda a apresentação; não apaga ou cria uma sessão no JavaScript.

## 13. Cookie HttpOnly

Abra `src/lib/api/client.ts` e a seção CORS do README.

O backend deverá emitir o cookie HttpOnly e configurar Secure/SameSite conforme o ambiente. O navegador o transporta nas requisições permitidas. O frontend não lê, escreve nem remove esse cookie. CORS com credenciais e os controles de segurança das requisições pertencem à API; `credentials: "include"` não os substitui.

## 14. Contexto como estado de interface

Abra `src/components/auth/auth-provider.tsx` e `tests/auth.test.tsx`.

`useAuth` fornece usuário e estados de apresentação. `useApi` oferece as funções HTTP existentes às telas. O carregamento inicial não renderiza conteúdo privado antes da resposta da API. Erros de rede e 500 têm nova tentativa; 401 representa anonimato. Uma consulta cancelada não sobrescreve o resultado mais recente.

Ao remontar o app, o contexto começa carregando e busca novamente o usuário. Essa consulta permite reconhecer uma sessão backend ainda válida após recarregar a página, sem persistir perfil como prova de identidade.

## 15. Redirecionamento de login

Abra `src/components/auth/login-panel.tsx`, `src/lib/api/config.ts` e `tests/login.test.tsx`.

Os botões Google e Apple são links HTTP nativos para caminhos previstos no backend. O clique inicia navegação de documento e permite à API conduzir redirects. Não usamos fetch para executar o protocolo social, callback frontend, SDK ou parâmetros de autenticação.

Os caminhos ainda não existem no ZIP. Estão centralizados e sinalizados como previstos na interface e documentação; deverão ser confirmados com a próxima versão da API. Não há endpoints simulados no Next.js.

## 16. Logout e responsabilidade sobre credenciais

Abra `signOut` no contexto e `logout` em `src/lib/api/resources.ts`.

A UI solicita POST ao caminho backend previsto. Somente após sucesso ou confirmação de anonimato apresenta login. Uma falha de rede/404/500 mantém o perfil visível e mostra erro, pois limpar a tela não encerraria a sessão real. JavaScript não manipula cookies nem credenciais.

O frontend não recebe tokens porque não participa da autenticação. Google/Apple, seus callbacks, cadastro, identidade externa e renovação ficam inteiramente na StoreLab API.

## 17. Integração com `/auth/me`

Siga `AuthProvider → createApi().getMe → apiFetch`.

O navegador envia a requisição com cookies aplicáveis. A API responde 200 com `MeResponse` ou 401 sem sessão válida. O frontend usa esse perfil, sem derivar identidade de dados locais. O menu mostra o personId para compartilhamento com o OWNER, preservando a limitação existente de gestão de membros.

Depois, `Dashboard` carrega `/stores`; as roles recebidas continuam contextuais. A API atual ainda precisa reconhecer a nova sessão para que esse fluxo funcione integrado.

## 18. Autorização contextual

Abra `src/lib/permissions.ts`, `src/components/store/store-shell.tsx` e `tests/permissions.test.tsx`.

A role vem de `getStore(storeId)`. O layout mostra navegação apropriada; `OwnerOnly` também impede montar conteúdo restrito em URL direta. A pessoa pode ser OWNER em uma Store e EMPLOYEE em outra. `Store.active` nunca funciona como bloqueio geral.

Essas verificações melhoram a experiência. O backend continua autorizando toda requisição e pode devolver 403 se a permissão tiver mudado. Não copiamos a regra transacional de “último OWNER” para o frontend: mostramos o conflito recebido.

## 19. Formulários

Abra `src/components/products/product-form.tsx`, `movement-form.tsx` e `src/components/store/members.tsx`.

Formulários usam HTML, `FormData` e estado local de envio/erro. `required`, `maxLength`, `min` e `step` ajudam a preencher. A API valida o resultado. `fieldset disabled` evita edições durante o envio; erros preservam os campos.

A edição do produto não contém stock. Uma alteração de saldo vira `CreateMovementRequest`. Categoria inalterada não é reenviada, pois pode estar inativa; isso permite atualizar os demais campos conforme a API. Membros pedem personId, sem simular busca ou convite.

Abra também `src/lib/format.ts`: `moneyToCents` separa partes decimais e usa BigInt para não arredondar. A UI não inventa moeda. Valores acima da precisão segura do Number são tratados como limitação técnica, nunca arredondados silenciosamente.

## 20. Tratamento de erros

Abra `normalizeApiError`/`ApiRequestError` em `client.ts` e `ApiErrorMessage` em `src/components/ui.tsx`.

O envelope mantém os campos reais e as mensagens de validação. A UI usa a última parte do caminho Java para identificar o campo no resumo. Conflitos 409 mostram a mensagem backend; 403 e 404 têm títulos apropriados; 500 não expõe conteúdo interno.

Erros do mecanismo de autenticação podem não ter JSON. O cliente cria uma apresentação segura para esse caso, sem fingir sucesso ou inventar resposta de negócio. 401 remove a representação local do usuário independentemente do formato do corpo; a sessão real é responsabilidade da API.

## 21. Paginação por cursor

Abra `src/lib/hooks/use-product-pages.ts`, `src/components/products/products-page.tsx` e `tests/pagination.test.tsx`.

A primeira consulta usa limite 20. “Carregar mais” envia `nextCursor` da resposta, conserva os filtros e acumula os itens. `hasMore` controla o botão. Não calculamos número de página ou total inexistente.

Mudar filtros reinicia a consulta. AbortController impede respostas antigas de sobrescrever dados novos. O bloqueio de requisição evita duplo clique simultâneo. Uma falha na próxima página preserva os itens e o cursor para uma tentativa explícita. IDs repetidos não geram linhas duplicadas caso o catálogo mude entre leituras.

## 22. Rotas dinâmicas

Abra `src/app/(workspace)/stores/[storeId]/layout.tsx` e `src/app/(workspace)/stores/[storeId]/products/[productId]/page.tsx`.

Os segmentos `[storeId]` e `[productId]` recebem IDs opacos. O servidor resolve os parâmetros e passa strings à parte cliente. O contexto da Store é compartilhado; detalhes do produto usam uma key para descartar estado ao trocar produto. `storePath`/`productPath` codificam segmentos em links e requisições.

## 23. Loading, vazio e erro

Abra `src/lib/hooks/use-resource.ts`, `src/app/loading.tsx`, `src/app/error.tsx` e `src/components/products/product-detail.tsx`.

`loading.tsx` cobre carregamento de segmentos do Next.js. As consultas autenticadas precisam de seus próprios estados no browser. `useResource` cobre consultas simples: carregamento, dados, erro e recarga explícita, com cancelamento no unmount. Não é um sistema de cache.

A tela diferencia array vazio de erro. Após uma mutação confirmada, recarrega somente as consultas afetadas. Uma falha nessa recarga é exibida; não repete a mutação. O error boundary cobre falhas de renderização, enquanto erros esperados de HTTP ficam próximos à ação.

## 24. Organização de componentes

Abra `src/components/ui.tsx` e compare `dashboard.tsx`, `categories.tsx` e `settings.tsx`.

Extraímos componentes quando repetição ou responsabilidade justificou: apresentação de erro, campo, ações de formulário, feedback, cabeçalho. `ProductForm` é compartilhado entre criação/edição e `MovementForm` isola a ação de estoque. Botões e elementos simples continuam HTML com classes Tailwind.

Não há framework de formulários, modal global, toast manager ou store genérico. Formulários aparecem na própria página e a confirmação de remoção é explícita.

## 25. Testes

Abra `vitest.config.mts`, `tests/setup.ts` e os arquivos `*.test.ts(x)`.

- `api.test.ts`: envelope de erro, headers/query, 204, 401, conflitos, ausência de retry e os 18 endpoints.
- `auth.test.tsx`: `/auth/me` 200/401, nova consulta ao remontar, erro recuperável, logout previsto, falhas de logout e consultas canceladas.
- `permissions.test.tsx`: links por role, troca de Store, Store inativa e bloqueio visual de acesso direto.
- `pagination.test.tsx`: cursor, filtros, duplo clique, retry e respostas atrasadas.
- `format.test.ts`: conversão exata, limites numéricos e datas.
- `product-form.test.tsx`: interação real com o DOM do formulário e DTO enviado, categoria inativa, erro backend e precisão monetária.
- `login.test.tsx`: links de navegação para os destinos backend previstos, sem chamadas diretas aos provedores.

Execute `npm test`. O runner e o DOM simulado são dependências de desenvolvimento; não entram no frontend. Os testes substituem `fetch` somente no ambiente de teste e não criam endpoints ou credenciais de produção. Os testes não implementam sessão ou protocolos sociais. A validação integrada depende da evolução backend descrita no README.

## 26. Responsabilidades frontend/backend

O frontend apresenta dados, conduz formulários, controla estado da interface, envia DTOs e mostra falhas. O backend autentica, autoriza por Store, valida relações/estado, mantém saldo e registra movimentos atomicamente.

Não derive comportamento a partir do que seria “ideal”: Store inativa não bloqueia operações; categoria inativa não desativa produtos; histórico tem limite fixo de 100; personId é necessário para membros; saldo inicial não é um movimento; dinheiro não declara moeda; não existe catálogo público.

Qualquer evolução dessas regras começa por uma mudança explícita no backend/contrato. Neste laboratório, nenhuma delas foi contornada por proxy, acesso direto ao banco, endpoint fictício ou modo demo.
