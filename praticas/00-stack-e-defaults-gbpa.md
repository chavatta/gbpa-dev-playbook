# 00 — Stack e Defaults da GBPA

> Pergunta que este documento responde: **quais são as escolhas-padrão da casa, para que nem agentes nem devs re-decidam o já decidido?**
>
> As práticas 01–09 são critérios de mercado; **este arquivo é o que as ancora na GBPA**. Em conflito entre uma preferência pessoal (ou de agente) e um default daqui, o default vence — desvio se justifica em ADR.
>
> ⚠️ **Status: TEMPLATE — pendente de preenchimento pelo Tech Lead.** Os campos `{...}` abaixo são decisões da casa que não podem ser inventadas por agente. Enquanto não preenchido, agentes tratam cada campo como "perguntar ao Tech Lead", nunca como escolha livre.

---

## Cloud e infraestrutura

| Default | Valor | Nota |
|---|---|---|
| Cloud padrão | `{AWS / GCP / Azure / ...}` | As práticas 04/05 citam serviços de várias clouds como referência; a da casa é esta |
| Região padrão | `{ex.: sa-east-1}` | Considerar residência de dados (LGPD) para dados de clientes |
| Deploy default | `{ex.: ECS+Fargate / Cloud Run / PaaS}` | Conforme escada do [04](04-containerizacao.md)/[05](05-kubernetes-eks.md) |
| Registry de containers | `{ex.: ECR da org}` | Quem mantém base images e política de CVE: `{dono}` |
| IaC | `{ex.: Terraform + versão mínima}` | Estado remoto em: `{onde}` |

## Linguagens e tooling

| Default | Valor | Nota |
|---|---|---|
| Linguagens oficiais | `{ex.: TypeScript (produto), Python (dados/IA)}` | Fora da lista = decisão de Architect + Tech Lead em ADR |
| Runtime/versões mínimas | `{ex.: Node 22 LTS, Python 3.12}` | |
| Formatter + linter | `{ex.: Prettier+ESLint / ruff}` | Config compartilhada em: `{repo/pacote}` — regras de [01-clean-code](01-clean-code.md) que forem automatizáveis vivem aqui, não em prosa |
| Gerenciador de pacotes / monorepo | `{ex.: pnpm workspaces + Turborepo / uv}` | Instrumenta a regra "monorepo nasce com workspaces" do [03](03-monorepo-vs-multirepo.md) |
| Result/erros como valor | `{ex.: neverthrow / próprio}` | Fronteira exceção×Result do [08](08-design-funcional.md): `{critério da casa}` |

## Banco e dados

| Default | Valor | Nota |
|---|---|---|
| Banco padrão | `{ex.: Postgres gerenciado (RDS)}` | Sempre serviço gerenciado — [04](04-containerizacao.md) |
| Ferramenta de migration | `{ex.: dbmate / Flyway / prisma migrate}` | Sempre expand-contract com rollback (manual do Data-Engineer) |
| Vetores | `{ex.: pgvector}` | |

## CI/CD e segurança (instrumenta o [06](06-devsecops.md))

| Default | Valor | Nota |
|---|---|---|
| CI | `{ex.: GitHub Actions}` | |
| SAST | `{ex.: Semgrep}` | CodeQL exige GHAS pago em repo privado |
| SCA / updates | `{ex.: Renovate + osv-scanner}` | |
| Secrets | `{ex.: AWS Secrets Manager}` + gitleaks no hook e no CI | |
| Scan de imagem/IaC | `{ex.: Trivy + Checkov}` | |
| **Branch protection** | Obrigatória em `main`/`master` de todo repo: PR obrigatório, ≥1 aprovação, sem force push, status checks verdes | É a trava servidor-side que os hooks locais do playbook **não** substituem |

## IA / LLM

| Default | Valor | Nota |
|---|---|---|
| Provedor/modelos | `{ex.: Anthropic — Fable/Sonnet/Haiku}` | Modelos por agente: ADR-001/002/003 |
| Dados em prompt | Dado pessoal real **nunca**; ver seção LGPD do [06](06-devsecops.md) | Contrato/DPA com provedor: `{status}` |
| Framework de agentes/RAG | Padrão mínimo que atende (manual do AI-Engineer); framework específico só via ADR do Architect | |

---

## Manutenção

- Dono: **Tech Lead**. Mudança aqui é mudança de governança (mesma lógica de `GOVERNANCE.md §1`).
- Revisão trimestral (junto com ADR-001) — este arquivo envelhece mais rápido que as práticas de mercado.
