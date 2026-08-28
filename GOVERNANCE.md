# GOVERNANCE — Regras do Playbook de Desenvolvimento

> Este documento é **lei** para todo trabalho feito com este playbook — por pessoas e por agentes de IA.
> Só o Tech Lead altera este arquivo (e as travas em `.claude/`). Divergência de interpretação → o Tech Lead decide.

---

## §1. Papéis

| Papel | Quem | Responsabilidade |
|---|---|---|
| **Tech Lead** | Definido por projeto | Decisão final: aprova exceções, resolve divergências, ajusta travas, define conta/organização de repos |
| **Analista/Dev** | Cada membro da equipe | Conduz as sessões de IA, revisa os PRs gerados, é **responsável pelo que a IA produz em seu nome** |
| **Agentes de IA** | Orchestrator + 12 especialistas | Executam dentro do escopo definido em `.claude/agents/` e `multi-agents/` — nunca fora dele |

---

## §2. Regras de Git

1. **`main`/`master` é intocável.** Nenhum push direto, nunca. Todo trabalho nasce em branch.
2. **Draft PR desde o início.** O trabalho sobe cedo como draft; vira ready só depois de revisado (pelo Reviewer do fluxo E pelo dev responsável).
3. **Sem force push, sem `git reset --hard`, sem `rm -rf`.** As travas bloqueiam; se você acha que precisa, é conversa com o Tech Lead.
4. **Commits limpos:** mensagem descreve o quê e por quê. Sem marcações de IA em commits ou código.
5. **PRs pequenos:** ~200–400 linhas. Cresceu → volta ao Planner para fatiar.
6. **Branch protection no servidor é obrigatória.** Todo repo tem `main`/`master` protegida no GitHub: PR obrigatório com ≥1 aprovação, status checks verdes, force push e deleção bloqueados. As travas locais (`settings.json` + hooks) são a segunda linha de defesa — a que não se contorna é a do servidor.

---

## §3. Fluxo multi-agent obrigatório

1. **Nenhuma implementação direta** sem passar pelo fluxo: toda task de dev não-trivial entra pelo `orchestrator`, que escala o fluxo enxuto (`Plan → Coder → Reviewer`) conforme a complexidade (`multi-agents/HANDOFF-PROTOCOL.md §6`).
2. Cada agente **opera só no seu escopo** (manuais em `multi-agents/agents/`).
3. Handoffs **sempre via artifact em disco** + ponteiro leve (`multi-agents/HANDOFF-PROTOCOL.md`).
4. **Code review é obrigatório:** nenhuma task é `done` sem `tasks/{task_id}/artifacts/reviewer.md` com `**Veredito:** APROVADO` na primeira linha. O hook `check-reviewer-gate.mjs` verifica mecanicamente.
5. **Gate de segurança em task sensível:** task que toca auth, dados pessoais, dinheiro, superfície externa ou infra/pipeline não é `done` sem `tasks/{task_id}/artifacts/security-sre.md` com `**Veredito:** APROVADO` (agente e escopo em `docs/ADR-002-agente-security-sre.md`). O hook `check-reviewer-gate.mjs` verifica mecanicamente quando o `brief.md` marca a task como sensível. Risco residual só o Tech Lead aceita, registrado no artifact com nome e data.
6. **Biblioteca de práticas:** `praticas/` é a referência de decisão da equipe (código, arquitetura, repos, containers, segurança, testes). Não é lei — este documento é — mas desvio relevante de uma prática se justifica no ADR da decisão. Os defaults do projeto vivem em `praticas/00-stack-e-defaults-gbpa.md`.
7. **Exceções:** correções triviais de 1 linha podem comprimir o fluxo para `Coder → Reviewer` (o gate continua). Protótipos exploratórios podem pular etapas **desde que marcados como protótipo não-revisado** — e nunca vão para `main` nesse estado.

---

## §4. Paralelismo e sincronização segura

1. **Um dono por arquivo, sempre.** Dois agentes (ou duas pessoas) nunca editam o mesmo arquivo na mesma janela de tempo. Tasks paralelas exigem `files_changed` disjuntos.
2. **Coders paralelos = git worktrees** (branch própria por worktree). Integração via PR.
3. Arquivos de task têm escritor único: `brief.md`, `run-log.md` e `artifacts/skill-candidates.md` são do Orchestrator; cada `artifacts/{agente}.md` é do agente homônimo.
4. Repo dentro de pasta sincronizada (OneDrive/Drive)? **Evite.** Se inevitável: aguarde o sync concluir antes de paralelizar ou mergear, e nunca misture edição offline/online. Arquivo "(conflito)" apareceu → pare o paralelismo e avise o Tech Lead.
5. Em dúvida entre paralelizar e sequenciar: **sequencie.**

---

## §5. Premissas de projeto novo

1. **Repo primeiro:** criar o repositório GitHub **privado** (conta/organização definida pelo Tech Lead) antes de qualquer commit. Público só por ordem explícita do Tech Lead. **Branch protection** em `main`/`master` ativada imediatamente após criar o repo (§2.6) — é configuração do Tech Lead.
2. Nome do repo em kebab-case; remote `origin` configurado de imediato.
3. Primeiro commit mínimo: `README.md` + `.gitignore` adequado à stack.
4. Para adotar este playbook no repo novo: copie `.claude/`, `multi-agents/`, `praticas/`, `tasks/_TEMPLATE/` e os docs da raiz (ver `README.md`).

---

## §6. Travas mecânicas

1. As travas vivem em `.claude/settings.json` (permissions deny) e `.claude/hooks/` (scripts). Elas **não são sugestões**: bloqueiam a ação no momento em que ela seria executada. A trava primária de git é a **branch protection no servidor** (§2.6); as locais são a segunda linha.
2. O que está travado localmente: push em `main`/`master` (qualquer sintaxe, incluindo flags e refspec `branch:main`), force push, `rm -rf`, `git reset --hard`, `git clean -f`, DDL destrutivo via CLI de banco (`DROP`/`TRUNCATE` em `psql`/`mysql`), escrita em `GOVERNANCE.md` / `.claude/settings.json` / `.claude/hooks/`, e encerramento de sessão com task `done` sem aprovação do Reviewer (e do Security-SRE, em task sensível).
3. **Trava disparou → não se contorna.** Nem manualmente, nem pedindo para a IA reformular o comando. Falso positivo → reporte ao Tech Lead, que ajusta a trava pelo processo.
4. Requisito das máquinas: **Node.js ≥ 18** instalado e no PATH (os hooks são scripts Node `.mjs` — a mesma implementação roda em macOS, Linux e Windows, sem configuração por sistema) e sessões do Claude Code abertas **na raiz do repo** (os hooks usam caminho relativo e são carregados no startup — mudou hook, reinicie a sessão). Os hooks `.sh` legados permanecem no repo apenas como referência; o `settings.json` aponta para os `.mjs`.
