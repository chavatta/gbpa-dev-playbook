# ADR-006 — Uso próprio de assinatura individual em servidor próprio

**Status:** Proposto — vira Aceito com o merge do PR pelo Tech Lead
**Data:** 2026-09-24
**Decisores:** Tech Lead
**Revisão:** trimestral (junto com ADR-005), ou imediatamente se a página de legal e compliance do Claude Code, ou os termos de qualquer provedor usado sob esta exceção, mudarem
**Última revisão:** 2026-09-24
**Relacionado:** complementa `docs/ADR-005-orquestracao-nativa-do-fluxo.md` **sem superseder**: a regra geral dele (automação fora do produto exige API key) continua valendo e é o estado de retorno desta exceção. Atualiza a Nota da linha "Orquestração do fluxo de desenvolvimento" em `praticas/00`. Não altera `praticas/10` nem a linha Contrato/DPA do `praticas/00`. Usa a régua de evidência do ADR-004 (Decisão 3).

## Contexto

O ADR-005 (restrição 1) parafraseou a página de legal e compliance do Claude Code e dela tirou a regra registrada no `praticas/00`: automação fora do Claude Code — Agent SDK, `claude -p` em servidor, harness externo — exige API key. Falta tratar um caso: uma pessoa que quer automatizar, num servidor que só ela controla, os CLIs oficiais de agente que já usa com a **própria** assinatura, e só para si. Se esse caso for tratado como "harness externo", paga-se API por um uso que o texto do provedor não veda. Se for tratado como livre, abre-se caminho para o que o texto veda: intermediação, manipulação de credencial e uso que não é individual. Esta decisão fixa a fronteira.

### O texto vigente (consulta em 2026-09-24)

Fonte: https://code.claude.com/docs/en/legal-and-compliance (versão Markdown: mesma URL com `.md`), consultada em 2026-09-24. Trechos literais, só sem os links:

*Usage policy › Acceptable use:*

> Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK.

*Usage policy › Authentication and credential use* (seção integral):

> Claude Code authenticates with Anthropic's servers using OAuth tokens or API keys. These authentication methods serve different purposes:
>
> * **OAuth authentication** is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications. For the sign-in steps, see Logging in to your Claude account; for how Claude Code performs OAuth authentication, see Authentication.
> * **Developers** building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider. Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow.
>
> This does not restrict how customers provision and manage their own API keys or third-party inference provider credentials — for example, configuring an API key in a development environment, secrets manager, or machine image for use by the customer's own authorized users — provided the resulting usage is billed to the key owner under their agreement with Anthropic (or the applicable provider) and is not resold or intermediated as described above. Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code as described under *Can customers offer Claude Code in their products?* above.
>
> Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice.
>
> For questions about permitted authentication methods for your use case, please contact sales.

*Legal agreements › Can customers offer Claude Code in their products?* (as duas condições para quem embarca o Claude Code em produto ou serviço):

