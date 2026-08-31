# 00 — Stack e Defaults do Projeto

> Pergunta que este documento responde: **quais são as escolhas-padrão deste projeto, para que nem agentes nem devs re-decidam o já decidido?**
>
> As práticas 01–09 são critérios de mercado; **este arquivo é o que as ancora no projeto**. Em conflito entre uma preferência pessoal (ou de agente) e um default daqui, o default vence — desvio se justifica em ADR.
>
> **Preenchido por projeto, não uma vez pela organização.** Cada repo que adota o playbook carrega o seu 00 e o preenche no início (`ONBOARDING.md §2`, passo 6) — dois projetos da GBPA podem ter stacks legitimamente diferentes.
>
> **Dono:** Tech Lead · **Revisão:** trimestral · **Última revisão:** 2026-08-31

## Campo em branco não é blocker — é um menu

Na primeira task que esbarrar num campo `{...}` vazio, o **Architect não decide em silêncio nem devolve o problema**. Ele apresenta:

1. **As opções candidatas** do campo — a coluna "Opções" desta página é o ponto de partida, adaptada ao contexto real do projeto (o que o time já sabe operar, o que já existe no repo, restrição de custo ou de cliente).
2. **Uma recomendação, com o porquê em uma linha** — e o que se perde escolhendo diferente.
3. **A opção explícita "decida você, Architect"** — que é a resposta certa quando você não tem preferência e quer seguir sem parar a task. Não é abdicar: a decisão vira ADR e fica auditável como qualquer outra.

Escolhida a opção (ou delegada ao Architect), a decisão vira **ADR** e o valor **volta para esta tabela**, com o ADR citado na coluna "Nota". A partir daí é default do projeto e ninguém re-decide.

**Escale ao Tech Lead, não ao Architect,** os campos marcados 🔒 — custo recorrente, contrato com terceiro, risco jurídico ou de dados pessoais não são decisão de projeto.

> Legenda das opções: **★** = ponto de partida sugerido pelo playbook (não é decisão da GBPA — é onde começar a conversa quando ninguém tem preferência forte).

---

## Cloud e infraestrutura

| Default | Valor | Opções (★ = ponto de partida) | Nota |
|---|---|---|---|
| Cloud padrão 🔒 | `{...}` | ★ **AWS** · GCP · Azure · nenhuma (on-prem/VPS) | ★ só porque os exemplos deste arquivo e das práticas 04/05 assumem AWS. Rodagem do time pesa mais que a marca — se o time opera GCP melhor, GCP ganha |
| Região padrão | `{...}` | ★ **sa-east-1 / southamerica-east1 (São Paulo)** · us-east-1 · região na UE | ★ pela latência e por manter dado de cliente brasileiro no país (LGPD). us-east-1 é mais barata e tem mais serviços — trade-off consciente, e some se houver dado pessoal |
| Deploy default | `{...}` | ★ **PaaS/serverless de container** (Cloud Run, App Runner, Fly) · ECS+Fargate · Kubernetes (EKS/GKE) | Escada do [04](04-containerizacao.md)/[05](05-kubernetes-eks.md): comece no degrau mais baixo que atende. K8s exige justificativa em ADR, não é default |
| Registry de containers | `{...}` | ★ **registry da própria cloud** (ECR / Artifact Registry) · GHCR · Docker Hub | ★ evita credencial cross-cloud e egress. Quem mantém base images e política de CVE: `{dono}` |
| IaC | `{...}` | ★ **Terraform ou OpenTofu** · Pulumi · CDK · nenhum (console) | "Nenhum" só é aceitável em projeto descartável — infra clicada não é reproduzível. Estado remoto em: `{onde}` |

## Linguagens e tooling

| Default | Valor | Opções (★ = ponto de partida) | Nota |
|---|---|---|---|
| Linguagens oficiais | `{...}` | ★ **TypeScript (produto) + Python (dados/IA)** · Go (serviços de alta concorrência) · outra | Fora da lista escolhida = ADR do Architect. Menos linguagens = menos tooling para manter |
| Runtime/versões mínimas | `{...}` | ★ **Node LTS ativo + Python 3.12+** · versão anterior se houver dependência travada | Fixe a versão no `.nvmrc`/`.python-version` e no CI — "funciona na minha máquina" nasce aqui |
| Formatter + linter | `{...}` | ★ **Biome (TS) / ruff (Python)** · Prettier+ESLint / black+flake8 | ★ por serem uma ferramenta só e ordens de grandeza mais rápidas; a stack clássica ganha se você depende de plugin específico do ESLint. Config compartilhada em: `{repo/pacote}` — regra de [01-clean-code](01-clean-code.md) que dá para automatizar vive aqui, não em prosa |
| Gerenciador de pacotes / monorepo | `{...}` | ★ **pnpm workspaces (+ Turborepo se monorepo) / uv (Python)** · npm · yarn · poetry | Instrumenta "monorepo nasce com workspaces" do [03](03-monorepo-vs-multirepo.md) |
| Result/erros como valor | `{...}` | ★ **exceção na borda, Result no domínio** · Result em tudo (neverthrow) · exceção em tudo | ★ é o meio-termo do [08](08-design-funcional.md): erro esperado é valor, erro inesperado sobe. Fronteira exata deste projeto: `{critério}` |

