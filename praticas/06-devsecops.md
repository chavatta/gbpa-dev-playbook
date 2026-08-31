# 06 — DevSecOps

> Pergunta que este documento responde: **como embutir segurança no fluxo de desenvolvimento sem transformá-la em gargalo no final?**
>
> Princípio-mãe: **shift-left** — segurança entra no primeiro commit, não na véspera do deploy. Achado de segurança segue a mesma regra do code review: sem severidade, local e correção proposta, é opinião, não achado.
>
> Este documento é o método de trabalho do agente **Security-SRE** (`multi-agents/agents/12-security-sre.md`) e a referência de segurança do DevOps e do Reviewer.
>
> **Dono:** Tech Lead · **Revisão:** trimestral · **Última revisão:** 2026-08-31

---

## O modelo em 4 camadas (onde cada controle vive)

### Camada 1 — Pré-commit (feedback em segundos)
- **Secrets detection** no hook de pré-commit (gitleaks/trufflehog): segredo commitado é incidente, não achado — revogue e rotacione, não basta remover do histórico.
- Lint de segurança básico da linguagem (eslint-plugin-security, bandit, gosec).

### Camada 2 — CI, em todo PR (feedback em minutos)
- **SAST** — análise estática do código próprio (Semgrep como default — CodeQL só é gratuito em repo público; em repo privado exige GitHub Advanced Security pago, e `GOVERNANCE.md §5` manda repo privado).
- **SCA** — dependências: CVEs conhecidas, licenças, pacotes abandonados (Dependabot/Renovate + osv-scanner/Trivy).
- **IaC scanning** — Terraform/K8s/Dockerfile (Checkov ou Trivy config; o tfsec foi descontinuado e absorvido pelo Trivy).
- **Secrets scanning** de novo, no servidor (pega o que passou do hook local).
- Gate: **CRITICAL/HIGH explorável bloqueia o merge**; o resto vira backlog priorizado — não trave o pipeline por LOW teórico (isso gera bypass cultural).

### Camada 3 — CD / build (antes de chegar em prod)
- **Scan da imagem** de container antes do push ao registry.
- **Assinatura e proveniência do artefato** (SLSA: builds reproduzíveis, proveniência atestada; cosign para assinar imagens).
- **SBOM** gerado a cada build (CycloneDX/SPDX) — quando sair a próxima Log4Shell, você responde "onde usamos?" em minutos, não em dias.
- Build once, deploy many: o artefato escaneado é o artefato deployado.

### Camada 4 — Runtime (o que passou, é monitorado)
- **DAST** periódico contra staging (ZAP/Nuclei).
- Postura de cloud (CSPM) e drift de IaC.
- Least privilege: IAM por serviço, network policies, egress controlado.
- Logs de auditoria imutáveis; alertas acionáveis (sem alert fatigue).

---

## Princípios de projeto seguro (o que o código deve respeitar)

1. **Valide toda entrada na borda** — tudo que cruza uma trust boundary (usuário, API externa, fila, arquivo) é hostil até validado. Allowlist > blocklist.
2. **AuthN ≠ AuthZ** — autenticar quem é; autorizar **cada** recurso acessado (IDOR é o caso clássico de A01 — Broken Access Control — do OWASP Top 10: falta de autorização por objeto).
3. **Least privilege em tudo** — tokens com escopo mínimo, IAM por serviço, DB user por aplicação.
4. **Secrets nunca em código, imagem ou log** — secret manager + injeção em runtime + rotação. `.env` no `.gitignore` não é gestão de segredo.
5. **Falhe fechado** — exceção em check de permissão nega acesso, não concede. Erro não vaza stack/internals para o cliente.
6. **Criptografia padrão, nunca caseira** — TLS em trânsito, cifra gerenciada em repouso, bcrypt/argon2 para senha. Não invente crypto.
7. **Dependência é código seu** — você deploya o que ela faz. Pin de versões, lockfile commitado, atualização contínua (Renovate) em PRs pequenos — a pior estratégia é "atualizar tudo um dia".
8. **Defesa em profundidade** — nenhum controle é o único; a trava mecânica existe mesmo com o agente instruído (`GOVERNANCE.md §6` é um exemplo disso).

---

## Threat modeling leve (por feature sensível, não por burocracia)

Para toda feature que toca **auth, dados sensíveis, dinheiro ou superfície externa**, responda as 4 perguntas (Shostack):

1. **No que estamos trabalhando?** — diagrama com trust boundaries (o Architect já entrega isso no design).
2. **O que pode dar errado?** — percorra STRIDE por boundary: Spoofing, Tampering, Repudiation, Information disclosure, DoS, Elevation of privilege.
3. **O que vamos fazer a respeito?** — mitigação por ameaça relevante (ou aceitação de risco explícita, com dono).
4. **Fizemos um bom trabalho?** — o Security-SRE audita contra o modelo no gate.

15–30 minutos por feature sensível. Mais que isso é sinal de escopo grande demais (volta ao Planner).

---

