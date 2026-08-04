# GBPA Dev Playbook

Padrão de desenvolvimento com IA da equipe: **time de agentes especializados + gates de qualidade + travas mecânicas de segurança**.

## Comece por aqui

1. **[DESENVOLVIMENTO-COM-IA.md](DESENVOLVIMENTO-COM-IA.md)** — por que trabalhamos assim: riscos de dev com IA e como cada um é mitigado. *Leitura nº 1.*
2. **[ONBOARDING.md](ONBOARDING.md)** — setup e como trabalhar no dia a dia.
3. **[GOVERNANCE.md](GOVERNANCE.md)** — a lei: papéis, regras de git, gates e travas.

## O que tem aqui

```
gbpa-dev-playbook/
├── DESENVOLVIMENTO-COM-IA.md      # Riscos, cuidados e boas práticas (leia primeiro)
├── ONBOARDING.md                  # Guia de entrada do analista
├── GOVERNANCE.md                  # Regras (papéis, git, gates, travas)
├── .claude/
│   ├── agents/                    # 13 agentes (orchestrator + 12 especialistas), com modelo por papel
│   ├── hooks/                     # Travas mecânicas em Node/.mjs — multiplataforma (push em main, guardrails, reviewer gate)
│   └── settings.json              # Permissions deny + registro dos hooks
├── multi-agents/
│   ├── ARCHITECTURE.md            # Doutrina: topologia, fluxos, anti-padrões
│   ├── HANDOFF-PROTOCOL.md        # Como os agentes trocam trabalho (artifacts em disco)
│   ├── SKILLS-GOVERNANCE.md       # Reuso e criação de skills (regra dos 3)
│   ├── agents/                    # Manual completo de cada agente (00–12)
│   └── templates/SKILL.template.md
├── praticas/                      # Biblioteca de boas práticas (stack GBPA, clean code, clean architecture,
│                                  #   design funcional, modularização, monorepo, containers, EKS, DevSecOps+LGPD, testes)
├── docs/
│   ├── ADR-001-modelos-por-agente.md
│   ├── ADR-002-agente-security-sre.md
│   ├── ADR-003-agentes-sdd-dados-ia.md
│   └── PENDENCIAS-TECH-LEAD.md    # Patches em arquivos protegidos (hooks/settings/GOVERNANCE) — só o Tech Lead aplica
└── tasks/
    └── _TEMPLATE/                 # brief.md, run-log.md, memory.md, artifacts/
```

## Adotando em um repositório

Copie para a raiz do repo:

```bash
cp -R gbpa-dev-playbook/.claude gbpa-dev-playbook/multi-agents gbpa-dev-playbook/praticas gbpa-dev-playbook/tasks <repo>/
cp gbpa-dev-playbook/{README.md,DESENVOLVIMENTO-COM-IA.md,ONBOARDING.md,GOVERNANCE.md} <repo>/
cp -R gbpa-dev-playbook/docs <repo>/
```

No Windows (PowerShell), o equivalente:

```powershell
Copy-Item -Recurse gbpa-dev-playbook\.claude,gbpa-dev-playbook\multi-agents,gbpa-dev-playbook\praticas,gbpa-dev-playbook\tasks,gbpa-dev-playbook\docs <repo>\
Copy-Item gbpa-dev-playbook\README.md,gbpa-dev-playbook\DESENVOLVIMENTO-COM-IA.md,gbpa-dev-playbook\ONBOARDING.md,gbpa-dev-playbook\GOVERNANCE.md <repo>\
```

Os hooks são scripts Node (`.mjs`) — funcionam automaticamente em macOS, Linux e Windows, sem `chmod` nem configuração por sistema.

Depois abra o Claude Code na raiz do repo — agentes, gates e travas carregam automaticamente.

## Requisitos

- [Claude Code](https://claude.com/claude-code) (plano com acesso aos modelos Fable 5 / Sonnet 5 / Haiku 4.5)
- [Node.js](https://nodejs.org) ≥ 18 (runtime dos hooks — multiplataforma)
- Git + GitHub CLI (`gh`)

Funciona em macOS, Linux e Windows sem configuração por sistema — os hooks são Node e o `settings.json` os invoca do mesmo jeito nos três.
