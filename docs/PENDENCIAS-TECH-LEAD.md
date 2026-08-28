# Pendências para o Tech Lead

> **Status (2026-08-04):** os patches nas travas mecânicas foram **aplicados** (por mão humana, como o processo exige): veredito ancorado + gate de segurança com hook no `check-reviewer-gate.mjs`; bypasses de push fechados + trava de DDL destrutivo no `block-dangerous-git.mjs`; denies extras no `settings.json`; `GOVERNANCE.md` atualizado (§2.6, §3.4–3.5, §4.3, §5, §6). Ambos os hooks passaram por suíte de testes (26 casos). **Sessões do Claude Code precisam ser reiniciadas** para carregar os hooks novos.

## O que resta (decisões, não patches)

1. **Ativar branch protection** em `main`/`master` dos repos existentes no GitHub (PR obrigatório, ≥1 aprovação, status checks, force push/deleção bloqueados) — a regra do `GOVERNANCE.md §2.6` só vale se aplicada no servidor.
2. ~~**Preencher `praticas/00-stack-e-defaults-gbpa.md`**~~ — *resolvido como processo, não como pendência:* o 00 passou a ser preenchido **por projeto** (`ONBOARDING.md §2`, passo 6) e campo em branco é **decisão do Architect** em ADR, não blocker do Tech Lead. Resta ao Tech Lead apenas os campos que extrapolam o projeto: **política de dados pessoais em prompt e status do contrato/DPA com o provedor de LLM**.
3. **Validar o alias `model: fable`** no frontmatter dos 4 agentes numa task real — se o harness não reconhecer, o fallback é silencioso; nesse caso trocar pelo id completo `claude-fable-5` (ADR-001, revisão trimestral).
4. **Definir SLA de correção por severidade** para achados de segurança não-bloqueantes (`praticas/06-devsecops.md`, camada 2) — sem isso, "CRITICAL/HIGH explorável bloqueia" depende de interpretação.
