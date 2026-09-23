**Veredito:** REPROVADO (6 issues)

# Review — 2026-09-23_modelo-topo-opus-5-5

**Agente:** reviewer
**Modelo em que rodou:** `claude-fable-5-1` (Fable 5.1). Divergente do designado a partir desta mudança (`claude-opus-5-5`); registrado sem bloquear, por instrução do Orchestrator — a sessão carregou a definição anterior dos agentes no startup e é esta própria task que redefine o esperado.
**Escopo revisado:** diff não commitado na branch `claude/practical-allen-px9mfl` — 17 arquivos, 71+/57− (pequeno; não precisava de fatiamento).
**Base:** `brief.md` + `git diff` diretamente, porque `artifacts/coder.md` não existe (ver issue 3).

Um issue bloqueante (HIGH); os demais são melhorias que podem entrar na mesma correção.

---

## Critérios do brief — evidência

| # | Critério | Resultado | Evidência |
|---|---|---|---|
| 1 | 4 agentes com `model: claude-opus-5-5`, nome `-opus` (orchestrator sem sufixo), auto-verificação esperando Opus 5.5 | OK | `grep '^name:\|^model:' .claude/agents/*.md`: `architect-opus`, `reviewer-opus`, `security-sre-opus`, `orchestrator`; os quatro com `model: claude-opus-5-5`. Seção "Modelo designado" dos quatro diz "Se o modelo não for **Opus 5.5**, pare imediatamente" e blocker `"modelo divergente: esperado Opus 5.5, rodando em {modelo real}"` |
| 2 | Todo `agentType` do `gbpa-task.js` existe como `name:`; smoke 15/15 | OK | 7 valores distintos (`architect-opus` ×2, `reviewer-opus` ×3, `security-sre-opus`, `planner-sonnet` ×2, `coder-sonnet`, `tester-sonnet` ×2, `spec-writer-sonnet`) — 7/7 batem com `name:`. `node scripts/test-gbpa-task.mjs` → `passou: 15/15 falhou: 0` |
| 3 | `grep -i fable` fora de `tasks/` só acha menções históricas explícitas | **FALHA** | 9 ocorrências. 8 são históricas e datadas (ADR-001 status/contexto/seção de revisão, ADR-002 item 5, PENDENCIAS 2 e 4). **1 não é:** `docs/ADR-003-agentes-sdd-dados-ia.md:21` designa `Architect-fable`, `Reviewer-fable` e `Security-SRE-fable` no presente — issue 1 |
| 4 | Nenhuma menção a "Opus 5" que não seja 5.5 | OK | `grep -rnE 'Opus[ -]5([^.]|$)'` e variantes `opus-5`/`opus 5` fora de `tasks/`: zero. A única menção a "Opus" sem versão é histórica ("O estudo original usou Opus", `ARCHITECTURE.md:20`) |
| 5 | Links relativos resolvem | OK | Todos os `](caminho)` relativos dos 17 arquivos alterados testados com `-e`: 0 quebrados |
| 6 | Nenhum `-fable` que quebre algo | OK | `grep -rn -- '-fable' .claude scripts docs/patches`: zero. Hooks, settings e patches não referenciam nomes sufixados |
| 7 | `docs/patches/test-block-dangerous-git.mjs` (caso `sed -i em agents` trocado para `s/opus/haiku/`) | OK | `node docs/patches/test-block-dangerous-git.mjs docs/patches/block-dangerous-git.mjs` → `passou: 145/145` |

### Coerência da seção "Revisão de 2026-09-23" (ADR-001) com o resto

| Documento | Coerente? | Observação |
|---|---|---|
| ADR-002 item 5 | Sim | "`fable` — desde 2026-09-23, Opus 5.5 (`claude-opus-5-5`), ver ADR-001" — histórico explícito, aponta para a revisão |
| ADR-003 item 3 | **Não** | Primeira frase atualizada ("Fable até 2026-09-23; Opus 5.5 desde então"); segunda frase ficou no presente com os nomes antigos. Ver issue 1 |
| ADR-005 "Consequência de trava" | Sim | Lista de `agentType` bate com o script (7/7) |
| HANDOFF-PROTOCOL §3.2 | Sim | `model` ∈ {`opus`, `sonnet`, `haiku`} — bate com "O campo `model` do ponteiro passa a registrar `opus`" (ADR-001) e com o `POINTER.model.description` do script (`opus | sonnet | haiku`). Ver issue 4 sobre granularidade |
| DESENVOLVIMENTO-COM-IA (tabela §modelos e tabela de riscos) | Sim | 4 linhas de topo → Opus 5.5; 3 linhas de dependência (Spec-Writer/Data/AI → "Opus 5.5") coerentes com ADR-003 corrigido |
| ONBOARDING tabela de agentes | Sim | 4 linhas → Opus 5.5; nomes-base mantidos, como manda a seção "Nomenclatura" |
| README requisitos | Sim | "Opus 5.5 / Sonnet 5 / Haiku 4.5" |
| praticas/00 default Provedor/modelos | Sim | Mesmo trio, agora com versão — melhor que o anterior sem versão |
| ARCHITECTURE nota do estudo | Sim | "papel de lead é do Opus 5.5 — ver ADR-001" |
| PENDENCIAS decisões 2 e 4 | Parcial | 4 OK ("`reviewer-fable`, hoje `reviewer-opus`"). 2 ficou contraditória — issue 2 |

