# HANDOFF-PROTOCOL.md — Protocolo de Handoff em Arquivos

> Complemento operacional de `ARCHITECTURE.md`. Define **como** os agentes trocam trabalho na prática.
> Regra de ouro: **artifacts são arquivos no disco, não JSON no contexto.** O Orchestrator nunca carrega o conteúdo bruto de um subagente — só referências leves.

---

## 1. Por que arquivo e não contexto

O mecanismo de subagente devolve ao Orchestrator apenas a **mensagem final** do subagente — ele não persiste nada sozinho. Se o subagente despejar todo o trabalho nessa mensagem, dois anti-padrões do `ARCHITECTURE.md` acontecem na hora:

- **Context bloat** — o contexto do Orchestrator estoura com conteúdo bruto.
- **Telephone game** — informação se deforma a cada repasse.

A correção é forçar a regra: **cada subagente grava seu resultado completo em arquivo e devolve só um ponteiro leve.**

---

## 2. Estrutura de uma task

Toda task de desenvolvimento vive em `tasks/{task_id}/`:

```
tasks/
└── {task_id}/                  # ex: 2026-06-29_auth-jwt
    ├── brief.md                # objetivo, escopo, critérios de sucesso (criado pelo Orchestrator)
    ├── run-log.md              # linha do tempo append-only (observabilidade)
    ├── memory.md               # episodic memory: decisões da sessão
    └── artifacts/              # output completo de cada agente
        ├── architect.md
        ├── planner.md
        ├── coder.md
        ├── reviewer.md
        └── ...
```

**`task_id`** = `AAAA-MM-DD_slug-curto` (kebab-case). Único e estável; todos os agentes referenciam o mesmo.

---

## 3. Contrato do subagente

Ao terminar, **todo** subagente faz duas coisas:

### 3.1. Grava o artifact completo
Em `tasks/{task_id}/artifacts/{agente}.md`, no formato de saída definido no seu manual (`multi-agents/agents/NN-*.md`). É aqui que vai TODO o conteúdo: código, plano, review, resultado de testes, etc.

### 3.2. Devolve SÓ o ponteiro leve
A mensagem final do subagente ao Orchestrator deve conter **apenas** este bloco — nada de copiar o conteúdo do artifact:

```yaml
agent: coder
task_id: 2026-06-29_auth-jwt
status: completed        # completed | blocked | needs_review
artifact_path: tasks/2026-06-29_auth-jwt/artifacts/coder.md
files_changed: [src/auth/login.ts, src/auth/jwt.ts]
next_agent: reviewer
context_for_next: "JWT implementado. Revisar validação do token e rate limiting."
blockers: []             # se status=blocked, listar aqui o que trava
skill_candidates: []     # skills existentes usadas e/ou candidatas a criar (ver §6.1)
```

Campos obrigatórios: `agent`, `task_id`, `status`, `artifact_path`, `next_agent`, `context_for_next`, `blockers`, `skill_candidates`.

---

## 4. O que o Orchestrator faz

1. Cria `tasks/{task_id}/` a partir de `tasks/_TEMPLATE/` e preenche `brief.md`.
2. Ao delegar, passa ao subagente: `task_id`, objetivo, contexto, output esperado, **LIMITES** e próximo agente.
3. Ao receber o ponteiro, lê **somente** `status`, `blockers` e `context_for_next`. Só abre o `artifact_path` se precisar tomar uma decisão de roteamento.
4. Anexa uma linha ao `run-log.md` a cada handoff (ver §5).
5. **Não marca a task como `done` sem `artifacts/reviewer.md` presente** (quality gate — `GOVERNANCE.md §3`). Task sensível (auth, dados pessoais, dinheiro, superfície externa, infra) exige também `artifacts/security-sre.md` com veredito `APROVADO`.
6. Em `blocker`, re-roteia para o agente capaz de resolver — não tenta resolver sozinho.

---

## 5. run-log.md (observabilidade)

Append-only. Uma linha por evento, formato:

