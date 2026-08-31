# Pendências para o Tech Lead

> **Dono:** Tech Lead · **Revisão:** trimestral · **Última revisão:** 2026-08-31
>
> **Status (2026-08-31):** os dois patches em arquivos protegidos foram **aplicados por mão humana** — `block-dangerous-git.mjs` corrigido (suíte de 60 payloads passando contra o hook em produção) e `GOVERNANCE.md` §7 em vigor. **Branch protection ativada** em `main`. Cinco das sete decisões abertas foram tomadas. **Reinicie as sessões do Claude Code** se ainda não o fez desde a aplicação do hook — hooks carregam no startup.

---

## Aberto

### 1. ⚠️ Confirmar a classe do plano contratado com a Anthropic — e migrar se for consumidor

**É a pendência mais consequente da lista, e a única que limita o que a equipe pode fazer hoje.**

A GBPA usa "plano de subscrição", o que cobre duas realidades contratuais opostas. O DPA da Anthropic é **incorporado automaticamente aos Termos Comerciais** (Team, Enterprise, API), com SCCs e sem assinatura separada — mas **não** alcança planos de consumidor (Pro, Max), em que cada usuário decide individualmente se seus dados vão para treino, com retenção de 5 anos quando ligado e 30 dias quando desligado.

**Se a subscrição for de consumidor**, falha a condição 2 da `praticas/10` §3 e **código de cliente não pode entrar no contexto** — o que inviabiliza o uso normal do playbook em projeto de cliente. E não há controle organizacional: o interruptor de treino é de cada pessoa, sem visibilidade central.

Encaminhamento: conferir o plano no Console (Billing); se for consumidor, migrar para **Claude for Work (Team)**; arquivar DPA e Termos Comerciais vigentes em `docs/contratos/` com a data; e substituir o valor do campo em `praticas/00` por algo verificável. Detalhe completo na nota do [`praticas/00`](../praticas/00-stack-e-defaults-gbpa.md) → IA/LLM. Fecha as ações **4.2** e **4.7**.

A base legal de transferência internacional sob a LGPD (cap. V) é pergunta para o jurídico — o DPA traz SCCs em formato europeu.

### 2. Ações de conformidade ISO

Rastreadas com numeração estável em `docs/ISO-MAPPING.md` §4:

- ~~**4.1** branch protection~~ (feita em `main` deste repo — **replicar nos demais repos da GBPA**) · **4.2** classe do plano e `praticas/00` (item 1) · ~~**4.3** patch do §7~~ · ~~**4.4** SLA por severidade~~ · ~~**4.5** runbook de incidente com IA~~
- **4.6** registro de competência — arquivo criado, **falta cada pessoa preencher a própria linha** (item 3) · **4.7** termos do provedor de IA — absorvida pelo item 1 · **4.8** registro de risco e Declaração de Aplicabilidade · **4.9** auditoria interna e análise crítica — as duas últimas na camada organizacional, fora deste repositório

### 3. Preencher o `docs/COMPETENCIA.md`

O arquivo existe e está vazio de propósito: **cada pessoa abre o PR que adiciona a própria linha** — registro preenchido por terceiro não é declaração de leitura. Comece pelo Tech Lead, para que exista uma linha de referência.

---

## Decidido em 2026-08-31

| # | Assunto | Decisão | Onde ficou registrado |
|---|---|---|---|
| 1 | **Branch protection** | Ativada em `main`: **PR obrigatório**, resolução de conversas exigida, force push e deleção bloqueados. Aprovações exigidas: **0** enquanto houver um só mantenedor — ver ressalva abaixo | GitHub (`chavatta/gbpa-dev-playbook`) |
| 2 | **Alias `model: fable`** | Válido no Claude Code atual; a auto-verificação de modelo nos agentes cobre o fallback silencioso. Não precisa trocar pelo id completo | ADR-001 (revisão trimestral) |
| 3 | **SLA por severidade** | Sem prazo por relógio. **Todo achado que impacta o processo é bloqueador até um humano resolvê-lo** — corrigindo ou aceitando o risco por escrito. Achado que não impacta o processo segue backlog priorizado | `praticas/06-devsecops.md` → "Severidade e prazo de correção" |
| 4 | **Nome dos agentes** | Mantido o sufixo de modelo (`reviewer-fable`), com nome-base nas referências de processo. Requisito: o modelo em execução tem de estar claro — garantido por frontmatter + auto-verificação + campo `model` obrigatório no ponteiro de handoff | `ADR-001` → "Nomenclatura dos agentes e visibilidade do modelo" |
| 5 | **Trilha de certificação** | Fora do backlog por ora. Não é pendência aberta | — |
| 6 | **Binários `.docx`/`.pdf`** | **Removidos.** O `.md` no repo é a única fonte; nada os referenciava e não havia processo de regeneração. Recuperáveis pelo histórico do git se voltarem a ser necessários | `docs/` |
| 7 | **Trava do `impacto-ia.md`** | **Descartada.** O gatilho depende de declaração humana no `brief`, então a trava só pegaria "declarei e não fiz" — não o caso que machuca. E não dispararia nenhuma vez no estado atual do repo. Reavaliar quando entrar o primeiro projeto com IA voltada a usuário final | — |
| 8 | **Dado real vs. sintético** | Não se valida se um dado é falso — CPF sintético e real têm a mesma forma. Inverte-se o controle: dump de produção não desce para desenvolvimento, fixture sintética por seed é a única fonte, e `scripts/check-pii.sh` roda no CI ao lado do `gitleaks` | `praticas/06` e `praticas/00` |

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
