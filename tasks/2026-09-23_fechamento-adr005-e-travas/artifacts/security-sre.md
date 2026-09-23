**Veredito:** REPROVADO (1 achado)

# Security Review (rodada 2): 2026-09-23_fechamento-adr005-e-travas

**Task ID:** 2026-09-23_fechamento-adr005-e-travas
**Status:** completed
**Modelo:** fable (Fable 5.1) — família confere com o agente designado (ADR-002)
**Próximo Agente:** coder (correção de 1 achado HIGH em `docs/patches/block-dangerous-git.mjs`) — última rodada antes de escalar ao humano (HANDOFF §4.7)

---

## Sensibilidade da Entrega
Infra/pipeline do próprio processo (travas mecânicas + script que devolve `done`). Classe Interna, confere com o brief. Ativo em risco: confiabilidade das travas contra o agente semi-confiável.

## Re-verificação dos achados da rodada 1 (todos fechados)
Reproduzido por execução diferencial (proposta vs produção), payloads em `scratchpad/probe3.mjs`:

| Achado r1 | Correção aplicada | Verificação |
|-----------|-------------------|-------------|
| **[HIGH] `interpretador<<EOF` colado descartava o corpo** | `executa()` agora separa a palavra também em `<`/`>` (linha 31), então `bash<<EOF` → `bash` casa `EXECUTOR` e liga o modo conservador | `bash<<'EOF'`, `python3<<'EOF'`, `/bin/bash<<'EOF'`, `bash<<-'EOF'` → **BLOCK** na proposta. Fechado. |
| **[MEDIUM] herestring `<<<` executava sem análise** | `HERESTRING` (linha 103) liga `WRAPPER` para `interpretador … <<<` | `bash <<< '…'` e `bash<<<'…'` → **BLOCK** na proposta (produção ainda ALLOW; a proposta é mais estrita). Fechado. |
| **[LOW] escrita na zona por `node -e`/`perl -e`/`ruby -e`** | documentado em `docs/patches/README.md` → "Limites conhecidos", com o racional (bloquear os três vetaria leitura comum; `protect-guardrails`+`deny` cobrem a ferramenta de edição) | Presente e correto. Aceito como limite. |
| **[LOW] `settings.proposto.json` `Read(./.env)`** | cobertura real por `Read(**/.env)`/`Read(**/.env.*)`; sem afrouxamento | Sem mudança de risco. Aceito. |

