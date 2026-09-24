**Veredito:** REPROVADO (9 issues)

# Reviewer — 2026-09-23_executores-opus-5-5

**Agente:** reviewer · **Modelo em que rodou:** `claude-opus-5-5` (system prompt: `claude-opus-5-5[1m]`, mesma versão) · **Status:** completed · **Próximo:** coder
**Escopo:** `git diff origin/main...HEAD` (HEAD d22755c), cerca de 150+/82- linhas, 31 arquivos. Tamanho adequado, não precisa fatiar.

## Reconfirmado (sem issue)

- Os 8 agentes (`planner`, `coder`, `tester`, `debugger`, `devops`, `spec-writer`, `data-engineer`, `ai-engineer`) têm `name: X-opus`, `model: claude-opus-5-5` e auto-verificação esperando Opus 5.5. `security-sre-fable` está em `claude-fable-5-1` e `documenter-haiku` em `haiku`.
- Os 7 `agentType` distintos do `gbpa-task.js` existem como `name:`. `node scripts/test-gbpa-task.mjs` passou 15/15.
- Links relativos: 100 verificados fora de `tasks/`, 0 quebrados.
- As tabelas do DESENVOLVIMENTO-COM-IA §3, ONBOARDING, README, praticas/00, o exemplo do HANDOFF-PROTOCOL e a nota do ARCHITECTURE batem com o frontmatter.
- A referência a "`GOVERNANCE.md` §2.2" (ADR-001:75) resolve para §2, item 2 (o dev responsável revisa antes do ready).
- Não há segredos nem credenciais no diff.

## Issues

### 1. HIGH — ADR-005 ainda afirma que o script fixa nomes `-sonnet`
- **Arquivo:** `docs/ADR-005-orquestracao-nativa-do-fluxo.md:41`
- **Problema:** texto vigente, no presente: "O script (`gbpa-task.js`) hard-codeia os `agentType` sufixados (`architect-opus`, `planner-sonnet`, `spec-writer-sonnet`, `coder-sonnet`, `tester-sonnet`, ...)". Isso é falso desde este diff. Ele descumpre o critério "toda menção a Sonnet fora de `tasks/` é histórica" e contradiz o `coder.md`, que diz que só sobraram menções nos ADR-001/002/003 e no ARCHITECTURE. O próprio parágrafo manda atualizar esses nomes "na mesma mudança". A primeira etapa atualizou o ADR-005 (ADR-001:72), mas esta não.
- **Correção:** trocar a lista por `architect-opus`, `planner-opus`, `spec-writer-opus`, `coder-opus`, `tester-opus`, `reviewer-opus`, `security-sre-fable`, o que a alinha com o ADR-001:61.

### 2. HIGH — "Consequências" do ADR-001 ainda dizem que o gate é mais capaz que o código auditado
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:43`
- **Problema:** "**Positivas:** cota concentrada onde há leverage; gate de review mais confiável que o código que audita". Com Coder e Reviewer em Opus 5.5, as duas afirmações ficam falsas. Também contradizem a linha 75 do mesmo ADR, que registra justamente a perda dessa assimetria. É texto vigente, sem nota de que foi superado.
- **Correção:** marcar as duas consequências como superadas em 2026-09-23 (como já foi feito no ADR-003:21 e na alternativa 1) e remeter à "segunda etapa". Uma alternativa é reescrever as positivas para o quadro atual e trazer os dois custos (cota; gate no mesmo modelo) para as negativas, com a mitigação.

### 3. MEDIUM — A "Decisão" do ADR-001 ainda descreve um perfil "balanceado"
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:19`
- **Problema:** "Perfil **balanceado com o modelo de topo nos nós críticos** — hoje **Opus 5.5**". A tabela logo abaixo põe 11 dos 13 agentes no topo, e a linha 73 admite que a alternativa 1 foi adotada. O cabeçalho da decisão contradiz a própria tabela. O título da seção de revisão (linha 63, "Opus 5.5 nos nós críticos, Fable 5.1 no gate de segurança") também cobre só a primeira etapa.
- **Correção:** reescrever a frase de abertura para o quadro atual (Opus 5.5 em todos, exceto Security-SRE e Documenter), ou anotar que o perfil balanceado vale até 2026-09-23. Ajustar o título da seção 63 para incluir os executores.

