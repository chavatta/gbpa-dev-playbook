**Veredito:** APROVADO

# Review (rodada 2) — 2026-09-23_modelo-topo-opus-5-5

**Agente:** reviewer (`reviewer-opus`)
**Modelo em que rodou:** `claude-opus-5-5[1m]` (Opus 5.5, janela de 1M), conforme o system prompt. Bate com o designado (`claude-opus-5-5`); o sufixo `[1m]` indica só a janela de contexto, não outra versão.
**Escopo revisado:** `git diff a3bb02d d135bef` (commits `efb8313` + `d135bef`, branch `claude/practical-allen-px9mfl`): 21 arquivos fora de `tasks/`, diff pequeno, sem necessidade de fatiamento.
**Base:** `brief.md` (escopo ajustado: Security-SRE fica em Fable 5.1), `artifacts/coder.md`, artifact da rodada 1 e o diff.

Nenhum issue bloqueante. Os 6 achados da rodada 1 estão resolvidos e a mudança de escopo (Security-SRE em Fable 5.1) está coerente em todos os documentos do escopo.

---

## Histórico: rodada 1 (resumo)

A rodada 1 rodou em `claude-fable-5-1` (`reviewer-fable`), porque a sessão tinha carregado a definição anterior dos agentes no startup. Veredito: REPROVADO (6 issues). Na época, o escopo ainda previa o Security-SRE em Opus.

| # | Sev. | Achado da rodada 1 | Status na rodada 2 | Evidência |
|---|---|---|---|---|
| 1 | HIGH | ADR-003 §3 designava `Architect-fable`/`Reviewer-fable` no presente | Resolvido | `docs/ADR-003-agentes-sdd-dados-ia.md:21`: "nó no modelo de topo", `Architect-opus`, `Reviewer-opus`, `Security-SRE-fable` (agora correto, porque o nome segue `security-sre-fable`) |
| 2 | MEDIUM | PENDENCIAS decisão 2 se contradizia na mesma célula | Resolvido | `docs/PENDENCIAS-TECH-LEAD.md:58`: texto original tachado (`~~…~~`) e supersessão datada, cobrindo os dois IDs |
| 3 | MEDIUM | `artifacts/coder.md` ausente | Resolvido | Artifact existe, com `files_changed`, modelo `claude-opus-5-5`, verificações e seção de retrabalho da rodada 2 |
| 4 | LOW | Campo `model` do ponteiro registrava só a família | Resolvido | `multi-agents/HANDOFF-PROTOCOL.md:55,70` e `.claude/workflows/gbpa-task.js:42` pedem o ID exato lido no system prompt, com justificativa ("mesma granularidade da regra") |
| 5 | LOW | "Mudou junto" do ADR-001 incompleto | Resolvido | `docs/ADR-001-modelos-por-agente.md:72` lista agentes, script (agentType + descrição do `model`), ADR-002/003/005, HANDOFF, ARCHITECTURE, as 4 tabelas, PENDENCIAS 2 e 4 e o payload de `docs/patches/` |
| 6 | SUGGESTION | Data de revisão dos manuais | Resolvido | `multi-agents/agents/{00,01,04,12}-*.md:3` com `Última revisão: 2026-09-23` |

---

## Critérios do brief: evidência

| # | Critério | Resultado | Evidência |
|---|---|---|---|
| 1 | Orchestrator/Architect/Reviewer em `claude-opus-5-5`, nome `-opus` (orchestrator sem sufixo), auto-verificação exigindo Opus 5.5; Security-SRE em `claude-fable-5-1`, `security-sre-fable`, auto-verificação exigindo Fable 5.1 | OK | `grep '^name:\|^model:' .claude/agents/*.md`: `orchestrator`, `architect-opus` e `reviewer-opus` com `claude-opus-5-5`; `security-sre-fable` com `claude-fable-5-1`. Nos quatro, a seção "Modelo designado" compara a versão ("Se o modelo não for **Opus 5.5**" / "**Fable 5.1**"), e não mais só a família. O blocker traz a versão |
| 2 | 7/7 `agentType` existem como `name:`; smoke 15/15 | OK | Valores distintos no script: `architect-opus`, `planner-sonnet`, `spec-writer-sonnet`, `coder-sonnet`, `tester-sonnet`, `reviewer-opus`, `security-sre-fable`. Os 7 existem em `.claude/agents/`. `node scripts/test-gbpa-task.mjs` retorna `passou: 15/15 falhou: 0`. Extra: `node docs/patches/test-block-dangerous-git.mjs docs/patches/block-dangerous-git.mjs` retorna `passou: 145/145` |
| 3 | Toda menção a Fable fora de `tasks/` é datada/histórica ou se refere ao Security-SRE | OK | `grep -rniI fable --exclude-dir=tasks --exclude-dir=.git .`: 25 ocorrências. Todas se referem ao Security-SRE (agente, script, tabelas, ADR-002/003/005, README, praticas/00) ou são históricas e datadas (ADR-001 status/contexto/revisão, PENDENCIAS 2 e 4, ADR-003 "Fable até 2026-09-23"). Nenhuma designa Fable a Orchestrator, Architect ou Reviewer no presente |
| 4 | Nenhum "Opus 5" que não seja 5.5 | OK | Regex para `opus 5`/`opus-5`/`opus 5.x` diferente de 5.5 no repo inteiro: só casa com o texto do próprio critério em `tasks/` (brief, run-log, coder.md, rodada 1). Fora de `tasks/`: zero. O "Opus" sem versão em `ARCHITECTURE.md:20` é o estudo histórico da Anthropic |
| 5 | Links relativos resolvem | OK | Todos os links markdown relativos dos `.md` do diff testados com `-e`: o único quebrado era o do artifact da rodada 1, que este arquivo substitui. Este artifact não usa link markdown |

