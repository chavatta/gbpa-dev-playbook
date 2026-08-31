# ADR-001 — Modelo de IA por Agente

**Status:** Aceito — complementado por ADR-002 (Security-SRE: fable) e ADR-003 (Spec-Writer, Data-Engineer, AI-Engineer: sonnet)
**Data:** 2026-07-31
**Decisores:** Tech Lead
**Revisão:** trimestral

> **Nota (2026-08-04):** este ADR cobre os 9 agentes originais. O quadro atual é de **13 agentes** (1 orchestrator + 12 especialistas); os modelos dos 4 agentes posteriores estão nos ADRs 002 e 003, que seguem o mesmo racional. O quadro consolidado está em `DESENVOLVIMENTO-COM-IA.md §3`.

## Contexto

O fluxo multi-agent tem 9 agentes com custos de erro muito diferentes. A cota de uso dos modelos (plano Claude Max) é compartilhada pela equipe, e os modelos disponíveis têm capacidades e custos distintos: **Fable 5** (topo de linha), **Sonnet 5** (equilíbrio) e **Haiku 4.5** (rápido e barato).

O gargalo de um fluxo assim não é velocidade de geração de código — é a **qualidade das decisões nos nós de alto impacto**: a decomposição do problema, o design da solução e o gate de review. Um erro nesses nós se propaga (ou passa despercebido) por todo o resto; um erro na execução é barato, porque o Reviewer o intercepta.

## Decisão

Perfil **balanceado com Fable nos nós críticos**:

| Agente | Modelo | Racional |
|---|---|---|
| `orchestrator` | **fable** | A decomposição e o roteamento definem a qualidade de tudo abaixo |
| `architect` | **fable** | Decisões de arquitetura são as mais caras de reverter |
| `reviewer` | **fable** | É o gate obrigatório; um falso "APROVADO" é o erro mais caro do fluxo |
| `planner` | sonnet | Estrutura trabalho sobre design já decidido pelo Architect-fable |
| `coder` | sonnet | Implementa spec fechada; erro é interceptado pelo Reviewer-fable |
| `tester` | sonnet | Critérios de aceitação já definidos; método estruturado |
| `debugger` | sonnet | Segue metodologia científica (skill `engineering:debug`) |
| `devops` | sonnet | Procedural, com checklist pré-deploy |
| `documenter` | **haiku** | Alto volume, insumo já aprovado; menor custo por token |

O `model:` no frontmatter de cada agente (`.claude/agents/*.md`) **prevalece** sobre o `model` do settings global do usuário — a atribuição vale independente da configuração pessoal de cada máquina.

## Alternativas consideradas

1. **Tudo Fable** — qualidade uniforme máxima, mas consome a cota compartilhada rápido demais em tasks longas; o ganho nos agentes executores é marginal porque eles já trabalham sob spec e sob gate.
2. **Tudo Sonnet** — mais barato, mas degrada exatamente o ponto em que o fluxo deposita confiança: o review. Um gate menos capaz que o coder que ele audita é um gate decorativo.
3. **Haiku nos executores** — economia maior, porém aumenta ciclos de retrabalho Coder↔Reviewer; o custo dos re-reviews em Fable anula a economia.

## Consequências

**Positivas:** cota concentrada onde há leverage; gate de review mais confiável que o código que audita; racional documentado e auditável para a equipe.

**Negativas / mitigação:**
- Três modelos para manter atualizados quando os aliases mudarem → revisão trimestral deste ADR.
- Documenter em Haiku pode ficar aquém em docs complexas → o Orchestrator pode sobrescrever o modelo na delegação quando justificar.

## Notas operacionais

- Ajustes de modelo são mudança de governança: alterar frontmatter dos agentes passa pelo Tech Lead (a pasta `.claude/` é guardrail — ver `GOVERNANCE.md §6`).
- Recomenda-se que cada máquina da equipe NÃO use `skipDangerousModePermissionPrompt: true` no settings global do Claude Code — as travas do projeto são a última linha de defesa e não devem ser a única.