> * **The Claude Code binary must not be modified.** Claude Code must be installed and run as published by Anthropic, and customers may not remove, disable, or restrict any authentication method built into it (including methods that permit signing in with a Claude account or the user's own API key).
> * **Customers may not pay for, resell, or intermediate Claude usage on their end users' behalf.** Each end user must authenticate with their own Anthropic API key, Claude subscription plan credentials, or 3P inference provider credential (Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry). That usage is billed directly to the end user under their own agreement with Anthropic or, for third-party inference providers, with the applicable provider.

### Paráfrase do ADR-005 × texto vigente

| # | O ADR-005 (2026-09-15) diz | O texto vigente diz | Leitura deste ADR |
|---|---|---|---|
| 1 | Reserva o OAuth ao "uso ordinário do Claude Code e apps nativos" | OAuth "is intended exclusively for purchasers of … subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications" | A exclusividade se refere a **quem** usa (quem comprou o plano); "ordinary use" é a finalidade do OAuth, e o texto não a define. Rodar o binário nativo sem modificação continua sendo uso do Claude Code. O que precisa de limite é o "ordinary" → condição C5 |
| 2 | "Determina que automação via Agent SDK use API key" | API key para "Developers **building products or services** … including those using the Agent SDK" (*should*); e, em Acceptable use, "ordinary, individual usage of Claude Code **and the Agent SDK**" | A paráfrase generalizou. O que aciona a API key é construir produto ou serviço, não automatizar, e a própria página prevê o Agent SDK dentro do uso individual da assinatura. O texto não diz, nem para permitir nem para vetar, nada sobre automação pessoal em servidor próprio. É essa lacuna que este ADR ocupa, com confiança média |
| 3 | Orquestrar por fora "cai na zona que a Anthropic veda" | As vedações explícitas são: oferecer login Claude.ai em app próprio; "route requests through Free, Pro, or Max plan credentials on behalf of their users"; "collect, store, or intermediate … credentials or session tokens"; login concluído só "through Anthropic's own flow"; e, para produto, binário sem modificação e nada de "pay for, resell, or intermediate" | O texto veda o que envolve terceiro, credencial ou modificação, não a orquestração em si. Essas vedações viram as condições C1–C3 |
| 4 | *(não menciona)* | "Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code" | É o apoio mais próximo que o texto dá à exceção: binário intacto, assinatura própria, login pela própria pessoa, mesmo com o binário hospedado |
| 5 | "Pode bloquear sem aviso" | "may do so without prior notice" | Coincide e vira risco aceito |

Não há cópia do texto consultado em 2026-09-15, então não dá para saber se a página mudou ou se a paráfrase comprimiu o texto. Por isso este ADR guarda o trecho literal com data. Da próxima vez que a página for relida, compara-se com a citação acima, não com a memória.

## Decisão

1. **Exceção ao ADR-005, não revogação.** A automação de CLIs oficiais de agente com a assinatura individual de quem os opera (o **titular**), num servidor sob controle exclusivo dessa pessoa e para uso exclusivo dela, é permitida **enquanto as cinco condições do item 2 valerem ao mesmo tempo**. Fora disso vale o ADR-005: API key com orçamento. Os termos usados:
   - **Titular:** quem contratou o plano (ou detém o assento nominal num plano de equipe) e fez o login no CLI. Em assento de plano comercial, a política do administrador da organização prevalece sobre este ADR.
   - **Servidor próprio:** máquina física, VM ou VPS alugada em que só o titular tem acesso administrativo e acesso à conta de sistema operacional que roda os CLIs. O critério é o controle, não a propriedade. Infraestrutura que executa agentes para outras pessoas não é servidor próprio.
   - **Ferramenta de orquestração:** qualquer software que dispare os CLIs (script, fila, portal, workflow), do playbook ou não.

2. **As cinco condições, cada uma com o controle que a garante e a evidência que um auditor confere sozinho** (régua do ADR-004):

   | # | Condição | Controle | Evidência verificável |
   |---|---|---|---|
   | C1 | **Uso só do titular.** Nenhum terceiro usa a ferramenta, dispara execução ou recebe resultado de execução como serviço | Conta única na ferramenta (a do titular), sem cadastro. Nada exposto na internet pública: acesso por rede privada ou túnel, e com login próprio mesmo assim. Só o titular acessa o servidor como administrador e a conta de SO dos CLIs | Configuração versionada (contas = 1; escuta só em interface privada); lista de contas do SO com acesso; log de acesso sem nenhuma identidade além da do titular |
   | C2 | **Sem revenda nem intermediação.** Nenhuma requisição de outra pessoa passa pela assinatura | A ferramenta só aceita pedido criado pelo titular. Nenhuma entrada de terceiro (webhook, fila, chat, e-mail, API aberta) vira execução, e ninguém é cobrado. Trabalho que o titular decidiu fazer no próprio papel é dele, mesmo que a demanda tenha vindo de outra pessoa. O vedado é a ferramenta virar o canal por onde terceiros obtêm execução | Inventário das entradas da ferramenta, todas autenticadas como o titular; nenhum endpoint público de disparo |
   | C3 | **Binário oficial, login do provedor, credencial intocada.** O CLI vem do canal oficial e não é modificado. O login é feito pelo titular no fluxo do provedor. A ferramenta nunca lê, copia, guarda ou repassa credencial ou token de sessão | Instalação pelo canal oficial, com versão fixada. Login interativo feito pelo titular no próprio CLI. A ferramenta não tem tela nem rota que receba credencial e não abre o diretório de credenciais do CLI. Ela só conhece o estado do login pelo comando de status do próprio CLI. Ambiente por allowlist (item 3) | Versão e origem do binário registradas em cada execução. Teste ou revisão que falha se a ferramenta referenciar caminho de credencial do CLI. Nomes (nunca valores) das variáveis passadas a cada execução. Prova de assinatura por execução (item 4) |
   | C4 | **Disparo pelo titular ou por regra criada por ele, sem loop sem teto** | Toda execução tem origem registrada: ação do titular ou id de uma regra criada por ele. Regras automáticas vêm desligadas e, quando ligadas, têm teto por hora e por dia. Retrabalho tem teto (ADR-005: 2 rodadas). Há um interruptor geral que para tudo | Log de auditoria com a origem de cada execução (a consulta de execuções sem origem devolve 0); definição de cada regra com autor, teto e data; eventos de parada por teto |
   | C5 | **Concorrência e volume de uso individual ordinário**, com limites configuráveis e pausa ao sinal de limite | Limites de concorrência e de volume diário por provedor de assinatura, com padrão conservador (item 5). Ao sinal de limite, o provedor fica pausado até o reset informado: a ferramenta não tenta de novo, não troca de conta e não liga uso excedente pago | Configuração de limites versionada; pico de concorrência observado ≤ limite; eventos de pausa com o sinal que os causou |

3. **Ambiente por allowlist.** Toda execução de assinatura roda com o ambiente montado por **lista de permissão**. As variáveis de chave de API, e também as que selecionam ou injetam outra credencial, nunca passam. Lista de bloqueio não serve porque a precedência de credenciais faz a chave vencer o login sem aviso, e toda lista de bloqueio acaba esquecendo alguma variável. Exemplo, na doc oficial de autenticação do Claude Code (https://code.claude.com/docs/en/authentication#authentication-precedence, consultada em 2026-09-24): sobre `ANTHROPIC_API_KEY`, "In non-interactive mode (`-p`), the key is always used when present". Acima do login `/login` também ficam `CLAUDE_CODE_USE_BEDROCK`/`_VERTEX`/`_FOUNDRY`, `ANTHROPIC_AUTH_TOKEN`, `apiKeyHelper`, `CLAUDE_CODE_OAUTH_TOKEN` e as variáveis de profile/federação. Há desvios que moram em arquivo de configuração do CLI e não no ambiente, como o `apiKeyHelper` do Claude Code. Esses a ferramenta precisa detectar e então recusar a execução, ou excluir por um mecanismo documentado do próprio CLI — **[VERIFICAR-EMPÍRICO] por provedor**. Enquanto não houver verificação, vale a degradação: execução recusada.

4. **Prova de assinatura por execução.** O comando de status do CLI, rodado antes da execução, é necessário mas **não basta**. No CLI da OpenAI, versão 0.156.1, o código-fonte mostra que `codex login status` carrega a autenticação com `enable_codex_api_key_env` desligado, ou seja, ignora `CODEX_API_KEY` (`codex-rs/cli/src/login.rs`, `run_login_status`). Já o `codex exec` liga esse parâmetro (`codex-rs/exec/src/lib.rs`), e com ele ligado vale a regra "API key via env var takes precedence over any other auth method" (`codex-rs/login/src/auth/manager.rs`; todos em https://github.com/openai/codex/tree/rust-v0.156.1, conferidos em 2026-09-24). O status mostra a assinatura e a execução cobra na API. Por isso, durante a execução, conta como prova o sinal do próprio CLI que identifica a fonte da credencial, quando o CLI o expõe. No Claude Code, o `system/init` do `stream-json` trouxe `"apiKeySource":"none"` numa execução real por assinatura (versão 2.1.229). Valor diferente do observado em execução de assinatura ⇒ cancelar e tratar como quebra de C3. Para provedor sem sinal por execução (**[VERIFICAR-EMPÍRICO]**), a degradação é esta: só disparo manual do titular (sem regra automática para esse provedor) e alerta de "cobrança não verificável" em cada execução.

5. **Limites de partida** (configuráveis; aumentar um padrão é decisão do titular registrada com data):

   | Limite | Padrão | Racional |
   |---|---|---|
   | Execuções simultâneas por provedor de assinatura | **2** | O que uma pessoa faz com dois terminais |
   | Execuções por provedor de assinatura por dia | **Teto obrigatório**; referência 80 | ~10 tasks por dia × 5–8 execuções por task no fluxo do ADR-005 |
   | Regras automáticas | **Desligadas.** Quando ligadas: ≤ 1 disparo por hora e ≤ 10 por dia, por regra | Nada de loop contínuo |
   | Rodadas de review por task | **2** | Teto do ADR-005; a terceira é decisão humana |
   | Sinal de limite da assinatura | **Pausa** o provedor até o reset informado, ou 30 min se nenhum for informado | Pausar, não insistir |
   | Uso excedente / crédito pago | **Nunca** ligado pela ferramenta. Sinal de uso excedente em curso ⇒ interromper e pedir decisão | Não virar cobrança por outro caminho. Se um CLI consome crédito pago sozinho depois do limite é **[VERIFICAR-EMPÍRICO]** por provedor; a degradação é o titular desligar o crédito extra na conta do provedor |

6. **Quebrou uma condição, volta o ADR-005.**
   - **Quebra detectada:** segunda conta, disparo sem origem, fonte de credencial diferente da assinatura, teto estourado sem parada. A ferramenta suspende as execuções de assinatura do provedor afetado (de todos os provedores, se a quebra for de C1 ou C2) e registra o motivo. Retomar exige decisão do titular, registrada junto com a causa corrigida.
   - **Quebra estrutural:** a ferramenta passa a atender outra pessoa ou a equipe, ou o servidor passa a ser compartilhado. A exceção cai de vez: API key com orçamento, isto é, limite de gasto no próprio provedor mais alerta, conforme o ADR-005.
   - **Duas pessoas, cada uma com a sua assinatura, na mesma ferramenta ou no mesmo servidor:** não são duas exceções, é serviço compartilhado, e fica fora.

7. **Vale para qualquer provedor de assinatura.** A exceção não é da Anthropic. Um provedor entra quando quatro passos estiverem feitos:
   - (a) termos vigentes lidos e citados literalmente, com data, no registro de adoção (item 10). Se o termo vedar esse uso ou exigir API key para ele, o provedor fica fora;
   - (b) lista, tirada da doc oficial, das variáveis e configurações que desviam cobrança ou trocam identidade (é o mínimo que o teste da allowlist cobre);
   - (c) prova de assinatura por execução ou a degradação do item 4;
   - (d) sinal de limite e forma de detectá-lo (texto, evento ou código de saída). Fica **[VERIFICAR-EMPÍRICO]** até ser observado numa execução real; até lá, falha não classificada que se repete é tratada como sinal de limite e o provedor é pausado.

   Enquanto os quatro passos não estiverem feitos, o provedor roda por API key (ADR-005).

8. **A exceção não resolve dado de cliente em plano de consumidor.** Ela muda o canal de autenticação e cobrança, não a classe do contrato. Plano de consumidor continua sem DPA: dado **Confidencial** não entra no contexto (`praticas/10` §3, condição 2; linha Contrato/DPA do `praticas/00`), e dado **Restrito** não entra nunca (`GOVERNANCE.md` §7.1). O controle é uma lista de projetos × provedores permitidos, com a classe de dado de cada projeto: a ferramenta recusa executar projeto Confidencial em provedor cujo plano seja de consumidor. A ferramenta de orquestração também não vira "ferramental aprovado" por causa deste ADR (`praticas/10` §3, condição 1). Para projeto com dado Confidencial, ela precisa constar do `praticas/00` desse projeto.

9. **O resto do playbook continua valendo.** Continuam os gates do ADR-005 (Reviewer; Security-SRE em task sensível), os hooks, o `permissions.deny` e a branch protection. A ferramenta não passa flag que desligue permissões ou a confiança de hooks do CLI, que foi um dos motivos do descarte do Ruflo no ADR-005. Task executada sob esta exceção registra no `run-log.md` que rodou sob o ADR-006, com o provedor e a versão do CLI.

10. **Registro de adoção.** Quem adota a exceção mantém um registro versionado junto da configuração da ferramenta, com: titular; servidor; provedores e plano de cada um; trecho literal dos termos de cada provedor, com data; variáveis proibidas por provedor; limites vigentes; e o estado atual das cinco condições, que a ferramenta deve mostrar. No projeto cujas tasks rodam assim, a Nota da linha "Orquestração do fluxo de desenvolvimento" do `praticas/00` cita este ADR.

## Alternativas consideradas

1. **Manter o ADR-005 sem exceção** (API key para toda automação em servidor). É conforme com a leitura mais estrita, mas cobra por API um uso que o texto vigente não veda e que a página prevê ("ordinary, individual usage of Claude Code and the Agent SDK"). Descartada como regra geral; continua sendo o estado de retorno.
2. **Exceção sem condições verificáveis** ("uso próprio pode"). Sai barata, mas nem um auditor nem o provedor conseguem distingui-la de intermediação, e ela deriva sem ninguém notar: basta um colega pedir "roda pra mim". Descartada.
3. **Token de longa duração guardado e injetado pela ferramenta** (no Claude Code, `claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN`, documentado para "CI pipelines, scripts"). Dispensa o login interativo, mas a ferramenta passaria a guardar e repassar token de sessão, que é o que a página veda a *developers* e o que C3 proíbe. Descartada. O login é o do próprio CLI, feito pelo titular. O custo é refazê-lo à mão quando expirar: a ferramenta detecta pelo status e pausa.
4. **Rodar só na máquina pessoal, nunca em servidor.** O texto não distingue máquina, então a questão de conformidade não muda; perde-se a execução desassistida. Descartada.
5. **Pedir confirmação por escrito ao comercial do provedor antes de decidir** (a página indica "contact sales" para dúvida sobre método de autenticação). Aumenta a confiança, mas não é pré-requisito: fica como ação opcional do Tech Lead (ver Confiança).

## Consequências

**Positivas:** a assinatura existente passa a servir à automação pessoal, dentro do texto vigente. A conformidade pode ser verificada condição a condição (régua do ADR-004), em vez de apenas declarada. O retorno ao ADR-005 é definido e automático. A mesma regra vale para qualquer provedor.

**Negativas / custos:** a ferramenta de orquestração ganha requisitos obrigatórios (conta única, origem de cada execução, ambiente por allowlist, prova de assinatura, limites, pausa), então não basta chamar o CLI. O login expira e exige ação manual do titular. Os limites conservadores deixam capacidade ociosa. Cada provedor novo custa uma leitura de termos e uma lista de variáveis. A página precisa ser relida a cada trimestre.

**Risco aceito:** a página não define "ordinary" nem trata de automação pessoal em servidor, e a leitura deste ADR pode divergir da do provedor, que "may do so without prior notice". No pior caso a conta é suspensa ou limitada: a automação para e o trabalho segue manual ou por API key (ADR-005). Os limites conservadores e a pausa ao sinal de limite reduzem a chance de o padrão de uso parecer não individual.

**Confiança: média.** Sobe para alta com confirmação por escrito do provedor (alternativa 5). Cai para baixa se a página passar a tratar de automação ou de servidor sem as ressalvas acima.

## Revisão

Trimestral, junto com o ADR-005: reler a página e comparar com o trecho literal acima; se houver divergência, reavaliar antes de continuar usando a exceção. Imediata se: a página ou os termos de um provedor em uso mudarem; o provedor sinalizar abuso ou limitar a conta; uma condição for quebrada de forma estrutural; ou a ferramenta passar a ter mais de um usuário.
