# Pendências para o Tech Lead

> **Dono:** Tech Lead · **Revisão:** trimestral · **Última revisão:** 2026-08-31
>
> **Status (2026-08-31):** os dois patches em arquivos protegidos foram **aplicados por mão humana** — `block-dangerous-git.mjs` corrigido (suíte de 60 payloads passando contra o hook em produção) e `GOVERNANCE.md` §7 em vigor. **Branch protection ativada** em `main`. Cinco das sete decisões abertas foram tomadas. **Reinicie as sessões do Claude Code** se ainda não o fez desde a aplicação do hook — hooks carregam no startup.

---

## Aberto

### 1. Campos 🔒 do `praticas/00` que extrapolam o projeto

O 00 é preenchido **por projeto** e campo em branco é decisão do Architect em ADR, não blocker (`ONBOARDING.md` §2, passo 6). Restam ao Tech Lead apenas os dois que nenhum projeto decide sozinho:

- **Status do contrato/DPA com o provedor de LLM** — sem ele, dado Confidencial não cumpre a condição 2 da `praticas/10` §3, e nenhuma ferramenta passa de "aprovada para dado Interno".
- **Política de dados pessoais em prompt** — o recorte prático do que a §7.1 do `GOVERNANCE.md` já proíbe.

Ambos alimentam a ação **4.7** do `ISO-MAPPING.md` (verificar retenção, opt-out de treino, subprocessadores e DPA do provedor).

### 2. Regenerar os binários de `docs/` e fixar o processo

**Decidido (2026-08-31):** regenerar a partir do `.md`, não remover — o formato distribuível é entregável para quem não abre o repo, auditor incluído.

`DESENVOLVIMENTO-COM-IA.docx` e `.pdf` são de 2026-08-09 e estão várias mudanças atrás do `.md`. Falta a ferramenta: `pandoc` não está instalado.

```bash
brew install pandoc
```

```bash
pandoc DESENVOLVIMENTO-COM-IA.md -o docs/DESENVOLVIMENTO-COM-IA.docx
```

O PDF exige um motor adicional (`--pdf-engine`); decidir qual ao instalar — `basictex` dá saída tipográfica melhor, `weasyprint` é mais leve e fiel ao HTML. Depois de escolher, **fixe os dois comandos aqui e no `EVIDENCIAS-E-METRICAS.md` §4**, com a regra: regenerar a cada release do playbook, e a data no cabeçalho do `.md` é a fonte da verdade da versão.

### 3. Trava opcional — exigir `impacto-ia.md` mecanicamente

Estender `check-reviewer-gate.mjs` para exigir `tasks/{id}/artifacts/impacto-ia.md` quando o `brief.md` marcar `**Avaliação de impacto de IA:** sim`. É o mesmo padrão do gate de segurança e fecha mecanicamente o §7.4 do `GOVERNANCE.md`, que hoje depende de disciplina. Só o Tech Lead edita hooks: patch vai para `docs/patches/` com banco de payloads, como o anterior.

### 4. Ações de conformidade ISO

Rastreadas com numeração estável em `docs/ISO-MAPPING.md` §4:

- ~~**4.1** branch protection~~ (feita em `main` deste repo — **replicar nos demais repos da GBPA**) · **4.2** preencher `praticas/00` (ver item 1) · ~~**4.3** patch do §7~~ (aplicado) · ~~**4.4** SLA por severidade~~ (decidido, ver abaixo)
- **4.5** runbook de incidente envolvendo IA · **4.6** registro de competência (quem leu o onboarding, quando) · **4.7** termos do provedor de IA: retenção, opt-out de treino, subprocessadores, DPA
- **4.8** registro de risco e Declaração de Aplicabilidade · **4.9** auditoria interna e análise crítica — ambas na camada organizacional, fora deste repositório

---

## Decidido em 2026-08-31