## Banco e dados

| Default | Valor | Opções (★ = ponto de partida) | Nota |
|---|---|---|---|
| Banco padrão | `{...}` | ★ **Postgres gerenciado** (RDS / Cloud SQL / Neon / Supabase) · MySQL gerenciado · SQLite (embarcado/edge) | Sempre serviço gerenciado — [04](04-containerizacao.md). Postgres ★ por cobrir relacional, JSON e vetor sem trocar de banco |
| Ferramenta de migration | `{...}` | ★ **a do ORM já em uso** (prisma / drizzle / alembic) · dbmate (SQL puro) · Flyway | ★ evita duas fontes de verdade do schema; dbmate ganha se você quer SQL sem ORM. Sempre expand-contract com rollback (manual do Data-Engineer) |
| Vetores | `{...}` | ★ **pgvector no mesmo Postgres** · serviço dedicado (Qdrant, Pinecone) · nenhum | ★ enquanto couber: um banco a menos para operar. Dedicado só quando pgvector não atender o volume — com número no ADR, não por antecipação |

## CI/CD e segurança (instrumenta o [06](06-devsecops.md))

| Default | Valor | Opções (★ = ponto de partida) | Nota |
|---|---|---|---|
| CI | `{...}` | ★ **GitHub Actions** · GitLab CI · CircleCI | ★ se o repo já está no GitHub — a branch protection obrigatória abaixo já pressupõe isso |
| SAST | `{...}` | ★ **Semgrep (OSS)** · CodeQL · Snyk Code | CodeQL exige GHAS pago em repo privado 🔒 |
| SCA / updates | `{...}` | ★ **Renovate + osv-scanner** · Dependabot · Snyk Open Source 🔒 | ★ Renovate agrupa e agenda PRs (menos ruído que o Dependabot); osv-scanner cobre a checagem de vulnerabilidade |
| Secrets | `{...}` | ★ **cofre da própria cloud** (Secrets Manager / Secret Manager / Key Vault) · Doppler / 1Password 🔒 · secrets do CI (só para o CI) | `gitleaks` no hook local **e** no CI, em qualquer opção — não é alternativa, é somatório |
| Scan de imagem/IaC | `{...}` | ★ **Trivy** (cobre imagem e IaC) · Checkov (IaC) + Grype (imagem) | ★ por ser uma ferramenta só para os dois alvos |
| **Branch protection** | Obrigatória em `main`/`master` de todo repo: PR obrigatório, ≥1 aprovação, sem force push, status checks verdes | *(não é opcional — sem menu)* | É a trava servidor-side que os hooks locais do playbook **não** substituem |

## IA / LLM

| Default | Valor | Opções (★ = ponto de partida) | Nota |
|---|---|---|---|
| Provedor/modelos 🔒 | `{...}` | ★ **Anthropic — Fable / Sonnet / Haiku** · outro provedor | ★ é o que o playbook inteiro assume; trocar exige revisar ADR-001/002/003 e a designação de modelo dos 13 agentes |
| Dados em prompt | Dado pessoal real **nunca** | *(decidido — sem menu)* | Ver seção LGPD do [06](06-devsecops.md). Contrato/DPA com provedor 🔒: `{status}` |
| Framework de agentes/RAG | `{...}` | ★ **SDK do provedor, direto** · framework de orquestração (LangGraph, LlamaIndex) | ★ é o "padrão mínimo que atende" do manual do AI-Engineer. Framework entra quando o SDK direto já não dá conta — via ADR do Architect, não por antecipação |

---

## Manutenção

- Dono: **Architect do projeto**, com o Tech Lead como escalada para os campos marcados 🔒.
- Todo campo preenchido a partir de uma decisão de task cita o ADR que o originou, na coluna "Nota".
- A coluna "Opções" é do playbook, não deste projeto: **não a apague ao preencher o Valor**. Ela é o que permite reabrir a decisão depois sabendo o que foi descartado.
- Revisão trimestral (junto com ADR-001) — este arquivo envelhece mais rápido que as práticas de mercado.
