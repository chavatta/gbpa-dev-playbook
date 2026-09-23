# ADR-001 — Modelo de IA por Agente

**Status:** Aceito — complementado por ADR-002 (Security-SRE) e ADR-003 (Spec-Writer, Data-Engineer, AI-Engineer: sonnet); **revisado em 2026-09-23: Fable → Opus 5.5** no Orchestrator, Architect e Reviewer; Security-SRE fixado em Fable 5.1 (seção "Revisão de 2026-09-23")
**Data:** 2026-07-31
**Decisores:** Tech Lead
**Revisão:** trimestral
**Última revisão:** 2026-09-23

> **Nota (2026-08-04):** este ADR cobre os 9 agentes originais. O quadro atual é de **13 agentes** (1 orchestrator + 12 especialistas); os modelos dos 4 agentes posteriores estão nos ADRs 002 e 003, que seguem o mesmo racional. O quadro consolidado está em `DESENVOLVIMENTO-COM-IA.md §3`.

## Contexto

O fluxo multi-agent tem 9 agentes com custos de erro muito diferentes. A cota de uso dos modelos (plano de subscrição — ⚠️ classe a confirmar, ver `docs/PENDENCIAS-TECH-LEAD.md` item 1) é compartilhada pela equipe, e os modelos disponíveis têm capacidades e custos distintos: **Opus 5.5** e **Fable 5.1** (topo de linha; até 2026-09-23 o topo era só o **Fable 5**), **Sonnet 5** (equilíbrio) e **Haiku 4.5** (rápido e barato).

O gargalo de um fluxo assim não é velocidade de geração de código — é a **qualidade das decisões nos nós de alto impacto**: a decomposição do problema, o design da solução e o gate de review. Um erro nesses nós se propaga (ou passa despercebido) por todo o resto; um erro na execução é barato, porque o Reviewer o intercepta.

## Decisão

Perfil **balanceado com o modelo de topo nos nós críticos** — hoje **Opus 5.5**:

| Agente | Modelo | Racional |
|---|---|---|
| `orchestrator` | **opus** (`claude-opus-5-5`) | A decomposição e o roteamento definem a qualidade de tudo abaixo |
| `architect` | **opus** (`claude-opus-5-5`) | Decisões de arquitetura são as mais caras de reverter |
| `reviewer` | **opus** (`claude-opus-5-5`) | É o gate obrigatório; um falso "APROVADO" é o erro mais caro do fluxo |
| `planner` | sonnet | Estrutura trabalho sobre design já decidido pelo Architect-opus |
| `coder` | sonnet | Implementa spec fechada; erro é interceptado pelo Reviewer-opus |
| `tester` | sonnet | Critérios de aceitação já definidos; método estruturado |
| `debugger` | sonnet | Segue metodologia científica (skill `engineering:debug`) |
| `devops` | sonnet | Procedural, com checklist pré-deploy |
| `documenter` | **haiku** | Alto volume, insumo já aprovado; menor custo por token |

O `model:` no frontmatter de cada agente (`.claude/agents/*.md`) **prevalece** sobre o `model` do settings global do usuário — a atribuição vale independente da configuração pessoal de cada máquina.

## Alternativas consideradas

1. **Tudo no modelo de topo** — qualidade uniforme máxima, mas consome a cota compartilhada rápido demais em tasks longas; o ganho nos agentes executores é marginal porque eles já trabalham sob spec e sob gate.
2. **Tudo Sonnet** — mais barato, mas degrada exatamente o ponto em que o fluxo deposita confiança: o review. Um gate menos capaz que o coder que ele audita é um gate decorativo.
3. **Haiku nos executores** — economia maior, porém aumenta ciclos de retrabalho Coder↔Reviewer; o custo dos re-reviews no modelo de topo anula a economia.

## Consequências

**Positivas:** cota concentrada onde há leverage; gate de review mais confiável que o código que audita; racional documentado e auditável para a equipe.

**Negativas / mitigação:**
- Três modelos para manter atualizados quando os aliases mudarem → revisão trimestral deste ADR.
- Documenter em Haiku pode ficar aquém em docs complexas → o Orchestrator pode sobrescrever o modelo na delegação quando justificar.

## Nomenclatura dos agentes e visibilidade do modelo

*(decidido em 2026-08-31, Tech Lead)*

Os arquivos em `.claude/agents/` mantêm o **sufixo de modelo** no nome (`reviewer-opus`, `coder-sonnet`, …), enquanto as referências de processo — `ONBOARDING.md`, os campos `agent:`/`next_agent:` do handoff e o corpo do orchestrator — continuam usando o **nome-base** (`reviewer`, `coder`). A separação é deliberada: os hooks e o `artifact_path` dependem do nome-base, e o sufixo existe para tornar o modelo visível já na listagem de agentes.

