# GBPA Dev Playbook

Padrão de desenvolvimento com IA da equipe: **time de agentes especializados + gates de qualidade + travas mecânicas de segurança**.

> **Dono:** Tech Lead · **Revisão:** semestral · **Última revisão:** 2026-09-23

## Comece por aqui

1. **[DESENVOLVIMENTO-COM-IA.md](DESENVOLVIMENTO-COM-IA.md)** — por que trabalhamos assim: riscos de dev com IA e como cada um é mitigado. *Leitura nº 1.*
2. **[ONBOARDING.md](ONBOARDING.md)** — setup e como trabalhar no dia a dia.
3. **[GOVERNANCE.md](GOVERNANCE.md)** — a lei: papéis, regras de git, gates e travas.
4. **[docs/ISO-MAPPING.md](docs/ISO-MAPPING.md)** — como o playbook se enquadra na ISO/IEC 27001 e 42001. *Para auditor, cliente e RFP.*

## O que tem aqui

```
gbpa-dev-playbook/
├── DESENVOLVIMENTO-COM-IA.md      # Riscos, cuidados e boas práticas (leia primeiro)
├── ONBOARDING.md                  # Guia de entrada do analista
├── GOVERNANCE.md                  # Regras (papéis, git, gates, travas)
├── .claude/
│   ├── agents/                    # 13 agentes (orchestrator + 12 especialistas), com modelo por papel
│   ├── hooks/                     # Travas mecânicas em Node/.mjs — multiplataforma (push em main, guardrails, reviewer gate)
│   ├── workflows/                 # gbpa-task.js — o fluxo de desenvolvimento como script (ADR-005)
│   ├── skills/                    # /task — abre uma task e dispara o fluxo
│   └── settings.json              # Permissions deny + registro dos hooks
├── multi-agents/
│   ├── ARCHITECTURE.md            # Doutrina: topologia, fluxos, anti-padrões
│   ├── HANDOFF-PROTOCOL.md        # Como os agentes trocam trabalho (artifacts em disco)
│   ├── SKILLS-GOVERNANCE.md       # Reuso e criação de skills (regra dos 3)
│   ├── agents/                    # Manual completo de cada agente (00–12)
│   └── templates/                 # SKILL.template.md, AVALIACAO-IMPACTO-IA.template.md
├── praticas/                      # Biblioteca de boas práticas (stack GBPA, clean code, clean architecture,
│                                  #   design funcional, modularização, monorepo, containers, EKS, DevSecOps+LGPD, testes,
│                                  #   dados e contexto de IA, MCP)
├── scripts/
│   ├── check-pii.sh               # Padrão de PII (CPF, CNPJ, celular) em fixtures/seeds — no CI, ao lado do gitleaks
│   └── test-gbpa-task.mjs         # Smoke test do fluxo por script, com agentes simulados — sem gastar quota
├── docs/
│   ├── ADR-001-modelos-por-agente.md … ADR-005-orquestracao-nativa-do-fluxo.md
│   ├── ISO-MAPPING.md             # Rastreabilidade ISO 27001 / ISO 42001 → evidência → status
│   ├── EVIDENCIAS-E-METRICAS.md   # Retenção de evidência, métricas do playbook, cadência de revisão
│   ├── PENDENCIAS-TECH-LEAD.md    # Patches em arquivos protegidos (hooks/settings/GOVERNANCE) — só o Tech Lead aplica
│   ├── COMPETENCIA.md             # Registro de quem leu o onboarding e quando (ISO 42001 A.4.6)
│   ├── RUNBOOK-INCIDENTE-IA.md    # Vazamento via prompt, código defeituoso em prod, dependência alucinada
│   ├── PROPOSTA-PIPELINE-FLUXO.md # Proposta que originou o ADR-005 — arquivada quando o ADR estiver em vigor e o piloto rodado
│   └── patches/                   # Versões propostas de arquivos protegidos — só o Tech Lead aplica
└── tasks/
    └── _TEMPLATE/                 # brief.md, run-log.md, memory.md, artifacts/
```

## Adotando em um repositório

Copie para a raiz do repo:

```bash
cp -R gbpa-dev-playbook/.claude gbpa-dev-playbook/multi-agents gbpa-dev-playbook/praticas gbpa-dev-playbook/scripts <repo>/
mkdir -p <repo>/tasks && cp -R gbpa-dev-playbook/tasks/_TEMPLATE <repo>/tasks/
cp -R gbpa-dev-playbook/docs <repo>/
cp gbpa-dev-playbook/{README.md,DESENVOLVIMENTO-COM-IA.md,ONBOARDING.md,GOVERNANCE.md} <repo>/
```

No Windows (PowerShell), o equivalente (`tasks\_TEMPLATE` exige criar `<repo>\tasks` antes):

```powershell
Copy-Item -Recurse gbpa-dev-playbook\.claude,gbpa-dev-playbook\multi-agents,gbpa-dev-playbook\praticas,gbpa-dev-playbook\scripts,gbpa-dev-playbook\docs <repo>\
New-Item -ItemType Directory -Force <repo>\tasks | Out-Null
Copy-Item -Recurse gbpa-dev-playbook\tasks\_TEMPLATE <repo>\tasks\
Copy-Item gbpa-dev-playbook\README.md,gbpa-dev-playbook\DESENVOLVIMENTO-COM-IA.md,gbpa-dev-playbook\ONBOARDING.md,gbpa-dev-playbook\GOVERNANCE.md <repo>\
```

Copia-se `tasks/_TEMPLATE/`, não as tasks deste próprio playbook. No repo adotante, esvazie `docs/PENDENCIAS-TECH-LEAD.md` e `docs/patches/` — são o backlog *deste* playbook, não do projeto novo — e apague `docs/COMPETENCIA.md`, que fica só no repo do playbook (registro organizacional, não por projeto).

Os hooks são scripts Node (`.mjs`) — funcionam automaticamente em macOS, Linux e Windows, sem `chmod` nem configuração por sistema.

Depois abra o Claude Code na raiz do repo — agentes, gates e travas carregam automaticamente.

## Requisitos

- [Claude Code](https://claude.com/claude-code) (plano com acesso aos modelos Opus 5.5 / Fable 5.1 / Haiku 4.5)
- [Node.js](https://nodejs.org) ≥ 18 (runtime dos hooks — multiplataforma)
- Git + GitHub CLI (`gh`)

Funciona em macOS, Linux e Windows sem configuração por sistema — os hooks são Node e o `settings.json` os invoca do mesmo jeito nos três.