Também confirmei que a **regressão de segmento** que o Reviewer achou em paralelo foi fechada: `python3 -c "…shutil.copy('x','.claude/settings.json')"`, `cp $(ls x) .claude/hooks/y.mjs` e `sed -i 's/\(a\)/b/' GOVERNANCE.md` → **BLOCK**. O scanner `comandos()` (linhas 183–200) resiste a: aspas aninhadas (aspas simples não deixam `\` escapar; aspas duplas contêm `'`), `$(…)` e crase balanceados (contador `sub`/`crase`, o separador dentro não divide), `$(` desbalanceado (retorna `[s]` — segmento único, conservador). Não achei divisão indevida que separasse verbo de caminho protegido.

## Achados

### [HIGH] Heredoc consumido por CLI de banco (`psql`/`mysql`) descarta o corpo e cega a trava de DDL — regressão vs produção
**Onde:** `docs/patches/block-dangerous-git.mjs` linhas 28–58 (`stripHeredocs`/`executa`) em interação com a checagem de DDL na linha 151
**Cenário de exploração (reproduzível, mesmo mandato — a proposta afrouxa um bloqueio que a produção tinha):**

```
psql dbname <<'EOF'      →  DROP TABLE users;      ALLOW (proposta)  vs  BLOCK (produção)
psql <<'EOF'             →  TRUNCATE logs;          ALLOW             vs  BLOCK
mysql db <<'EOF'         →  DROP DATABASE app;      ALLOW             vs  BLOCK
psql -f - <<'EOF'        →  DROP TABLE users;       ALLOW             vs  BLOCK
```

`psql`/`mysql` executam o **stdin** como SQL — e o heredoc é a forma canônica de rodar DDL multi-statement por essas CLIs. A nova regra de heredoc só mantém o corpo (e liga o modo conservador) quando `executa(fora)` reconhece um executor; `executa` só conhece **shells/scripts** (`EXECUTOR`/`SCRIPT`), não CLIs de banco. Como `psql`/`mysql` não estão nessa lista, `executa(fora)` retorna `false`, o corpo do heredoc é **removido** da análise, e a checagem da linha 151 (`hit("(psql|mysql)\\b") && /DROP|TRUNCATE/.test(flat)`) não encontra mais o `DROP`/`TRUNCATE` — porque ele foi jogado fora com o corpo. A produção, que varre o comando inteiro, bloqueia.

Isto reabre exatamente a "regra inviolável do Data-Engineer" que a linha 145–147 existe para travar, pela via mais usada de invocação. É a mesma classe do HIGH da rodada 1 (corpo de heredoc descartado esconde o comando perigoso), agora no guard de DDL em vez do de shell/git. O `README.md` documenta o heredoc conservador para interpretadores, mas **não** cobre esse caso — aqui o corpo não fica conservador, ele some.

**Correção proposta:** fazer `executa()` reconhecer as CLIs de banco cobertas pela trava de DDL como consumidores de corpo — p.ex. acrescentar ao teste de palavra um conjunto `DBEXEC = /^(psql|mysql|mariadb|mongosh|sqlite3|sqlplus)$/` (no mínimo `psql|mysql`, que são os que a linha 151 checa), de modo que `psql <<EOF … DROP … EOF` retorne `executa(fora)=true`, mantenha o corpo e ligue o modo conservador. Depois: adicionar ao `test-block-dangerous-git.mjs` os quatro casos acima como BLOCK, provando que a produção também os bloqueia (o critério do brief — "produção falha exatamente nos casos novos" — exige o par proposta-100%/produção-falha para regressão-guarda).
**Quem corrige:** coder

## Auditoria por Camada

- **Superfície de comando (block-dangerous-git):** 1 achado HIGH (psql/mysql heredoc). Todos os demais vetores testados nesta rodada estão corretos. As correções da rodada 1 e da regressão de segmento do Reviewer foram confirmadas por execução. Melhorias reais confirmadas: herestring agora bloqueia; `cp x .claude/hooks\/y` (barra escapada) agora bloqueia na proposta (produção deixava passar); normalização de `/./` e `//`; verbos novos (`rsync`, `git checkout/restore/apply/mv/rm`) na zona.
- **Gate de encerramento (check-reviewer-gate):** ok, inalterado nesta rodada (14/14 proposta).
- **Proteção de escrita (protect-guardrails + settings):** ok (22/22). `.claude/skills/` gravável segue aceitável (âncora de confiança são os hooks; `SKILL.md` com `disable-model-invocation: true`; `done` vive no workflow protegido).
- **Fluxo `gbpa-task.js`:** ok, fail-closed reforçado. Verificador sem retorno (lente ou Reviewer único) agora devolve `blocked` em vez de gastar rodada ou escalar com diagnóstico falso; épica sem fatias → `blocked`. Nenhum caminho novo devolve `done` sem verificação; refutador cego sem retorno segue `blocked`. Smoke 15/15. A divergência schema × artifact continua fail-closed (o Stop hook bloqueia o encerramento se o artifact não trouxer o veredito na 1ª linha).
- **check-pii.sh / ADR-005 / secrets / supply chain:** inalterados desde a rodada 1; sem novos achados. Sem secret no diff; só builtins `node:*`.

## Riscos Aceitos
Nenhum aceito por mim. O achado HIGH é regressão de trava mecânica; correção barata (uma lista de CLIs em `executa`). Se o Tech Lead optar por aceitar em vez de corrigir, o risco residual tem de ser registrado com nome e data — mas o caminho recomendado é corrigir nesta rodada.

## Observações não bloqueantes (backlog / conhecidas)
- **Barra invertida esconde o caminho da zona:** `cp x .cla\ude/hooks/y.mjs` passa em proposta e produção (o shell remove o `\`, o regex não). Mesma classe do limite já documentado "variável esconde o caminho"; equivalente à produção, não é regressão. Sugestão: acrescentar uma linha em "Limites conhecidos" do `docs/patches/README.md` cobrindo ofuscação por `\` além da por variável. SUGGESTION.
- **Herestring ainda passa na produção:** só relevante quando os patches forem aplicados; a proposta já corrige. Sem ação extra.

## Contexto para o Próximo Agente
Prioridade única e bloqueante: ensinar `executa()` a tratar `psql`/`mysql` (e afins) como consumidores de corpo de heredoc, e adicionar os quatro casos ao banco de teste como BLOCK com a prova produção-falha. Rodar `node docs/patches/test-block-dangerous-git.mjs` contra proposta (deve dar 100%) e produção. Não aplicar os patches em `.claude/hooks/` enquanto isso estiver aberto — aplicar hoje trocaria uma trava que bloqueia `psql <<EOF … DROP TABLE` por uma que o deixa passar. Como esta é a 2ª reprovação (HANDOFF §4.7), se a correção do Coder não fechar o caso, a decisão passa a ser humana (Tech Lead).