## LGPD — privacidade não é opcional

Todo controle acima protege o sistema; a LGPD (Lei 13.709/2018) protege o **titular do dado**. Para features que tocam dado pessoal, o threat model acima ganha perguntas extras — e a resposta entra no artifact do Security-SRE:

1. **Que dado pessoal a feature coleta/processa?** Classifique: pessoal, pessoal sensível (art. 5º II — saúde, biometria, origem racial, etc.), de criança/adolescente. Dado sensível eleva a task a "sensível" automaticamente (gate do Security-SRE).
2. **Qual a base legal?** (art. 7º) — consentimento, obrigação legal, legítimo interesse, execução de contrato… Se ninguém sabe dizer, a feature não está pronta para design.
3. **Minimização** — colete só o necessário para a finalidade declarada. Campo "para o futuro" é passivo de auditoria, não ativo.
4. **Retenção e eliminação** — todo dado pessoal tem prazo e rotina de expurgo/anonimização definidos no design (o Data-Engineer implementa; o Security-SRE audita).
5. **Direitos do titular** (art. 18) — acesso, correção, eliminação e portabilidade precisam ser tecnicamente possíveis: dado pessoal espalhado sem índice por titular é uma violação em potência.
6. **Compartilhamento com terceiros** — inclui provedores de IA/LLM e ferramentas SaaS: dado pessoal em prompt enviado a provedor externo é transferência de dado, e precisa de base legal e contrato (DPA).
7. **Incidente com dado pessoal** — além do runbook técnico: avaliar risco ao titular e comunicar ANPD e titulares quando aplicável (art. 48). Quem decide é o encarregado (DPO)/Tech Lead, não o dev.

Regra prática para agentes e devs: **dado pessoal real nunca entra em prompt, fixture, log ou ambiente de teste** — use dado sintético ou anonimizado.

---

## Segurança de sistemas com IA (inclui o próprio pipeline de agentes)

Aplicável quando a feature tem subsistema LLM (gate do `ai-engineer`) **e** ao nosso próprio fluxo de desenvolvimento com agentes:

- **Prompt injection é a vulnerabilidade nº 1** ([OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)): todo conteúdo que entra no contexto do modelo (input de usuário, documento recuperado por RAG, página web, artifact) é entrada não-confiável. Instrução vinda de dado ≠ instrução do sistema.
- **Vazamento de dados via prompt** — o que entra no contexto pode sair na resposta. Dado sensível/pessoal em prompt exige a mesma classificação da seção LGPD acima.
- **Saída de LLM é entrada não-confiável** — código gerado passa pelo Reviewer (é o nosso caso), SQL/comando gerado é parametrizado/validado antes de executar, HTML gerado é sanitizado.
- **Dependências alucinadas (slopsquatting)** — agente que sugere um pacote inexistente/typo abre porta para supply chain attack. Toda dependência nova sugerida por IA é verificada (existe? é o pacote certo? é mantida?) antes do install — item de checklist do Reviewer no SCA.
- **Agente com ferramentas é superfície de ataque** — shell, escrita em disco e rede nas mãos de um agente são o equivalente a um serviço com privilégios: least privilege por agente (é o que o frontmatter `tools:` faz), travas mecânicas fora do alcance do agente (`GOVERNANCE.md §6`) e log auditável (`run-log.md`).
- **Excessive agency** — agente não aprova o próprio trabalho, não aceita risco, não toca guardrail. Já é regra do playbook; aqui está o porquê formal.

---

## Divisão de responsabilidade no playbook

| Quem | Camada de segurança |
|------|--------------------|
| **Coder** | Escreve seguro por padrão (validação, secrets fora do código, princípios acima) |
| **Reviewer** | Segurança **do diff** — OWASP Top 10 no código mudado |
| **DevOps** | Implementa os controles de pipeline/infra (camadas 1–4) |
| **Security-SRE** | Visão **sistêmica** — threat model, supply chain, pipeline, runtime; gate de features sensíveis |
| **Tech Lead** | Aceita risco residual explicitamente; ninguém mais aceita risco em nome do projeto |

---

## Checklist mínimo por maturidade

**Nível 1 (todo projeto, semana 1):** secrets scanning (hook + CI), SCA com update automático, lockfile, `.gitignore` correto, branch protection.
**Nível 2 (antes do primeiro deploy):** SAST no CI, scan de imagem/IaC, secret manager, least privilege IAM, threat model das features sensíveis.
**Nível 3 (produção madura):** SBOM por build, assinatura de artefato (SLSA), DAST periódico, CSPM, runbook de incidente testado.

---

## Fontes

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) · [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) · [OWASP DevSecOps Guideline](https://owasp.org/www-project-devsecops-guideline/)
- [SLSA — Supply-chain Levels for Software Artifacts](https://slsa.dev/)
- [NIST SSDF — Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)
- Adam Shostack — *Threat Modeling: Designing for Security* (as 4 perguntas)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) · [ANPD — guias orientativos](https://www.gov.br/anpd/pt-br)
