**Veredito:** APROVADO

# Code Review: Fechamento do ADR-005 e lote de travas — rodada 2

**Task ID:** 2026-09-23_fechamento-adr005-e-travas
**Modelo:** fable (confirmado no system prompt)
**Status:** completed
**Próximo Agente:** orchestrator (task sensível: `done` só com `artifacts/security-sre.md` também positivo — re-auditoria do Security-SRE roda em paralelo a esta)
**Escopo revisado:** `git diff main...HEAD` (56a0e4a, 8a99083, 1660a9a); re-verificação focada em `git diff 8a99083..1660a9a` (17 arquivos, +430/−63)

---

## Sumário

O retrabalho fechou o defeito bloqueante e todos os demais achados da rodada 1, e cada fechamento está provado por payload ou cenário de smoke — não por afirmação. O scanner `comandos()` substitui o split pelo `SEP` de ancoramento e só divide em `;`, `&`, `|` fora de aspas, `$(…)` e crase; os oito payloads de regressão que eu tinha listado agora bloqueiam, as guardas de leitura passam, e a proposta ganhou cobertura que a produção não tem (herestring, `<<` colado ao interpretador, `rsync`, git reescrevendo a zona, normalização de `/./`). Os números declarados em `docs/patches/README.md`, `PENDENCIAS` item 2 e `coder.md` batem com a execução real. Sobra **um** ponto de qualidade não-bloqueante: a heurística "arquivo com extensão de script" na regra de heredoc é redundante com o que já detecta execução e cria um falso positivo novo em relação à produção — com correção verificada numa cópia. Sem CRITICAL, sem HIGH; 1 MEDIUM dentro do teto.

**Contagem de Issues:**
- 🔴 CRITICAL: 0  🟠 HIGH: 0  🟡 MEDIUM: 1  🔵 LOW: 2  💡 SUGGESTION: 2

---

## Re-verificação dos achados da rodada 1