---

## Issues

### 1. HIGH — ADR-003 ainda designa agentes `-fable` no presente
**Arquivo:** `docs/ADR-003-agentes-sdd-dados-ia.md:21`
**Trecho atual:** "Os três novos agentes produzem trabalho **consumido e auditado por um nó Fable imediatamente a jusante**: a spec é validada pelo Architect-fable, e schema/subsistema de IA passam pelo Reviewer-fable (e Security-SRE-fable quando sensível)."
**Por que é HIGH:** é o objetivo verificável do brief ("nenhum documento vigente do playbook ainda designa Fable como modelo de agente") e o critério 3 falhando num ADR **vigente** que, na mesma mudança, ganhou `Última revisão: 2026-09-23` — o documento afirma ter sido revisado hoje e designa três agentes que não existem mais em `.claude/agents/`. A primeira frase do item foi atualizada e a segunda não, o que deixa o parágrafo internamente contraditório.
**Correção esperada:** trocar a segunda frase para o modelo de topo atual, no mesmo padrão já usado na alternativa 1 do mesmo ADR (`Architect-opus`): "consumido e auditado por um nó no modelo de topo imediatamente a jusante: a spec é validada pelo Architect-opus, e schema/subsistema de IA passam pelo Reviewer-opus (e Security-SRE-opus quando sensível)". Depois, re-rodar `grep -rni fable --exclude-dir=tasks --exclude-dir=.git .` e confirmar que só sobram as 8 menções datadas.

### 2. MEDIUM — PENDENCIAS decisão 2 contém duas orientações contraditórias na mesma célula
**Arquivo:** `docs/PENDENCIAS-TECH-LEAD.md:58`
**Trecho atual:** "*Superado em 2026-09-23: o topo passou a Opus 5.5, fixado pelo ID completo `claude-opus-5-5` (ADR-001).* Válido no Claude Code atual; a auto-verificação de modelo nos agentes cobre o fallback silencioso. Não precisa trocar pelo id completo"
**Problema:** a última frase ("Não precisa trocar pelo id completo") segue no presente e contradiz a frase anterior. Quem lê a tabela de decisões como fonte (é o propósito dela) fica sem saber qual das duas vale.
**Correção esperada:** colocar a decisão original no passado e datada, ex.: "*Superado em 2026-09-23 … (ADR-001).* Decisão original (2026-08-31): o alias era válido e a auto-verificação cobria o fallback silencioso; não se trocava pelo id completo." Ou tachar (`~~…~~`) o trecho superado.

### 3. MEDIUM — `artifacts/coder.md` ausente; run-log registra coder `completed` sem artifact
**Arquivo:** `tasks/2026-09-23_modelo-topo-opus-5-5/artifacts/` (vazio antes deste review); `run-log.md` linhas 9–10
**Problema:** HANDOFF-PROTOCOL (linha 48 e checklist "Cada subagente grava em `artifacts/{agente}.md`") e `.claude/agents/coder.md` §Saída exigem o artifact com `files_changed` e o `model` em que rodou. O run-log diz "17 arquivos; … smoke 15/15; suíte do hook 145/145; links 0 quebrados", mas não há artifact nem evidência do modelo do coder. Este review usou `git diff` como fonte; a rastreabilidade da task (evidência ISO citada no ADR-005) fica sem o elo do coder.
**Correção esperada:** Orchestrator/coder gravar `artifacts/coder.md` com `files_changed` (os 17 arquivos), o modelo em que rodou e o resumo das verificações, antes de marcar `done`. Roteio para o Orchestrator — não é defeito do diff.

