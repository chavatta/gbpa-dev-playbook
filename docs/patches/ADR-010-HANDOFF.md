# Handoff — aplicar o ADR-010 localmente

> **Para:** Tech Lead, no próprio terminal, **fora do Claude Code** · **Branch:** `claude/epic-newton-428dl1` · **Gerado em:** 2026-10-23
> Apague este arquivo no passo 8, junto com os demais propostos. Patch pendente é dívida, não acervo.

## Onde parou

A sessão na nuvem fez tudo o que um agente pode fazer: o ADR-010 aceito, o script de plano com a suíte dele, a pré-checagem do plano no `/task`, o manual do Orchestrator, as tabelas de modelo, as notas nos ADRs e os testes. Ficou bloqueado, **de propósito**, só o que está em zona protegida (`GOVERNANCE.md` §6.2). O hook barrou até um `cp` que só lia de `.claude/workflows/`.

| Destino (protegido) | Proposto | O que muda |
|---|---|---|
| `.claude/agents/*.md` (13) | `docs/patches/agents/*.md` | `model:` passa a ser a família; `effort:` explícito; Planner, Tester, DevOps e Coder viram `-sonnet`; a autoverificação confere família + piso de versão; o Coder aceita Opus na escalada; o Security-SRE confere `GBPA_PLANO`; o Orchestrator ganha a regra de escalada |
| `.claude/workflows/gbpa-task.js` | `docs/patches/gbpa-task.js` | `agentType` `planner-sonnet`, `coder-sonnet`, `tester-sonnet`; o Coder recebe `model: 'opus'` em task sensível, migração de dados, complexidade `complexa` ou rodada 2 |

**Os dois vão juntos:** o script chama os agentes pelos nomes novos. Aplicar só um quebra o `/task`.

## Pré-requisitos

- Git, Node.js ≥ 18.
- **Claude Code ≥ 2.1.293** (`claude --version`). É a versão em que o alias `haiku` passou a resolver para o Haiku 5.5. Abaixo dela, o Documenter roda em Haiku 4.5 e bloqueia pelo piso. O alias `sonnet` aponta para o Sonnet 5.5 desde a 2.1.284, e o `opus` para o Opus 5.5 desde a 2.1.280.
- Árvore limpa (`git status`).

## Passo a passo

### 1. Trazer a branch

```bash
git fetch origin claude/epic-newton-428dl1
git checkout claude/epic-newton-428dl1
git pull origin claude/epic-newton-428dl1
```

### 2. Linha de base (antes de copiar)

```bash
node scripts/test-gbpa-task.mjs docs/patches/gbpa-task.js   # esperado: 36/36
node scripts/test-gbpa-task.mjs                             # esperado: 30/36 (falham só os 6 casos do ADR-010)
node scripts/test-plano-assinatura.mjs                      # esperado: 18/18
```

Qualquer número diferente: **pare**. A branch não é a que foi testada.

### 3. Ler os diffs (são lei, não código)

```bash
git diff --no-index .claude/agents docs/patches/agents
git diff --no-index .claude/workflows/gbpa-task.js docs/patches/gbpa-task.js
```

O esperado é cerca de 10 linhas por agente (frontmatter e seção "Modelo designado") e 9 no script. Qualquer coisa fora disso não é deste patch.

### 4. Copiar (fora do Claude Code)

macOS / Linux:

```bash
cp docs/patches/agents/*.md .claude/agents/
cp docs/patches/gbpa-task.js .claude/workflows/gbpa-task.js
```

Windows (PowerShell):

```powershell
Copy-Item docs/patches/agents/*.md .claude/agents/ -Force
Copy-Item docs/patches/gbpa-task.js .claude/workflows/gbpa-task.js -Force
```

### 5. Conferir depois da cópia

```bash
node scripts/test-gbpa-task.mjs                             # agora contra a produção: 36/36
for t in docs/patches/test-*.mjs; do h=$(basename "$t" .mjs); node "$t" ".claude/hooks/${h#test-}.mjs" | tail -1; done   # todas 100%
grep -h "^name:\|^model:\|^effort:" .claude/agents/*.md | paste - - -
```

O `grep` tem de listar 13 trios. `orchestrator` não tem sufixo; Planner, Tester, DevOps e Coder com `-sonnet`/`sonnet`; Documenter com `haiku`/`medium`; Security-SRE com `fable`; o resto com `-opus`/`opus`. Todos `high`, menos o Documenter.

### 6. Declarar o plano desta máquina

```bash
node scripts/plano-assinatura.mjs
# Team/Enterprise:   node scripts/plano-assinatura.mjs --assento premium   (ou standard)
# detecção errada:   node scripts/plano-assinatura.mjs --plano max         (pro | max | team-standard | team-premium | enterprise-standard | enterprise-premium | api)
```