| Achado (rodada 1) | Correção no 1660a9a | Prova executada nesta rodada | Estado |
|---|---|---|---|
| **HIGH-1** — split por segmento no `SEP` (`(`, `)`, `{`, `}`, crase, `$(`): 8 payloads que a produção bloqueava passavam | `docs/patches/block-dangerous-git.mjs:183–202` — scanner `comandos()` divide só em `;`/`&`/`\|` no nível de cima, fora de aspas, `$(…)` e crase; desbalanceado → segmento único; `paraCasar` normaliza `/./` e `//` | Os 8 payloads → BLOCK na proposta; `echo $(cat .claude/hooks/x.mjs)` e `(cat .claude/settings.json) ; rm tmp.txt` → ALLOW. Estão na suíte (linhas 186–195). Mais 12 sondas do scanner (`;` entre aspas, aspas desbalanceada em comentário, `FOO="a;b"`, `2>&1`, `$(…)` seguido de redirect) — todas no resultado esperado | Fechado |
| Regressão achada pelo próprio Coder — heredoc grava script e executa depois (`cat > s.sh <<EOF … EOF; sh s.sh`) | `executa()` olha o comando inteiro fora dos corpos (linhas 28–58) | 2 BLOCK + 1 ALLOW na suíte (197–199); reproduzido | Fechado (ver MEDIUM-1 sobre o alcance da heurística) |
| **HIGH do Security-SRE** — `bash<<'EOF'` colado | `executa()` separa palavra também em `<` e `>` (linha 31) | 5 BLOCK na suíte (176–180); produção também bloqueia (guarda de regressão) | Fechado |
| **MEDIUM do Security-SRE** — herestring | `HERESTRING` liga o modo conservador (linha 103) | `bash <<< 'rm -rf x'` e `bash<<<'git clean -fd'` → BLOCK; `grep main <<< '…'` → ALLOW | Fechado |
| **MEDIUM-1** — tabelas de complexidade atrasadas | `HANDOFF-PROTOCOL.md:107,112,117`, `ONBOARDING.md:77,80,81`, `00-orchestrator.md:133`, `ARCHITECTURE.md:264` | Leitura: Tester em toda não-trivial, três lentes paralelas com unanimidade + refutador, Épica fatiada; o parágrafo do HANDOFF agora diz quais linhas o script executa e quais não | Fechado (LOW-A é só um typo residual) |
| **MEDIUM-2** — lente ausente consumia rodada e podia escalar com motivo falso | `gbpa-task.js:213–220` (`blocked em: 'lentes'`) e `:228–231` (`blocked em: 'reviewer'`); `SKILL.md:48` explica | Smoke: "lente ausente → blocked em lentes, sem gastar rodada" e "reviewer sem retorno → blocked em reviewer" (verificam que `coder r2` e `refutador cego` não rodam) | Fechado |
| **MEDIUM-3** — épica com Planner nulo devolvia `fatiada` vazia | `gbpa-task.js:144` | Smoke: "épica com Planner sem retorno → blocked em planner" | Fechado |
| **LOW-1** "item 5" | `docs/patches/README.md:11`, `test-block-dangerous-git.mjs:80` → item 2 | grep | Fechado |
| **LOW-2** Architect ou Planner | `HANDOFF-PROTOCOL.md:82` | Leitura | Fechado |
| **LOW-3** "timestamps por args" | `ARCHITECTURE.md:185` | Leitura | Fechado |
| **LOW-4** "começam/nascem vazios" | `GOVERNANCE.proposto.md:58`, `ONBOARDING.md:38` → "esvazie … e apague" | Leitura; `GOVERNANCE.proposto.md` vs vigente continua com os mesmos 7 trechos (3 hunks) | Fechado |
| **LOW-5** zona protegida na skill | `SKILL.md:24` | Leitura | Fechado |
| **SUG-1** outras vias de escrita | `rsync` e `git checkout\|restore\|apply\|mv\|rm` em `MUTANTES` (linha 168); `node -e` documentado em Limites com o porquê | `rsync … .claude/hooks/`, `git checkout feat -- .claude/settings.json`, `git rm --cached .claude/hooks/x` → BLOCK; `git checkout -b`, `git restore --staged docs/x.md`, `git mv docs/a docs/b` → ALLOW | Fechado (resíduo em SUG-A) |
| **SUG-2** "todo documento da tabela" | `EVIDENCIAS-E-METRICAS.md:112` → "todo documento `.md`" | Leitura | Fechado |

## Números declarados vs execução real

| Prova | Declarado (README patches / PENDENCIAS / coder.md) | Executado | Bate |
|---|---|---|---|
| `test-block-dangerous-git.mjs` proposta | 128/128 | 128/128 | ✅ |
| idem, produção | 97/128; "dos 68 novos, produção falha em 31 (15 FP, 11 bypasses, 5 zona nova); 37 guardas" | 97/128 = 31 falhas: 15 `ALLOW esperado` + 16 `BLOCK esperado`; 60 + 68 = 128 casos contados no arquivo; 68 − 31 = 37 | ✅ |
| `test-check-reviewer-gate.mjs` | 14/14 · 11/14 | 14/14 · 11/14 | ✅ |
| `test-protect-guardrails.mjs` | 22/22 · 16/22 | 22/22 · 16/22 | ✅ |
| `scripts/test-gbpa-task.mjs` | 15/15 · 8/15 na versão do PR #6 | 15/15 · 8/15 (56a0e4a extraído para o scratchpad) | ✅ |
| `GOVERNANCE.proposto.md` vs vigente | 7 trechos | 3 hunks, 7 passagens (cabeçalho, §2.6, §3.1, §3.4, §5.4, §6.2, §6.4) | ✅ |
| Links relativos | 0 quebrados | 0 | ✅ |
| ISO-MAPPING | 25/9/0/6 = 40 · 22/8/0/3 = 33 | idem (recontagem mecânica) | ✅ |
| Escopo | nada em `GOVERNANCE.md`, `.claude/hooks/`, `.claude/settings.json`, `.claude/agents/` | `git diff --stat` confirma; árvore limpa | ✅ |

Única discrepância numérica está no próprio `coder.md` (LOW-B): a linha 11 diz "+46 casos" quando são +68.

---

## Issues Encontrados

