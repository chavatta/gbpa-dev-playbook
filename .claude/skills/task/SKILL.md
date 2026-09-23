---
name: task
description: >-
  Abre e executa uma task de desenvolvimento pelo fluxo do playbook (recon → plan → coder → review → gate).
  Use quando o dev pedir "/task <slug>" ou "abre uma task para X". Cria tasks/{id}/, preenche o brief e dispara
  o workflow gbpa-task. Não use para pergunta, leitura de código ou ajuste de documentação sem código.
disable-model-invocation: true
---

# /task — abrir e executar uma task pelo fluxo do playbook

> Camada: playbook · Dono: Tech Lead · Executa `.claude/workflows/gbpa-task.js` (`docs/ADR-005`)

Você é a **sessão principal**: faz o papel de Orchestrator no que o script não faz — brief, run-log e síntese.
O roteamento, o loop e o gate são do script. Não os refaça à mão.

## Quando usar
- `/task <slug>` ou `/task <slug> — <objetivo em uma frase>`.
- Task de código: feature, bug, refactor, infra com arquivo versionado.

## Quando NÃO usar
- Pergunta ou exploração sem mudança de código.
- Mudança só em documentação do playbook (fluxo enxuto manual basta).
- Arquivo protegido (`GOVERNANCE.md`, `.claude/settings.json`, `.claude/hooks/` e, com o lote de patches de 2026-09-23, `.claude/workflows/` e `.claude/agents/`): vai para `docs/patches/`.

## Pré-requisitos
- Sessão aberta na raiz do repo (hooks carregam no startup).
- `tasks/_TEMPLATE/` presente.
- Dynamic workflows habilitados (`/config` → Dynamic workflows). Plano pago.

## Procedimento

1. **Monte o `task_id`**: `AAAA-MM-DD_<slug>` — data de hoje via `date +%F`, slug em kebab-case. Se a pasta já existir, pare e pergunte.
2. **Crie a pasta**: copie `tasks/_TEMPLATE/` para `tasks/{task_id}/`.
3. **Preencha `brief.md`** com o que o dev disse. Se faltar o **objetivo verificável**, pergunte antes de seguir — é a única pergunta obrigatória. Campos:
   - `Complexidade:` escreva `a definir pelo recon` (o script decide).
   - `Sensível (security gate):` `sim` se o dev disser ou se a classe de dado for Confidencial/Restrita; senão `não`. O recon pode elevar; nunca rebaixa.
   - `Classe de dado:` pergunte se não for óbvio (`praticas/10` §2). Restrita ⇒ não abra a task; escale ao Tech Lead.
   - `Fluxo escolhido:` `gbpa-task (workflow)`.
4. **Registre no run-log**: anexe a linha `| <timestamp> | orchestr. | task_created | - | brief.md |`.
5. **Dispare o workflow** com a ferramenta Workflow, por nome, passando `args` como objeto (não como string):
   `{ "name": "gbpa-task", "args": { "task_id": "<task_id>", "sensitive": <true|false> } }`
6. **Ao receber o retorno**, anexe ao `run-log.md` uma linha por item de `events` (`| ts | agent | status | - | ref |`). Se o retorno trouxer `sensitive: true` e o brief disser `Sensível (security gate): não`, **troque para `sim`** e acrescente "— elevado pelo recon (artifacts/recon.md)": é o brief que o hook `check-reviewer-gate.mjs` e a métrica M2 leem. Nunca troque de `sim` para `não`. Depois trate o `status`:
   - `done` → anexe `| ts | orchestr. | done | done | artifacts/reviewer.md |` e sintetize (formato do `00-orchestrator.md` → "Formato de Saída").
   - `fatiada` → liste as fatias e diga: "abra uma `/task` por fatia". Não anexe `done`.
   - `escalado` → registre `rerouted → architect` e apresente os issues ao dev. Não anexe `done`.
   - `divergencia` → registre e apresente os dois vereditos ao dev: a decisão é humana. Não anexe `done`.
   - `blocked` → registre o blocker (`em` diz onde parou) e pare. `em: lentes`, `em: reviewer` ou `em: refutador cego` significam que um verificador não devolveu veredito — falha de execução, não de código: não é `done` e não conta como reprovação; rode de novo ou leve ao dev.
7. **Nunca escreva `done` sem `artifacts/reviewer.md` com `**Veredito:** APROVADO`** na primeira linha — o hook `check-reviewer-gate.mjs` impede o encerramento da sessão se você o fizer.

## Exemplo
`/task login-rate-limit — limitar tentativas de login a 5 por minuto por IP`
→ cria `tasks/2026-09-15_login-rate-limit/`, brief com objetivo, `Sensível: sim` (auth), dispara `gbpa-task` com `{task_id, sensitive: true}`.

## Armadilhas comuns
- Passar `args` como string JSON: o script recebe texto e falha na validação. Passe objeto.
- Reescrever o `run-log.md` com Write: ele é append-only. Use Edit para anexar.
- Rodar o workflow sem a pasta criada: o recon não acha o brief e devolve `blocked`.
- Achar que `sensitive: false` no brief impede o rigor extra: o recon pode elevar. É OR, por desenho — e o brief tem de refletir a elevação (passo 6).
- Mudar o script sem rodar `node scripts/test-gbpa-task.mjs`: o smoke test simula os agentes e cobre todos os status de retorno, sem gastar quota.
