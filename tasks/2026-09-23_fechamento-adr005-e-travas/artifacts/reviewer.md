**Veredito:** REPROVADO (11 issues)

# Code Review: Fechamento do ADR-005 e lote de travas

**Task ID:** 2026-09-23_fechamento-adr005-e-travas
**Modelo:** fable (confirmado no system prompt)
**Status:** completed
**Próximo Agente:** coder (rodada 2) — depois `security-sre ∥ reviewer` de novo
**Escopo revisado:** `git diff main...HEAD` (commits 56a0e4a e 8a99083) — 45 arquivos, 1509 inserções

---

## Sumário

O trabalho é sólido na maior parte: as suítes são reprodutíveis e os números batem com o declarado, o `gbpa-task.js` está correto contra a API da ferramenta Workflow, o fail-closed no refutador cego funciona, e a documentação de consistência fecha (ISO 40/33, links 0 quebrados, `check-pii` cumpre o critério). A reprovação vem de **um** defeito bloqueante: a nova versão do `block-dangerous-git.mjs` avalia a zona protegida "por segmento" e divide o comando também em `(`, `)`, `{`, `}`, `` ` `` e `$(` — com isso, oito payloads que a produção bloqueia hoje passam na proposta (inclusive `python3 -c`, verbo que o próprio `MUTANTES` lista). A suíte não tem nenhum caso desse tipo, então fecha 97/97 enquanto afrouxa a trava — exatamente o cenário que a regra "banco de payloads provando o caso novo sem afrouxar os antigos" existe para impedir. Os demais issues são ajustes de coerência entre prosa e script, e dois caminhos de erro do fluxo.

**Diff grande:** 1509 linhas em 45 arquivos está bem acima da faixa de 200–400 do `04-reviewer.md`. O brief reconhece ("complexa — ~30 arquivos, mas quase tudo documentação") e o fluxo foi manual; registro que deveria ter sido fatiado pelo Planner (código de trava e fluxo numa task; consistência documental noutra). Não é bloqueante, mas parte dos issues de coerência abaixo é consequência direta do tamanho.

**Contagem de Issues:**
- 🔴 CRITICAL: 0  🟠 HIGH: 1  🟡 MEDIUM: 3  🔵 LOW: 5  💡 SUGGESTION: 2

---

## Critérios de aceitação do brief — evidência

| # | Critério | Resultado | Evidência |
|---|---|---|---|
| 1 | `block-dangerous-git`: proposta 100%; produção falha exatamente nos casos novos | **Parcial** | `node docs/patches/test-block-dangerous-git.mjs docs/patches/block-dangerous-git.mjs` → 97/97; contra `.claude/hooks/` → 77/97, e as 20 falhas são todas do bloco 2026-09 (12 falsos positivos, 3 bypasses, 5 da zona nova — confere com o README). **Mas** a suíte não cobre a regressão do issue HIGH-1: a proposta afrouxa 8 casos que a produção bloqueia |
| 2 | `check-reviewer-gate` e `protect-guardrails`: proposta 100%, produção falha nos casos corrigidos | ✅ | 14/14 vs 11/14 (as 3 falhas são veredito fora da 1ª linha / citação); 22/22 vs 16/22 (as 6 falhas são `workflows/` e `agents/`) |
| 3 | `GOVERNANCE.proposto.md` só difere nos pontos listados; nenhum doc não-protegido contradiz | **Parcial** | `git diff --no-index` mostra exatamente 7 hunks: cabeçalho, §2.6, §3.1, §3.4, §5.4, §6.2, §6.4 ✅. §2.6 ↔ ONBOARDING §2/`praticas/00` coerentes; §5.4 ↔ README/ONBOARDING coerentes (ressalva LOW-4); §6.2 ↔ DESENVOLVIMENTO-COM-IA e ISO A.8.4/A.8.12 coerentes. **Contradição:** §3.1 diz "três lentes em paralelo" e o `HANDOFF §6` diz "Épica fatiada", mas `ONBOARDING.md:80,82`, `00-orchestrator.md:133` e `ARCHITECTURE.md:264` ainda dizem "Security-SRE antes do done" e "Épica: todos, em ciclos" (MEDIUM-1) |
| 4 | Nenhum caminho devolve `done` com verificador ausente; smoke cobre os caminhos alterados | ✅ | Leitura do script: `done` só na linha 257, após `verdict.aprovado === true` (unanimidade de 3 lentes ou voto único não-nulo) e, se sensível, refutador cego não-nulo com veredito positivo. `node scripts/test-gbpa-task.mjs` → 13/13; contra a versão de 56a0e4a extraída → 8/13, falhando nos 5 cenários novos (confere com o coder.md) |
| 5 | `check-pii.sh` não casa timestamp de 13 dígitos; casa celular formatado e cru | ✅ | 10 cenários em `fixtures/`: timestamp 13 díg. → 0, ID 12 díg. → 0, 17 díg. → 0, versão → 0, CPF cru → 0 (por desenho); `(11) 91234-5678` → 1, `11 91234-5678` → 1, `11912345678` → 1, CPF/CNPJ formatados → 1; repo → 0 |
| 6 | Links relativos resolvem; contagens do ISO-MAPPING fecham | ✅ | Script sobre todo `.md`: 0 quebrados (âncora `README.md#adotando-em-um-repositório` confere com o H2 da linha 52). Recontagem mecânica: 27001 = 25 OK · 9 PARCIAL · 0 LACUNA · 6 ORG = 40; 42001 = 22 · 8 · 0 · 3 = 33 — batem com os resumos das linhas 85 e 132 |
| 7 | PENDENCIAS em ordem, só o que depende de pessoa, com o comando de aplicação | ✅ | Itens 1–5 todos humanos (plano, aplicar lote, piloto, ISO 4.1/4.6/4.8/4.9, COMPETENCIA); 4.1 como PARCIAL; comandos de aplicação em `docs/patches/README.md` §Aplicar, linkado do item 2 |

**`gbpa-task.js` contra a API Workflow:** `export const meta` é literal puro ✅; `agent(prompt, {schema, agentType, label, phase, effort})` ✅; `parallel()` recebe thunks e todo consumidor trata `null` ✅; sem `Date`/`Math.random`/`import`/`require` ✅; `args` validado como objeto ✅. Os sete `agentType` (`architect-fable`, `planner-sonnet`, `spec-writer-sonnet`, `coder-sonnet`, `tester-sonnet`, `reviewer-fable`, `security-sre-fable`) existem no campo `name:` de `.claude/agents/` ✅, e cada um tem `Write` para gravar o artifact que o prompt pede ✅. Rodadas (`MAX_ROUNDS = 2`), OR de sensibilidade, três lentes com unanimidade, refutador cego só em sensível e `divergencia` batem com `HANDOFF §4.7/§4.8`, `ARCHITECTURE` → "Execução: o script" e `00-orchestrator` → "Modo script".

**Escopo:** nada em `GOVERNANCE.md`, `.claude/hooks/`, `.claude/settings.json`, `.claude/agents/` (`git diff --stat` confirma). Sem segredos, credenciais ou dado pessoal no diff.

---

## Issues Encontrados

### [HIGH] HIGH-1 — A zona protegida "por segmento" divide o comando em `(`, `)`, `{`, `}`, `` ` `` e `$(`: verbo e caminho caem em segmentos diferentes e a escrita passa
**Arquivo:** `docs/patches/block-dangerous-git.mjs` linha 172 (e a definição de `SEP`, linha 87)
**Problema:** a correção do falso positivo "verbo e caminho em comandos diferentes" foi implementada com `flat.split(new RegExp(SEP))`, reaproveitando o `SEP` que serve para ancorar posição de comando. Só que `SEP` inclui parênteses, chaves, crase e `$(` — caracteres que aparecem **dentro** de um comando (código Python inline, substituição de comando, grupo de `sed`, nome de arquivo com parênteses). As aspas já foram removidas em `flat`, então nem citar protege. Resultado: oito payloads que a **produção bloqueia hoje** passam na proposta. Verificado com `spawnSync` contra as duas versões:

| Payload | Produção | Proposta |
|---|---|---|
| `python3 -c "open('.claude/hooks/x.mjs','w').write('')"` | BLOCK | **ALLOW** |
| `python3 -c "import shutil; shutil.copy('/tmp/s.json','.claude/settings.json')"` | BLOCK | **ALLOW** |
| `bash -c "python3 -c \"open('.claude/hooks/x.mjs','w')\""` (modo wrapper) | BLOCK | **ALLOW** |
| `cp $(ls /tmp/x.mjs) .claude/hooks/y.mjs` | BLOCK | **ALLOW** |
| `mv $(echo /tmp/s.json) .claude/settings.json` | BLOCK | **ALLOW** |
| `echo x \| tee $(echo .claude/hooks/y.mjs)` | BLOCK | **ALLOW** |
| `sed -i 's/\(a\)/b/' .claude/hooks/x.mjs` | BLOCK | **ALLOW** |
| `cp '/tmp/x (1).mjs' .claude/hooks/y.mjs` | BLOCK | **ALLOW** |

`python3 -c` está explicitamente em `MUTANTES` (linha 162) — a trava declara cobrir e não cobre. A suíte não tem nenhum payload com parênteses ou `$(` no mesmo comando que o caminho protegido, então "proposta 97/97" dá ao Tech Lead a garantia de que "nenhuma trava afrouxou" (`docs/patches/README.md:21`) quando afrouxou. Isso fere a regra registrada em `PENDENCIAS-TECH-LEAD.md:92` e o critério 1 do brief.
**Código Atual:**
```js
const SEP = "[;&|(){}`]|\\$\\(";
// ...
if (zonaViaCd || flat.split(new RegExp(SEP)).some((s) => escreveNaZona(s.trim(), !WRAPPER))) {
```
**Correção Esperada:**
1. Separar os dois conceitos: `SEP` continua servindo ao ancoramento em posição de comando; para dividir em **comandos** use só separadores de comando de fato — `;`, `&&`, `||`, `|`, `&` (a quebra de linha já virou ` ; `). Ex.: `const CMD_SPLIT = /\s*(?:\|\||&&|[;|&])\s*/` e `flat.split(CMD_SPLIT).some(...)`. Parênteses, chaves, crase e `$(` **não** separam comandos para efeito de "mesmo comando".
2. Conferir que `escreveNaZona(s, ancorado=true)` continua casando com o verbo após `(` ou `$(` dentro do segmento (o `CMD` já admite `(` e `$(` como início — deve funcionar; testar).
3. Acrescentar à suíte, no bloco "o que a correção NÃO pode afrouxar", os 8 payloads da tabela como BLOCK, e pelo menos dois guardas ALLOW para não sobrecorrigir: `echo $(cat .claude/hooks/x.mjs)` (leitura em subshell) e `(cat .claude/settings.json) ; rm tmp.txt` (leitura em subshell seguida de remoção de arquivo qualquer).
4. Rodar de novo contra produção e proposta e **atualizar os números** em `docs/patches/README.md:11`, `PENDENCIAS-TECH-LEAD.md:29` e `artifacts/coder.md` (deixarão de ser 97/97 e 77/97).

---

### [MEDIUM] MEDIUM-1 — Tabelas de complexidade não acompanham o ADR-005 (Épica "todos em ciclos", Security-SRE "após o Reviewer", Tester só em complexa)
**Arquivos:**
- `multi-agents/HANDOFF-PROTOCOL.md` linha 107 ("Quem executa esta tabela é o script") e linhas 112, 113, 117
- `ONBOARDING.md` linhas 80 e 82
- `multi-agents/agents/00-orchestrator.md` linha 133
- `multi-agents/ARCHITECTURE.md` linha 264
**Problema:** o parágrafo novo do `HANDOFF §6` afirma que o script executa a tabela, mas a tabela não descreve o script: (a) linha 112 põe Simples/Média sem Tester e linha 113 põe Tester só em Complexa — o script roda o Tester em **toda** task não-trivial (`gbpa-task.js:180`, e o `meta.phases` diz o mesmo); (b) linha 117 diz "Security-SRE **após** Reviewer" — no script as três lentes são paralelas, e o próprio parágrafo da linha 107 diz isso três linhas acima; (c) Data-Engineer, AI-Engineer, DevOps, Documenter e Debugger estão na tabela e não existem no script — "quem executa esta tabela é o script" é overclaim. `ONBOARDING.md:82` ("Épica | Todos, em ciclos"), `00-orchestrator.md:133` e `ARCHITECTURE.md:264` contradizem frontalmente o `HANDOFF §6` linha 118 (Épica fatiada), o ADR-005 P5 e o `GOVERNANCE.proposto.md` §3.1. Um dev novo lê o ONBOARDING primeiro e aprende a regra antiga. É o que impede o critério 3 do brief de fechar.
**Correção Esperada:**
- `HANDOFF-PROTOCOL.md:107`: reescrever para "O script executa as linhas Trivial, Simples/Média, Complexa, SDD, Sensível e Épica desta tabela; Data-Engineer, AI-Engineer, DevOps e Documenter continuam sendo acionados pela sessão principal nos seus gatilhos (o script não os chama)". Linhas 112–113: "Simples / Média / Complexa | Plan (architect+planner) → Coder ∥ Tester → Reviewer" (ou explicitar que no script o Tester roda em toda não-trivial). Linha 117: "→ verificação em três lentes paralelas (Reviewer ∥ Security-SRE ∥ Tester) + refutador cego; em infra, Security-SRE também após o DevOps".
- `ONBOARDING.md:80`: "→ Reviewer ∥ Security-SRE ∥ Tester em paralelo + refutador cego"; linha 82: "Épica | Fatiada pelo Planner — cada fatia vira uma `/task`".
- `00-orchestrator.md:133` e `ARCHITECTURE.md:264`: "Épica | Planner (fatiar) | Nenhum — cada fatia é uma `/task` própria; a task-mãe não recebe código".

---

### [MEDIUM] MEDIUM-2 — Lente ausente consome uma rodada do Coder e pode escalar ao Architect com motivo falso
**Arquivo:** `.claude/workflows/gbpa-task.js` linhas 212–215 (e 227–231)
**Problema:** quando uma das três lentes não devolve (timeout, falha do agente), o script injeta um issue HIGH "lente sem retorno" e trata como REPROVADO. Isso é fail-closed (bom), mas o Coder da rodada 2 recebe "Corrija EXATAMENTE estes issues: … lente de verificação sem retorno" — não há nada para ele corrigir. Se a lente falhar de novo na rodada 2 (a mesma causa costuma persistir), o retorno é `escalado` ao Architect com `motivo: "o problema não é implementação"` — o problema é infraestrutura, e o Tech Lead vai ler um diagnóstico errado. O mesmo tipo de falha no refutador cego (linhas 242–247) devolve `blocked` com "rode de novo" — que é o tratamento certo. A incoerência entre os dois caminhos é o defeito.
**Código Atual:**
```js
if (lenses.length < 3) issues.push({ severity: 'HIGH', summary: `${3 - lenses.length} lente(s) de verificação sem retorno — sem veredito não há aprovação` })
verdict = { aprovado: lenses.length === 3 && lenses.every(v => v.aprovado), issues }
```
**Correção Esperada:** tratar lente ausente como o refutador cego: `if (lenses.length < 3) return result({ status: 'blocked', em: 'lentes', blockers: [\`${3 - lenses.length} lente(s) sem retorno — rode de novo\`], issues })` — sem consumir a rodada e sem virar `escalado`. Atualizar o cenário 9 do `scripts/test-gbpa-task.mjs` ("lente ausente nunca aprova…") para esperar `blocked` com `em: 'lentes'`, e o passo 6 do `SKILL.md` para explicar `em: lentes`. Se preferir manter o comportamento atual, documentar a escolha no ADR-005 e mudar o `motivo` do `escalado` para não afirmar "não é implementação" quando houver issue de lente ausente.

---

### [MEDIUM] MEDIUM-3 — Épica com Planner sem retorno devolve `fatiada` com zero fatias
**Arquivo:** `.claude/workflows/gbpa-task.js` linhas 143–147
**Problema:** se `agent()` do Planner resolver `null`, o script registra `sem retorno` no `events` mas devolve `status: 'fatiada', slices: []`. A `SKILL.md` (passo 6) manda "liste as fatias e diga: abra uma `/task` por fatia" — com lista vazia. Todos os outros `pointer()` nulos do script devolvem `blocked`; este é o único que devolve um status de sucesso sem resultado.
**Código Atual:**
```js
note('planner', out ? 'completed' : 'sem retorno', 'artifacts/planner.md')
return result({ status: 'fatiada', slices: out ? out.slices : [], ... })
```
**Correção Esperada:** `if (!out || !out.slices.length) return result({ status: 'blocked', em: 'planner', blockers: ['fatiamento sem retorno'] })` antes do `return` de `fatiada`. Acrescentar cenário ao smoke test: `"fatiar épica": null` → `blocked` em `planner`.

---

### [LOW] LOW-1 — "item 5 das pendências" aponta para o item errado depois da renumeração
**Arquivo:** `docs/patches/README.md` linha 11; `docs/patches/test-block-dangerous-git.mjs` linha 80 (comentário)
**Problema:** `PENDENCIAS-TECH-LEAD.md` foi reordenado nesta task: o antigo item 5 (falsos positivos) foi absorvido pelo item 2, e o item 5 hoje é "Preencher o `docs/COMPETENCIA.md`". O README dos patches manda o leitor para o item errado.
**Correção Esperada:** "Fecha os falsos positivos reportados em 2026-09-15 (`PENDENCIAS-TECH-LEAD.md`, item 2)"; no comentário da suíte, "(PENDENCIAS, lote de 2026-09-23, item 2)".

### [LOW] LOW-2 — `HANDOFF §4.7` diz que o fluxo escala "ao Architect ou ao Planner"; o script só escala ao Architect
**Arquivo:** `multi-agents/HANDOFF-PROTOCOL.md` linha 82
**Problema:** `gbpa-task.js:229` fixa `para: 'architect'`; `ADR-005:23` e `SKILL.md:46` dizem Architect. O protocolo é o único que promete uma decisão (Architect vs Planner) que o script não toma.
**Correção Esperada:** "o fluxo devolve `escalado` ao Architect, que decide se o problema é de spec/design (refaz) ou de tamanho (manda ao Planner fatiar)".

### [LOW] LOW-3 — "timestamps entram por `args`" não é verdade
**Arquivo:** `multi-agents/ARCHITECTURE.md` linha 185
**Problema:** o script recebe só `task_id` e `sensitive` (`SKILL.md:42`); `events` não carrega timestamp — quem põe a hora é a sessão principal ao anexar ao `run-log.md`.
**Correção Esperada:** "sem `Date`/`Math.random` — os `events` saem sem hora e a sessão principal carimba o timestamp ao anexar ao `run-log.md`".

### [LOW] LOW-4 — "começam/nascem vazios" contradiz o `cp -R docs` do README
**Arquivo:** `docs/patches/GOVERNANCE.proposto.md` linha 58; `ONBOARDING.md` linha 38
**Problema:** o `coder.md` registra que corrigiu isso no README ("nascem vazios contradizia o `cp -R docs`"; `README.md:171` agora diz "esvazie"), mas o texto proposto para a lei e o ONBOARDING continuam dizendo que os arquivos nascem vazios — o `cp -R docs` copia PENDENCIAS e patches cheios. Como o `GOVERNANCE.proposto.md` vai ser copiado à mão pelo Tech Lead, é melhor fechar antes.
**Correção Esperada:** nos dois lugares, "No repo novo, esvazie `docs/PENDENCIAS-TECH-LEAD.md` e `docs/patches/` (são o backlog do playbook, não do projeto) e apague `docs/COMPETENCIA.md` (fica só no repo do playbook)".

### [LOW] LOW-5 — A skill `/task` lista a zona protegida antiga
**Arquivo:** `.claude/skills/task/SKILL.md` linha 24
**Problema:** "Arquivo protegido (`GOVERNANCE.md`, `.claude/settings.json`, `.claude/hooks/`)" — o mesmo lote acrescenta `.claude/workflows/` e `.claude/agents/`, e a skill está neste diff.
**Correção Esperada:** acrescentar `.claude/workflows/` e `.claude/agents/` à lista (com "após o patch de 2026-09-23" se quiser marcar a transição).

### [SUGGESTION] SUG-1 — Registrar em "Limites conhecidos" os bypasses pré-existentes achados nesta revisão (rotear ao Security-SRE)
**Arquivo:** `docs/patches/README.md` §"Limites conhecidos das travas"
**Problema:** não são regressões do diff (produção também deixa passar), mas ficaram visíveis ao testar: `node -e "require('fs').writeFileSync('.claude/hooks/x.mjs','')"` (o `node` está garantido nas máquinas por §6.4), `rsync … .claude/hooks/`, `git checkout <ref> -- .claude/settings.json` / `git apply` / `git restore` (git reescreve a zona sem verbo de shell), `cp x .claude/./hooks/y` (o `./` escapa do regex), e "heredoc grava `.sh` e executa" (`cat > s.sh <<EOF … EOF; sh s.sh`). Auditoria sistêmica é do `security-sre`; aqui só registro. Sugestão mínima: `node +-e` e `rsync` em `MUTANTES`, e uma linha nos limites para o caminho via git.

### [SUGGESTION] SUG-2 — "Todo documento da tabela carrega o cabeçalho" deixou de ser verdade para as linhas novas
**Arquivo:** `docs/EVIDENCIAS-E-METRICAS.md` linha 112 (parágrafo "O cabeçalho é a evidência")
**Problema:** as linhas novas (`multi-agents/templates/`, `tasks/_TEMPLATE/`, `scripts/check-pii.sh`, `.claude/workflows/`, `.claude/skills/task/`, `scripts/test-gbpa-task.mjs`) não são `.md` com cabeçalho, e o `grep` da linha 117 não os acha.
**Correção Esperada:** "Todo documento `.md` da tabela carrega…; scripts, templates e a pasta de tasks têm a data no `git log` do arquivo".

---

## Pontos Positivos

- **Prova reprodutível e honesta.** Cada trava vem com suíte que roda contra produção e proposta, e os números do `coder.md`, do README dos patches e das PENDENCIAS batem com a execução (97/77, 14/11, 22/16, 13/8). A decomposição "12 falsos positivos + 3 bypasses + 5 zona nova = 20" confere caso a caso.
- **Heredoc tratado com critério.** Distinguir corpo-dado de corpo-código pelo consumidor (olhando a linha inteira, para pegar `cat <<EOF | bash`) e manter conservador quando não fecha é a decisão certa, e está documentada nos "Limites conhecidos".
- **`gbpa-task.js` correto contra a API** e fail-closed onde importa: `done` só sai por um caminho, após veredito validado; refutador cego sem retorno vira `blocked`; `sensitive` e `task_id` em todo retorno via `result()`.
- **Smoke test sem gastar quota** (`scripts/test-gbpa-task.mjs`) que roda o corpo do script como o runtime faz e diferencia a versão do PR #6 da corrigida — é o modelo certo para "prova exigida em qualquer mudança futura".
- **`check-reviewer-gate` proposto** fecha a brecha real (flag `m`) sem sobrecorrigir (BOM e linhas em branco admitidos).
- **Consistência documental** feita com método: recontagem mecânica do ISO, verificador de links, datas de cabeçalho por `git log`, e as ressalvas do `coder-docs.md` (retenção "até 5 anos", âncoras não testadas) registradas em vez de escondidas.

## Checklist de Verificação
- [x] Corretude funcional — critérios 2, 4, 5, 6, 7 ✅; 1 e 3 parciais (HIGH-1, MEDIUM-1)
- [x] Segurança (OWASP 2025) — sem segredos; regressão de controle em HIGH-1; achados sistêmicos roteados em SUG-1
- [x] Performance — n/a (hooks e script são O(n) sobre texto curto)
- [x] Manutenibilidade — `SEP` com dois papéis é a causa-raiz de HIGH-1; separar (ver correção)
- [x] Aderência à arquitetura — script coerente com HANDOFF §4/§6 e ADR-005; prosa das tabelas atrasada (MEDIUM-1)
- [x] Tratamento de erros — MEDIUM-2 e MEDIUM-3

## Contexto para o Próximo Agente

**Coder (rodada 2), nesta ordem:**
1. **HIGH-1** — separar o split de comandos do `SEP` de ancoramento em `docs/patches/block-dangerous-git.mjs`; acrescentar os 8 payloads BLOCK e 2 guardas ALLOW à suíte; rodar contra produção e proposta; atualizar os números em `docs/patches/README.md`, `PENDENCIAS-TECH-LEAD.md` e `artifacts/coder.md`.
2. **MEDIUM-1** — alinhar as tabelas de `HANDOFF §6`, `ONBOARDING §4`, `00-orchestrator` e `ARCHITECTURE` ao script.
3. **MEDIUM-2 / MEDIUM-3** — caminhos de erro do `gbpa-task.js` + cenários no smoke test + `SKILL.md` passo 6.
4. **LOW-1 a LOW-5** — referências e frases residuais.

**Security-SRE (roda em paralelo a esta rodada):** os bypasses pré-existentes de SUG-1 são achado sistêmico da trava, não do diff — vale um registro no artifact dele e, se couber, uma pendência humana.

**Orchestrator:** não marcar `done`. Este artifact reprova; a task volta ao Coder uma vez (`HANDOFF §4.7`).