### [MEDIUM] MEDIUM-1 — A heurística "arquivo com extensão de script" no heredoc é redundante e cria um falso positivo que a produção não tem
**Arquivo:** `docs/patches/block-dangerous-git.mjs` linha 29 (`const SCRIPT = /^\.\/|\.(?:sh|bash|zsh|py|js|mjs|cjs|ts|pl|rb|php|ps1)$/`) e linhas 31–32 (`executa`)
**Problema:** para pegar "heredoc grava script e executa depois", `executa()` trata como executor qualquer palavra com extensão de script — inclusive o **alvo do redirect**. Efeito: `cat > docs/patches/x.mjs <<'EOF'` cujo corpo cite `git push origin main`, ou `cat > src/app.ts <<'EOF'` com `// nunca rm -rf` num comentário, ligam o modo conservador e **bloqueiam** — a produção deixa passar (o texto não está em posição de comando). Ou seja, o patch que nasceu para acabar com o falso positivo de "documento que fala de push" reintroduz o mesmo falso positivo para arquivos `.mjs/.js/.ts/.py/.sh` — justamente os que o Coder escreve ao propor hooks e suítes em `docs/patches/`. Está registrado em "Limites conhecidos", mas a alternância de extensões não compra nada: todo caso real de "gravar e executar" tem um executor explícito (`sh s.sh`, `python3 s.py`, `source`, `.`) ou `./s`, que `EXECUTOR` e `^\.\/` já detectam.
**Evidência:** cópia do hook no scratchpad com `const SCRIPT = /^\.\//;` — suíte **128/128**; `cat > s.sh <<EOF…EOF; sh s.sh`, `chmod +x s && ./s` e `cat > s.py <<EOF…EOF; python3 s.py` continuam BLOCK; os dois falsos positivos acima viram ALLOW.
**Correção Esperada:** reduzir `SCRIPT` a `/^\.\//`; acrescentar à suíte, como ALLOW, `cat > docs/patches/x.mjs <<'EOF'\n// bloqueia git push origin main\nEOF` e, como BLOCK, `cat > s.py <<'EOF'\nimport os; os.system('git push origin main')\nEOF\npython3 s.py`; ajustar o bullet de "Limites conhecidos" (remover "ou um arquivo com extensão de script"). Não-bloqueante: o comportamento atual é conservador e documentado, e a ferramenta de escrita contorna.

---

### [LOW] LOW-A — Frase começa em minúscula depois do ponto
**Arquivo:** `multi-agents/HANDOFF-PROTOCOL.md` linha 107
**Problema:** "…o script não os chama. a coluna *Complexidade* vem do **recon**…".
**Correção Esperada:** "A coluna".

### [LOW] LOW-B — `coder.md` com contagem e descrição desatualizadas na tabela de `files_changed`
**Arquivo:** `tasks/2026-09-23_fechamento-adr005-e-travas/artifacts/coder.md` linhas 11 e 20
**Problema:** linha 11 diz "+46 casos" (60 → 128 são +68: 37 da rodada 1, 9 do Security-SRE, 22 desta rodada); linha 20 ainda descreve "lente ausente vira issue HIGH explícito para o Coder da rodada 2", comportamento que o próprio retrabalho substituiu por `blocked em: 'lentes'`. A seção "Retrabalho" está certa; a tabela de cima é o que um auditor lê primeiro.
**Correção Esperada:** "+68 casos" e "verificador sem retorno (lente, Reviewer, refutador) → `blocked`, sem consumir rodada".

### [SUGGESTION] SUG-A — Três resíduos para "Limites conhecidos" (rotear ao Security-SRE como postura, não como defeito)
**Arquivo:** `docs/patches/README.md` §"Limites conhecidos das travas"
- **Copiar DE dentro da zona bloqueia:** `cp .claude/hooks/x.mjs docs/patches/x.mjs` (já era assim em produção) e agora também `rsync -a .claude/hooks/ /tmp/backup/` (novo, por `rsync` ter entrado nos verbos). É leitura, mas a trava não distingue origem de destino. Vale uma linha dizendo que o caminho é `cat .claude/hooks/x.mjs > docs/patches/x.mjs` (passa: o redirect aponta para fora da zona) ou Read + Write.
- **`git apply /tmp/p.diff` sem caminho protegido no comando** reescreve a zona e passa (produção idem) — o verbo só conta com o caminho no mesmo comando.
- **Verbo produzido por substituição** (`` echo x | `echo tee` .claude/hooks/y ``) passa — mesma classe de "variável esconde o caminho", já documentada; basta estender a frase.