O script diz o plano, de onde veio e em que modelo o Security-SRE vai rodar. Ele grava só em `.claude/settings.local.json`, que não vai para o git. **Feche e reabra o Claude Code**, porque o `env` do settings só carrega no startup. Depois, dentro da sessão nova:

```bash
node scripts/plano-assinatura.mjs --verificar   # esperado: saída 0, "Plano X · Security-SRE em ..."
```

Cada dev da equipe repete este passo na própria máquina depois do merge.

### 7. Validar no Claude Code (fecha as pendências 8 e 9)

Na sessão nova, na raiz do repo:

1. **`/agents`**: a lista tem de trazer `coder-sonnet`, `planner-sonnet`, `tester-sonnet` e `devops-sonnet`, e nenhum `-opus` nesses quatro.
2. **Autoverificação por família.** Peça: *"delegue ao planner-sonnet: diga só em que modelo você roda e devolva o ponteiro"*. O `model` do ponteiro tem de ser `claude-sonnet-5-5` ou mais novo, sem `blocked`. Repita com o `documenter-haiku` (esperado `claude-haiku-5-5`).
3. **Security-SRE pelo plano (pendência 8).** Peça: *"delegue ao security-sre-fable: rode `printenv GBPA_PLANO`, diga em que modelo você roda e devolva o ponteiro"*.
   - Máquina **Pro** ou assento standard: tem de vir `claude-opus-5-5`. Se vier Fable, o remapeamento por `settings.local.json` não pegou em subagente. Pare e registre na pendência 8; até resolver, use o Security-SRE só em máquina Max.
   - Máquina **Max** ou assento premium: tem de vir `claude-fable-5-1` ou mais novo.
4. **Detecção do plano (pendência 9).** Anote o que `claude auth status --json` mostra em `subscriptionType` numa máquina Pro e numa Max. Se a Max aparecer como `pro`, registre; o contorno é `--plano max`.
5. **Escalada do Coder** (opcional, gasta cota): uma `/task` pequena marcada como sensível. Em `/workflows`, o agente `coder r1` tem de rodar em Opus.

### 8. Fechar o ciclo (`docs/patches/README.md`)

1. Apague os propostos, **mantendo as suítes**:
   ```bash
   git rm -r docs/patches/agents docs/patches/gbpa-task.js docs/patches/ADR-010-HANDOFF.md
   ```
2. Em `docs/patches/README.md`: tire a linha do ADR-010 de "Pendente" e acrescente em "Histórico":
   `| 2026-10-23 | ADR-010 — 13 agentes (família, effort, piso, nomes -sonnet) e gbpa-task.js (agentType -sonnet, escalada do Coder) | test-gbpa-task 36/36 contra .claude/workflows/ |`
3. Em `docs/PENDENCIAS-TECH-LEAD.md`: mova o item 7 (e o 8 e o 9, se o passo 7 fechou) para "Resolvidas", com data e como fechou.
4. Em `docs/ADR-010-familias-e-esforco-por-agente.md`, no **Status**: troque "Vigora quando o patch ... for aplicado; até lá, os agentes seguem o ADR-001" por "Aplicado em <data>".

### 9. Commit, push e PR

```bash
git add -A
git commit -m "ADR-010 aplicado: agentes por família e gbpa-task.js com Coder em Sonnet e escalada"
git push -u origin claude/epic-newton-428dl1
```

Abra o PR da branch para `main`. A branch protection exige o PR.

## Se algo der errado

- **Voltar os agentes e o script** (antes do commit do passo 9):
  ```bash
  git checkout -- .claude/agents .claude/workflows/gbpa-task.js
  ```
  Depois do commit, use `git revert` do commit do passo 9. Nunca reescreva o histórico (`GOVERNANCE.md` §6).
- **Uma família nova piorou algo:** volte a família inteira sem mexer nos agentes, com o `env` do `.claude/settings.json` (Tech Lead), por exemplo `"ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5-5"`. Registre no ADR-010.
- **Coder em Sonnet com retrabalho demais:** é o critério de recuo do ADR-010 (reprovação +50% ou custo por fatia concluída sem queda). O recuo é trocar `model: sonnet` por `model: opus` e `coder-sonnet` por `coder-opus` no agente e no script, pelo mesmo caminho de patch.
- **Agente devolvendo `modelo divergente`:** confira `claude --version` (≥ 2.1.293) e se a sessão principal não está numa versão antiga da mesma família. O subagente herda a versão exata da sessão quando a família é a mesma; o caso típico é sessão em Sonnet 5 e subagente `sonnet`.