### 4. MEDIUM — A mitigação do "gate no mesmo modelo" põe o refutador cego fora da família Opus
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:75`
- **Problema:** "A mitigação é o que já existe fora dessa família: em task sensível, a lente do Security-SRE (Fable 5.1) e o refutador cego". O refutador cego roda como `agentType: 'reviewer-opus'` (`.claude/workflows/gbpa-task.js:250`), ou seja, em Opus 5.5, a mesma família do Coder. Ele mitiga ancoragem em vereditos anteriores, não pontos cegos compartilhados pelo modelo. A lente de reprodução também é `tester-opus` (linha 210). Assim a mitigação fica superestimada no registro da decisão: a única verificação fora da família é o Security-SRE, e em task não-sensível só resta o humano.
- **Correção:** separar as duas coisas. O que está fora da família é só o Security-SRE (Fable 5.1). O refutador cego é independente em contexto, mas roda no mesmo modelo. Sem isso, o texto dá à mitigação uma força que ela não tem.

### 5. MEDIUM — A decisão 2 do PENDENCIAS diz "todos pelo ID completo", mas o Documenter usa alias
- **Arquivo:** `docs/PENDENCIAS-TECH-LEAD.md:58`
- **Problema:** a frase nova "... e o Documenter, que segue em Haiku 4.5 — todos pelo ID completo" é falsa, porque `.claude/agents/documenter.md:5` tem `model: haiku` (alias).
- **Correção:** "Opus e Fable pelo ID completo; o Documenter segue no alias `haiku`". Se a intenção for fixar o Documenter também, isso é outra decisão e fica fora desta task.

### 6. LOW — As colunas de racional dos executores ainda justificam um modelo menor
- **Arquivos:** `docs/ADR-001-modelos-por-agente.md:26-30`; `DESENVOLVIMENTO-COM-IA.md` (tabela da §3, linhas de Planner a AI-Engineer)
- **Problema:** textos como "Implementa spec fechada; erro é interceptado pelo Reviewer" ou "Procedural, com checklist" foram escritos para explicar por que o agente *não* precisava do topo. Ao lado de "Opus 5.5", passam a não justificar nada.
- **Correção:** trocar por "decisão do Tech Lead, ver ADR-001 → Revisão de 2026-09-23 (segunda etapa)" ou algo equivalente, ou mover o racional antigo para a nota histórica.

### 7. LOW — A alternativa 1 do ADR-003 continua rejeitada sem nota
- **Arquivo:** `docs/ADR-003-agentes-sdd-dados-ia.md:25`
- **Problema:** "Spec-Writer no modelo de topo ... o ganho não justifica o consumo de cota" foi adotada na prática, e a decisão 3 já está marcada como superada. A alternativa não tem a mesma marcação que a alternativa 1 do ADR-001 recebeu.
- **Correção:** acrescentar "(rejeitada em 2026-08-04; adotada na revisão de 2026-09-23 do ADR-001)".

### 8. LOW — O HANDOFF-PROTOCOL restringe a versão fixada aos "agentes de topo"
- **Arquivo:** `multi-agents/HANDOFF-PROTOCOL.md:70`
- **Problema:** "desde 2026-09-23 o ADR-001 fixa a versão dos agentes de topo". Agora a versão fica fixada em todos os agentes, exceto o Documenter.
- **Correção:** "fixa a versão de todos os agentes, exceto o Documenter".

### 9. LOW — Lacunas no recuo de cota e na nota sobre evidência antiga
- **Arquivo:** `docs/ADR-001-modelos-por-agente.md:74` e `:77`
- **Problema:** (a) o recuo lista Planner, Tester e DevOps sob o critério "spec fechada e sob gate", mas o Coder, o Debugger, o Data-Engineer e o AI-Engineer atendem ao mesmo critério pela tabela, e falta dizer por que ficam em Opus. (b) A nota "Evidência antiga não muda" cita só `fable` nos quatro agentes da primeira etapa, e os artifacts anteriores dos oito executores registram `sonnet`.
- **Correção:** (a) uma frase com o critério que separa os três do recuo (ex.: o Coder fica em Opus porque é o autor do código que o gate audita). (b) Estender a nota: "e `sonnet` nos oito executores".

## Roteamento
- Nada para o `security-sre`: não há achado sistêmico.
- Os issues 1 e 2 bloqueiam: o 1 descumpre um critério do brief, e o 2 é exatamente a incoerência que este gate devia barrar. O 3, o 4 e o 5 também devem ser corrigidos nesta rodada, porque são afirmações falsas em texto vigente. Os LOW podem entrar na mesma rodada, já que são edições de uma linha.
- O `coder.md` afirma que as menções a Sonnet "só" estão nos ADR-001/002/003 e no ARCHITECTURE, e o ADR-005 desmente isso. Na próxima rodada, rode o `grep -rni sonnet` de novo e cole a saída no artifact.