### [SUGGESTION] SUG-B — `GOVERNANCE.md` só é reconhecido com espaço ou `/` antes
**Arquivo:** `docs/patches/block-dangerous-git.mjs` linha 166 (`PROTEGIDO`)
**Problema:** `python -c "open('GOVERNANCE.md','w')"` passa na proposta e na produção porque, depois de `paraCasar` tirar as aspas, o nome fica precedido de `(`, e `PROTEGIDO` exige `^`, espaço ou `/`. Pré-existente; os caminhos `.claude/…` não sofrem disso.
**Correção Esperada:** `(^|[ \\/(,=])GOVERNANCE\\.md` e um payload BLOCK.

---

## Pontos Positivos

- **Correção na causa, não no sintoma.** Em vez de remendar o `SEP`, o Coder escreveu um scanner de comandos com estado (aspas, `$(…)`, crase) e o comportamento conservador em caso desbalanceado — e ao fazê-lo achou e fechou uma regressão própria (script gravado por heredoc e executado depois) antes que os gates a vissem.
- **Banco de payloads como memória do processo.** Os casos que derrubaram as duas primeiras versões da proposta estão na suíte com comentário de origem (linhas 175, 185, 200), e o README explica ao Tech Lead que a produção "já acertava" 37 deles — é a guarda de regressão que a regra da `PENDENCIAS:92` pede.
- **Coerência entre caminhos de erro do fluxo.** Lente, Reviewer e refutador sem retorno agora têm o mesmo destino (`blocked`, com `em:` dizendo onde), a skill explica que não conta como reprovação, e o smoke verifica que a rodada 2 não roda — falha de execução deixou de se disfarçar de falha de código.
- **Prosa alinhada ao script sem overclaim:** o `HANDOFF §6` passou a dizer exatamente quais linhas da tabela o script executa e quais ficam com a sessão principal.
- Números declarados nos três lugares (README dos patches, PENDENCIAS, coder.md) conferem com a execução, inclusive a decomposição 15 + 11 + 5 = 31.

## Checklist de Verificação
- [x] Corretude funcional — todos os critérios do brief agora com evidência (1 e 3, parciais na rodada 1, fechados)
- [x] Segurança (OWASP 2025) — regressões da rodada 1 e do Security-SRE fechadas e provadas; sem segredos; resíduos pré-existentes em SUG-A/SUG-B
- [x] Performance — n/a
- [x] Manutenibilidade — `comandos()` legível e comentado; MEDIUM-1 é a única dívida nova
- [x] Aderência à arquitetura — script coerente com HANDOFF §4/§6, ADR-005, ARCHITECTURE, 00-orchestrator
- [x] Tratamento de erros — MEDIUM-2/3 da rodada 1 fechados e cobertos por smoke

## Contexto para o Próximo Agente

**Orchestrator:** veredito positivo desta lente. Task sensível — `done` depende também do `artifacts/security-sre.md` da re-auditoria. MEDIUM-1, LOW-A/B e as sugestões podem ir para o Tech Lead como melhorias a aplicar no próprio lote (MEDIUM-1 é uma linha no hook + dois payloads, verificada) ou como backlog; nenhuma bloqueia a aplicação dos patches.

**Security-SRE (paralelo):** os resíduos de SUG-A (copiar de dentro da zona, `git apply` sem caminho, verbo por substituição) são postura pré-existente da trava, não regressão — registro para o seu artifact, se quiser mantê-los no radar.

**Tech Lead (ao aplicar):** o passo 4 do `docs/patches/README.md` manda rodar a suíte de novo contra `.claude/hooks/` após a cópia; com este lote o esperado passa a ser 128/128.