```
| timestamp           | agent     | event      | status       | ref                              |
|---------------------|-----------|------------|--------------|----------------------------------|
| 2026-06-29 14:02    | architect | completed  | needs_review | artifacts/architect.md           |
| 2026-06-29 14:10    | coder     | started    | -            | -                                |
| 2026-06-29 14:38    | coder     | blocked    | blocked      | artifacts/coder.md (ver blocker) |
```

Isso materializa a seção "Observabilidade" do `ARCHITECTURE.md`: quem rodou, quando, com que status.

---

## 6. Fluxo enxuto (default)

Não acione os 12 agentes por reflexo. Escale o esforço à complexidade (`ARCHITECTURE.md` → Scaling de Esforço):

| Complexidade | Fluxo |
|--------------|-------|
| Trivial (1 linha) | Coder → Reviewer (gate ainda obrigatório) |
| Simples / Média | Orchestrator → **Plan** (architect+planner) → Coder → Reviewer |
| Complexa | + Tester (paralelo ao Coder), Debugger sob demanda |
| Feature não-trivial (SDD) | **Spec-Writer** antes do Architect |
| Camada de dados como foco | + **Data-Engineer** entre Architect e Planner |
| Subsistema de IA/LLM | + **AI-Engineer** (com Tester rodando as evals) |
| Sensível (auth, dados pessoais, dinheiro, superfície externa, infra) | + **Security-SRE** antes do `done` (após Reviewer em feature; após DevOps em infra) |
| Épica | Todos os 12, em ciclos |

Documenter e DevOps entram só quando a task pede docs ou infra; Spec-Writer, Data-Engineer, AI-Engineer e Security-SRE só nos seus gatilhos acima.

---

## 6.1. Skills no fluxo (reuso-primeiro)

Governança completa em `SKILLS-GOVERNANCE.md`. No handoff:

- **Reuso primeiro:** Architect/Planner checam as 3 camadas (instaladas → playbook → projeto) e marcam no artifact qual skill o Coder deve usar.
- **Candidate, não criação:** procedimento novo e recorrente (regra dos 3) vira um *skill candidate* registrado na seção `## Skill Candidates` do **próprio artifact** do agente que o detectou (respeitando o escritor único de `GOVERNANCE.md §4.3`) e listado no campo `skill_candidates` do ponteiro — sempre com **evidência com fonte** (padrão declarado em qual doc, ou em quais tasks se repetiu). Se houver candidates, o **Orchestrator** consolida no backlog do projeto, `docs/skill-backlog.md` (arquivo de escrita exclusiva dele; template em `multi-agents/templates/SKILL-BACKLOG.template.md`): candidate novo vira linha, candidate repetido incrementa o contador de ocorrências. Nenhum agente cria skill no meio da task.
- **Gate:** o Orchestrator decide sobre o backlog; se aprovado, o `documenter` autora via `skill-creator`, nascendo no projeto.
- O campo `skill_candidates` do ponteiro lista o que foi usado e/ou proposto.

---

## 7. Paralelismo seguro (anti-conflito de sync)

`GOVERNANCE.md §4` alerta para conflito de escrita simultânea em pastas sincronizadas (OneDrive/Drive). Para Coders em paralelo:

- Cada Coder paralelo trabalha em **git worktree próprio** (`isolation: worktree`) ou em módulos com **um dono por arquivo**.
- Commits frequentes; merge/review antes de integrar.
- Nunca dois agentes escrevendo o mesmo arquivo ao mesmo tempo.

---

## 8. Checklist rápido (cole no início de cada run)

- [ ] `task_id` definido e `tasks/{task_id}/` criado a partir do `_TEMPLATE`
- [ ] `brief.md` preenchido pelo Orchestrator
- [ ] Cada subagente grava em `artifacts/{agente}.md` e devolve só o ponteiro
- [ ] `run-log.md` atualizado a cada handoff
- [ ] Paralelismo só em trabalho independente, com worktree/dono único
- [ ] Skills checadas (reuso-primeiro); candidates registrados, não criados no meio da task
- [ ] `artifacts/reviewer.md` existe antes de `done`
- [ ] Task sensível → `artifacts/security-sre.md` com `APROVADO` antes de `done`