### 4. LOW — Campo `model` do ponteiro registra só a família, mas a decisão passou a depender da versão
**Arquivos:** `multi-agents/HANDOFF-PROTOCOL.md:70`; `.claude/workflows/gbpa-task.js:42`
**Problema:** a revisão do ADR-001 justifica fixar o ID completo porque "o alias `opus` seguiria automaticamente a próxima versão" e a auto-verificação bloqueia "outra versão ou família". Mas a camada 3 de visibilidade (ponteiro/run-log, a que "fica como evidência") só grava `opus` — um subagente que rodasse num Opus futuro por override registraria o mesmo valor que um em 5.5. A camada de evidência ficou menos granular do que a regra que ela deveria evidenciar.
**Correção esperada (melhoria, não bloqueia):** aceitar no `model` do ponteiro o ID exato (`claude-opus-5-5`) ou família+versão (`opus-5.5`), e refletir isso na descrição do `POINTER.model` e no §3.2. Se preferir manter a família, registrar no ADR-001 que a evidência de versão fica só no run-log do Orchestrator (item 2 da seção "Modelo designado" dele).

### 5. LOW — Bullet "Mudou junto" da revisão do ADR-001 está incompleto
**Arquivo:** `docs/ADR-001-modelos-por-agente.md:71`
**Problema:** lista `name:`/`model:` dos 4 agentes, `agentType` do script e as tabelas de 4 docs. O diff também alterou HANDOFF-PROTOCOL (valores de `model`), ARCHITECTURE, ADR-002/003/005, PENDENCIAS 2 e 4 e `docs/patches/test-block-dangerous-git.mjs`. Esse bullet é o mapa da próxima troca de modelo (o ADR diz que a revisão trimestral "é o momento de verificar isso"); faltando itens, a próxima troca repete o esquecimento que gerou o issue 1.
**Correção esperada:** completar a lista com os arquivos acima.

### 6. SUGGESTION — Cabeçalho dos manuais pede revisão "a cada mudança de modelo", e a data não foi tocada
**Arquivos:** `multi-agents/agents/04-reviewer.md:3` (2026-08-04), `12-security-sre.md:3` (2026-08-31), `00-orchestrator.md:3` e `01-architect.md:3` (2026-09-15)
**Problema:** os manuais não nomeiam modelo (`grep -iE 'opus|sonnet|haiku' multi-agents/agents/` → zero), então não há conteúdo a corrigir; mas o próprio cabeçalho estabelece a regra "Revisão: a cada mudança de escopo ou de modelo do agente (ADR-001)". Ou se bumpa `Última revisão` com nota "sem alteração de conteúdo — troca de modelo (ADR-001, 2026-09-23)", ou se ajusta a regra do cabeçalho para "a cada mudança de escopo" (o modelo vive no frontmatter e no ADR). Fora do escopo do brief; fica como sugestão para o Tech Lead.

---

## O que está bem feito

- Fixar o ID completo em vez do alias, com o racional explícito no ADR ("o upgrade seguinte é uma revisão explícita deste ADR, não um efeito colateral") — é a decisão certa para um gate, e o bullet "Sessões abertas" antecipa exatamente o problema desta sessão.
- Nomes-base preservados em todos os arquivos de agente e no `artifact_path`; nenhum hook, `settings` ou patch referencia nome sufixado — a separação prevista na seção "Nomenclatura" segurou.
- ADR-002 e PENDENCIAS 4 registram o histórico sem apagar o que valia antes (auditável).
- Coerência forte entre ADR-001 → HANDOFF §3.2 → `POINTER.model` do script → texto de auto-verificação dos 4 agentes: mesma família, mesmo blocker, mesmo formato.
- Caso de teste do patch trocado de `s/fable/haiku/` para `s/opus/haiku/` — detalhe que mostra atenção ao que o teste realmente cobre.

## Segurança (escopo do diff)

Nenhum segredo, credencial ou superfície nova. A mudança altera **qual** modelo ocupa os gates, não as regras dos gates. Achado sistêmico para rotear ao Security-SRE: nenhum. Observação para o Tech Lead: `.claude/agents/` ainda não é zona protegida (patch pendente) — esta task o editou legitimamente por pedido direto, mas até o patch entrar, uma sessão de agente pode rebaixar o `model:` de um gate sem trava técnica; a auto-verificação é a única defesa.

## Skill Candidates

Nenhum — procedimento de troca de modelo já está documentado no ADR-001 ("Custo aceito" + "Mudou junto"); o issue 5 é o que falta para ele ser reutilizável.

## Próximo passo

`coder` corrige o issue 1 (obrigatório) e, idealmente, 2 e 5 na mesma rodada; Orchestrator resolve o issue 3. Re-review pode ser só do `git diff` de `docs/ADR-003-agentes-sdd-dados-ia.md`, `docs/PENDENCIAS-TECH-LEAD.md` e `docs/ADR-001-modelos-por-agente.md` mais o `grep -rni fable` final.