| # | Assunto | Decisão | Onde ficou registrado |
|---|---|---|---|
| 1 | **Branch protection** | Ativada em `main`: **PR obrigatório**, resolução de conversas exigida, force push e deleção bloqueados. Aprovações exigidas: **0** enquanto houver um só mantenedor — ver ressalva abaixo | GitHub (`chavatta/gbpa-dev-playbook`) |
| 2 | **Alias `model: fable`** | Válido no Claude Code atual; a auto-verificação de modelo nos agentes cobre o fallback silencioso. Não precisa trocar pelo id completo | ADR-001 (revisão trimestral) |
| 3 | **SLA por severidade** | Sem prazo por relógio. **Todo achado que impacta o processo é bloqueador até um humano resolvê-lo** — corrigindo ou aceitando o risco por escrito. Achado que não impacta o processo segue backlog priorizado | `praticas/06-devsecops.md` → "Severidade e prazo de correção" |
| 4 | **Nome dos agentes** | Mantido o sufixo de modelo (`reviewer-fable`), com nome-base nas referências de processo. Requisito: o modelo em execução tem de estar claro — garantido por frontmatter + auto-verificação + campo `model` obrigatório no ponteiro de handoff | `ADR-001` → "Nomenclatura dos agentes e visibilidade do modelo" |
| 5 | **Trilha de certificação** | Fora do backlog por ora. Não é pendência aberta | — |

**Ressalva da branch protection — reveja quando o time crescer.** O GitHub não deixa ninguém aprovar o próprio PR. Com um só mantenedor, exigir 1 aprovação tornaria todo merge dependente de bypass de admin, e trava que só se cumpre por bypass ensina a equipe a usar bypass. Por isso a exigência está em **0 aprovações**: o PR continua obrigatório (nada entra em `main` por push direto, e o histórico de revisão fica registrado), mas o merge não trava.

**Isso é configuração de transição, não o estado desejado.** Assim que houver um segundo revisor, subir para 1 e incluir os administradores na regra:

```bash
gh api -X PATCH repos/chavatta/gbpa-dev-playbook/branches/main/protection/required_pull_request_reviews -F required_approving_review_count=1
```

```bash
gh api -X PUT repos/chavatta/gbpa-dev-playbook/branches/main/protection/enforce_admins
```

Note o `-F` maiúsculo: `required_approving_review_count` é inteiro, e `-f` (minúsculo) manda string, que a API rejeita com HTTP 422.

---

## Histórico de patches aplicados

| Data | Arquivo protegido | O que mudou | Evidência |
|---|---|---|---|
| 2026-08-04 | `check-reviewer-gate.mjs`, `block-dangerous-git.mjs`, `settings.json`, `GOVERNANCE.md` | Veredito ancorado, gate de segurança, bypasses de push fechados, trava de DDL destrutivo | Suíte de 26 casos |
| 2026-08-31 | `GOVERNANCE.md` §7 | Dados, evidência e conformidade — torna a `praticas/10` lei, não referência | Controle 42001 A.9.2 sai de PARCIAL no `ISO-MAPPING.md` |
| 2026-08-31 | `block-dangerous-git.mjs` | Casamento por posição de comando (fim do falso positivo em `grep` da própria documentação); quebra de linha como separador; ofuscação por aspas; wrappers `sh -c`/`eval`/`xargs`; **escrita em zona protegida via shell** | Suíte de 60 payloads em `docs/patches/`; 38/45 na versão anterior |

A lacuna de escrita por shell merece registro: `protect-guardrails.mjs` só intercepta `Write|Edit|MultiEdit|NotebookEdit`, e o deny do `settings.json` cobre as mesmas ferramentas. Um `cp`/`tee`/`>` para `.claude/hooks/` não passava por trava nenhuma do playbook — na sessão de 2026-08-31 quem barrou a tentativa foi o classificador do harness, não a nossa defesa. Está fechado no patch aplicado nesta data.

**Regra que vale para o próximo patch:** trava só muda em branch, com banco de payloads provando o caso novo sem afrouxar os antigos, rodado contra a versão antiga e a nova — e quem aplica o arquivo é o Tech Lead, à mão, fora da sessão do agente (`GOVERNANCE.md` §6.2).