**Requisito que sustenta a decisão:** em qualquer momento deve estar claro qual modelo está de fato executando. Três camadas garantem isso, e as três precisam continuar existindo:

1. **Frontmatter** — cada agente declara seu `model:` designado.
2. **Auto-verificação** — todo agente tem a seção "Modelo designado (ADR-001)" e confere, no próprio system prompt, em que modelo está rodando. Divergência do designado devolve `status: blocked` com o blocker `"modelo divergente: esperado {X}, rodando em {Y}"` em vez de seguir — o downgrade silencioso vira bloqueio visível.
3. **Ponteiro de handoff** — `model` é campo **obrigatório** (`multi-agents/HANDOFF-PROTOCOL.md` §3.2) e registra o modelo em que o subagente efetivamente rodou, não o designado. É o que fica no `run-log.md` como evidência.

**Custo aceito:** se este ADR trocar o modelo de um agente, o **arquivo mantém o nome-base** (`reviewer.md`, `coder.md`, …) — só o `name:` no frontmatter carrega o sufixo, e é ele que muda. As referências que usam nome-base seguem válidas sem alteração; qualquer menção ao nome sufixado (documentação, scripts) precisa ser atualizada na mesma mudança. Em particular, `.claude/workflows/gbpa-task.js` (ADR-005) hard-codeia os `agentType` sufixados (`architect-opus`, `planner-sonnet`, `spec-writer-sonnet`, `coder-sonnet`, `tester-sonnet`, `reviewer-opus`, `security-sre-fable`) — troca de modelo precisa atualizar esses valores no script junto. A revisão trimestral deste ADR é o momento de verificar isso.

## Revisão de 2026-09-23 — Opus 5.5 nos nós críticos, Fable 5.1 no gate de segurança

*(decidido pelo Tech Lead)*

`orchestrator`, `architect` e `reviewer` passam de **Fable 5** para **Opus 5.5**. O `security-sre` (ADR-002) **fica em Fable**, agora fixado em **Fable 5.1**. O racional de *onde* fica o modelo de topo não muda: decomposição, design e os dois gates. Muda *qual* modelo ocupa esses nós — e os dois gates passam a rodar em famílias diferentes: em task sensível, a lente de correção (Reviewer, Opus) e a de segurança (Security-SRE, Fable) não compartilham os pontos cegos de um mesmo modelo.

- **ID completo, não alias.** O frontmatter usa `model: claude-opus-5-5` e, no Security-SRE, `model: claude-fable-5-1`. O alias seguiria automaticamente a próxima versão da família — e herdaria a versão exata da conversa principal quando ela já roda naquela família —, o que tira da revisão deste ADR a decisão de trocar o modelo de um gate. Fixar o ID troca conveniência por controle: o upgrade seguinte é uma revisão explícita deste ADR, não um efeito colateral.
- **Sufixo segue a família:** `architect-opus`, `reviewer-opus`; `security-sre-fable` não muda de nome. O `orchestrator` continua sem sufixo. O campo `model` do ponteiro de handoff passa a registrar o ID exato (`claude-opus-5-5`, `claude-fable-5-1`).
- **Auto-verificação:** cada agente confere se roda na versão designada (Opus 5.5; Fable 5.1 no Security-SRE); outra versão ou família devolve `status: blocked` com modelo divergente. Sufixo de janela de contexto (`[1m]`) não é outra versão.
- **Mudou junto:** `name:`/`model:` dos três agentes em Opus e o `model:` do Security-SRE; os `agentType` e a descrição do campo `model` no `gbpa-task.js`; ADR-002, 003 e 005; `HANDOFF-PROTOCOL` (o campo `model` do ponteiro passa a registrar o ID exato); `ARCHITECTURE`; as tabelas de modelo do `DESENVOLVIMENTO-COM-IA`, do `ONBOARDING`, do `README` e da `praticas/00`; as decisões 2 e 4 do `PENDENCIAS-TECH-LEAD`; e um payload da suíte em `docs/patches/`.
- **Sessões abertas:** a definição dos agentes carrega no startup do Claude Code — reinicie as sessões para que os nomes `-opus` e os modelos fixados valham.
- **Evidência antiga não muda:** artifacts em `tasks/` anteriores a esta data registram `fable` nos quatro agentes porque foi nele que rodaram.

## Notas operacionais

- Ajustes de modelo são mudança de governança: alterar frontmatter dos agentes passa pelo Tech Lead (a pasta `.claude/` é guardrail — ver `GOVERNANCE.md §6`).
- Recomenda-se que cada máquina da equipe NÃO use `skipDangerousModePermissionPrompt: true` no settings global do Claude Code — as travas do projeto são a última linha de defesa e não devem ser a única.
