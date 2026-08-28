# Pendências para o Tech Lead

> **Status (2026-08-04):** os patches nas travas mecânicas foram **aplicados** (por mão humana, como o processo exige): veredito ancorado + gate de segurança com hook no `check-reviewer-gate.mjs`; bypasses de push fechados + trava de DDL destrutivo no `block-dangerous-git.mjs`; denies extras no `settings.json`; `GOVERNANCE.md` atualizado (§2.6, §3.4–3.5, §4.3, §5, §6). Ambos os hooks passaram por suíte de testes (26 casos). **Sessões do Claude Code precisam ser reiniciadas** para carregar os hooks novos.

## O que resta (decisões, não patches)

1. **Ativar branch protection** em `main`/`master` dos repos existentes no GitHub (PR obrigatório, ≥1 aprovação, status checks, force push/deleção bloqueados) — a regra do `GOVERNANCE.md §2.6` só vale se aplicada no servidor.
2. ~~**Preencher `praticas/00-stack-e-defaults-gbpa.md`**~~ — *resolvido como processo, não como pendência:* o 00 passou a ser preenchido **por projeto** (`ONBOARDING.md §2`, passo 6) e campo em branco é **decisão do Architect** em ADR, não blocker do Tech Lead. Resta ao Tech Lead apenas os campos que extrapolam o projeto: **política de dados pessoais em prompt e status do contrato/DPA com o provedor de LLM**.
3. **Validar o alias `model: fable`** no frontmatter dos 4 agentes numa task real — se o harness não reconhecer, o fallback é silencioso; nesse caso trocar pelo id completo `claude-fable-5` (ADR-001, revisão trimestral).
4. **Definir SLA de correção por severidade** para achados de segurança não-bloqueantes (`praticas/06-devsecops.md`, camada 2) — sem isso, "CRITICAL/HIGH explorável bloqueia" depende de interpretação.

---

## Patch pendente em arquivo protegido — `GOVERNANCE.md` §7

> **Contexto:** trabalho de conformidade ISO/IEC 27001 e 42001 (`docs/ADR-004-conformidade-iso.md`, `docs/ISO-MAPPING.md`).
> `GOVERNANCE.md` é zona negada para escrita por agentes (§6.2). O texto abaixo está pronto para colar **por mão humana**, ao final do arquivo. Enquanto não for aplicado, `praticas/10-dados-e-contexto-de-ia.md` vale como prática (referência), não como lei — e o controle 42001 A.9.2 fica PARCIAL no `ISO-MAPPING.md`.

```markdown
---

## §7. Dados, evidência e conformidade

1. **Classificação antes do contexto.** Toda informação enviada a um modelo de IA é classificada como Pública, Interna, Confidencial ou Restrita (`praticas/10-dados-e-contexto-de-ia.md` §2). Dado **Restrito** — segredo, credencial, dado pessoal sensível (LGPD art. 5º II), dado de criança ou adolescente — **nunca entra no contexto de um modelo. Sem exceção, e nem o Tech Lead autoriza.** Dado **Confidencial** só entra com as três condições da §3 daquele documento: ferramental aprovado, contrato que cubra o subprocessamento e minimização.
2. **A classe declarada no brief.** Todo `brief.md` declara a classe de dado da task. Classe Confidencial ou Restrita torna a task **sensível** para efeito do gate do Security-SRE (§3.5).
3. **Envio indevido é incidente, não achado.** Reportar ao Tech Lead imediatamente; se for credencial, revogar e rotacionar; se envolver dado pessoal, o Tech Lead aciona o encarregado (DPO) para avaliar o art. 48 da LGPD. Registrar no `run-log.md`. Não há punição por reportar rápido — há por esconder.
4. **Avaliação de impacto de IA.** Feature que entrega decisão ou conteúdo de IA a usuário final, processa dado pessoal com IA, ou influencia decisão sobre pessoas não é `done` sem `tasks/{task_id}/artifacts/impacto-ia.md` (`multi-agents/templates/AVALIACAO-IMPACTO-IA.template.md`), auditado pelo Security-SRE.
5. **Evidência é versionada.** `tasks/` não entra no `.gitignore`. Brief, run-log e artifacts são retidos por **3 anos** (`docs/EVIDENCIAS-E-METRICAS.md` §2). Artifact registra veredito e racional — nunca dado real de cliente ou pessoal.
6. **Revisão periódica.** Cada documento do playbook tem dono e cadência declarados em `docs/EVIDENCIAS-E-METRICAS.md` §4. Revisão feita atualiza a data no cabeçalho, mesmo sem alteração de conteúdo.
```

**Efeito colateral do patch:** o §3.5 (gate de segurança) passa a ter um gatilho adicional — classe de dado — e o `brief.md` já foi atualizado com os dois campos novos. Nenhuma trava mecânica muda; o `check-reviewer-gate.mjs` continua verificando o marcador de sensibilidade, que agora também é acionado pela classe.

**Trava opcional (decisão do Tech Lead):** estender `check-reviewer-gate.mjs` para exigir `artifacts/impacto-ia.md` quando o brief marcar `**Avaliação de impacto de IA:** sim`. É o mesmo padrão do gate de segurança e fecha o item 4 acima mecanicamente. Só o Tech Lead edita hooks.

## Ações de conformidade ISO em aberto

Rastreadas com numeração estável em `docs/ISO-MAPPING.md` §4:

- **4.1** branch protection nos repos existentes · **4.2** preencher `praticas/00` (inclui ferramental aprovado para dado Confidencial) · **4.3** este patch do §7 · **4.4** SLA por severidade
- **4.5** runbook de incidente envolvendo IA · **4.6** registro de competência (quem leu o onboarding, quando) · **4.7** verificar termos do provedor de IA: retenção, opt-out de treino, subprocessadores, DPA
- **4.8** registro de risco e Declaração de Aplicabilidade · **4.9** auditoria interna e análise crítica — ambas na camada organizacional, fora deste repositório