## Coerência com o Security-SRE em Fable 5.1

| Documento | Coerente? | Observação |
|---|---|---|
| ADR-001: status, contexto, tabela | Sim | Status e contexto datam a troca e citam Fable 5.1 no Security-SRE. A tabela cobre só os 9 agentes originais (a nota de 2026-08-04 remete o Security-SRE ao ADR-002), então não precisava de linha nova |
| ADR-001: "Revisão de 2026-09-23" | Sim | Título, parágrafo de abertura (gates em famílias diferentes, com racional explícito), ID fixo nos dois modelos, "Sufixo segue a família" (`security-sre-fable` mantém o nome), auto-verificação por versão |
| ADR-001: "Custo aceito" | Sim | A lista de `agentType` bate 7/7 com o script, `security-sre-fable` incluído |
| ADR-002 item 5 | Sim | "Fable, desde 2026-09-23 fixado em Fable 5.1 (`claude-fable-5-1`)" |
| ADR-003 §3 e alternativa 1 | Sim | Ver issue 1 da rodada 1 |
| ADR-005 "Consequência de trava" | Sim | Mesma lista do script |
| DESENVOLVIMENTO-COM-IA §3 e riscos | Sim | Três nós em Opus 5.5; Security-SRE em **Fable 5.1**; AI-Engineer "Reviewer (Opus 5.5) e Security-SRE (Fable 5.1)"; linha de riscos com Reviewer (Opus 5.5) |
| ONBOARDING | Sim | `security-sre` em Fable 5.1; os outros três em Opus 5.5 |
| README / praticas/00 | Sim | "Opus 5.5 / Fable 5.1 / Sonnet 5 / Haiku 4.5" |
| PENDENCIAS 2 e 4 | Sim | 2: supersessão cobre os dois IDs. 4: "`reviewer-fable`; hoje `reviewer-opus`, e `security-sre-fable` segue igual" |
| HANDOFF §3.2 / `POINTER.model` | Sim | Exemplos `claude-opus-5-5` e `claude-sonnet-5`; a revisão do ADR-001 cita `claude-fable-5-1` |

---

## Issues

Nenhum bloqueante. Uma observação, que não bloqueia e fica a critério do Tech Lead:

### 1. SUGGESTION: sufixo de janela de contexto no ID lido do system prompt
**Arquivo:** `multi-agents/HANDOFF-PROTOCOL.md:70`
**Observação:** o protocolo manda registrar o "ID exato lido no próprio system prompt". Esta própria sessão mostra `claude-opus-5-5[1m]`, e não `claude-opus-5-5`. A auto-verificação compara pelo nome ("Opus 5.5"), então não há falso bloqueio. Mas quem auditar o run-log comparando strings com o frontmatter pode ler `[1m]` como divergência.
**Correção sugerida:** acrescentar em §3.2 que sufixos de janela de contexto (ex.: `[1m]`) fazem parte do ID registrado e não são divergência de versão.

---

## O que está bem feito

- A reversão do Security-SRE veio com racional, e não só como ajuste de config: "os dois gates passam a rodar em famílias diferentes" dá motivo técnico à escolha do Tech Lead e fica registrado no ADR.
- A auto-verificação passou de família para versão nos quatro agentes de topo, alinhada com a fixação do ID. Sem isso, fixar o ID não teria evidência.
- A supersessão em PENDENCIAS 2 foi tachada e datada, sem apagar o registro original.
- O `coder.md` separa a entrega original do retrabalho da rodada 2 e atribui o ajuste de escopo ao Tech Lead.

## Segurança (escopo do diff)

Nenhum segredo, credencial ou superfície nova. A mudança troca o modelo dos gates, não as regras deles. Nenhum achado sistêmico para rotear ao Security-SRE. Continua valendo a observação da rodada 1: `.claude/agents/` ainda não é zona protegida (patch pendente), então a auto-verificação segue sendo a única defesa contra rebaixamento de `model:`.

## Skill Candidates

Nenhum.

## Próximo passo

Orchestrator pode marcar `done`. Lembrete do próprio ADR-001 ("Sessões abertas"): reiniciar as sessões para que `security-sre-fable` em `claude-fable-5-1` e os nomes `-opus` passem a valer.
