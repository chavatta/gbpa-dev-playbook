**Veredito:** REPROVADO (4 achados)

# Security Review: 2026-09-23_fechamento-adr005-e-travas

**Task ID:** 2026-09-23_fechamento-adr005-e-travas
**Status:** completed
**Modelo:** fable (Fable 5.1) — família confere com o agente designado (ADR-002)
**Próximo Agente:** coder (correção do achado HIGH em `docs/patches/block-dangerous-git.mjs`)

---

## Sensibilidade da Entrega
Infra/pipeline do próprio processo: mexe nas travas mecânicas (hooks PreToolUse/Stop, `permissions.deny`), no script que devolve `done` (ADR-005) e na superfície de skill/workflow. Não toca auth, dinheiro nem dado pessoal de cliente (classe Interna, confere com o brief). O ativo em risco é a **confiabilidade das próprias travas** — o modelo de ameaça é o agente semi-confiável executando operação destrutiva ou reescrevendo o gate que o valida.

## Threat Model
| Boundary | Ameaça (STRIDE) | Mitigação | Status |
|----------|-----------------|-----------|--------|
| Bash → git/shell destrutivo | Tampering (rm -rf, push main, clean -f, reset --hard) | `block-dangerous-git.mjs` casa em posição de comando | **achado #1** — bypass por heredoc colado |
| Bash → escrita na zona protegida | Elevation (agente reescreve hook/workflow/agente) | verbo mutante + zona por segmento + exceção `cd` | ok (melhora real vs produção: `cd zona && cp`, `tee workflows` agora bloqueiam) |
| Write/Edit → zona protegida | Elevation | `protect-guardrails.mjs` + `deny` no settings | ok (workflows/ e agents/ cobertos, 22/22) |
| Stop → `done` sem verificação | Repudiation / gate falso | `check-reviewer-gate.mjs` lê veredito na 1ª linha | ok (flag `m` removida fecha o furo do veredito citado; 14/14) |
| Workflow → `done` fail-open | gate declaratório | schema + fail-closed em refutador/lente ausente | ok (13/13, ver auditoria abaixo) |
| Bash → herestring/interpretador não-listado | Tampering | — | **achados #2 e #3** (defesa em profundidade) |

## Achados

### [HIGH] Heredoc com `<<` colado ao interpretador burla toda a análise de corpo — regressão vs produção
**Onde:** `docs/patches/block-dangerous-git.mjs` linha 44 (`isExec`, dentro de `stripHeredocs`)
**Cenário de exploração (reproduzível):** o objetivo declarado do patch era reduzir falso positivo **sem afrouxar bloqueio**. Ele afrouxa. Quando o operador `<<` vem colado ao interpretador, sem espaço, o corpo do heredoc é tratado como **dado** e removido da análise — então qualquer comando destrutivo dentro dele nunca é visto. Todos abaixo são shell válido e todos passam na proposta enquanto a produção bloqueia:

```
bash<<'EOF'        →  rm -rf /tmp/x            ALLOW (proposta)  vs  BLOCK (produção)
sh<<'EOF'          →  git clean -fd            ALLOW             vs  BLOCK
ksh<<'EOF'         →  rm -rf /tmp/x            ALLOW             vs  BLOCK
python3<<'EOF'     →  os.system('git push origin main')  ALLOW  vs  BLOCK
perl<<'EOF' / ruby<<'EOF' / node<<'EOF'        ALLOW             vs  BLOCK
/bin/bash<<'EOF'   →  rm -rf /tmp/x            ALLOW             vs  BLOCK
bash<<-'EOF' (variante com tab)                ALLOW             vs  BLOCK
```

**Causa raiz:** `isExec` divide a linha de abertura em palavras por `[\s;&|(){}\`]+` e testa cada palavra contra `EXECUTOR` (ancorado `^…$`). Sem espaço antes de `<<`, a palavra fica `bash<<EOF`; `w.replace(/^.*\//,"")` só remove o diretório (`/bin/bash<<EOF` → `bash<<EOF`), e o operador `<<EOF` continua grudado, então a regex ancorada não casa. `isExec=false` ⇒ `execHeredoc` não liga o modo conservador e o corpo é jogado fora. O caso `cat<<'EOF'|bash` continua bloqueando só porque o `|` separa `bash` numa palavra própria — a forma direta `interpretador<<DELIM` não tem esse separador.
**Por que a suíte não pegou:** `test-block-dangerous-git.mjs` só exercita heredoc **com espaço** (`bash <<'EOF'`, linhas 100–102). Os 97/97 dão falsa confiança; o banco precisa das variantes coladas como caso de regressão de BLOCK.
**Correção proposta:** ao testar o consumidor, remover o operador de redireção da palavra antes do `EXECUTOR.test`, p.ex. `w.replace(/^.*\//,"").replace(/<<-?.*$/,"")` (ou dividir também por `<`). Depois: adicionar ao banco os casos `bash<<'EOF'`, `sh<<EOF`, `python3<<'EOF'`, `/bin/bash<<'EOF'`, `bash<<-'EOF'` como BLOCK e reprovar a produção neles também.
**Quem corrige:** coder

### [MEDIUM] Herestring `<<<` executa comando destrutivo sem ser analisado — furo não documentado
**Onde:** `docs/patches/block-dangerous-git.mjs` linha 33 (`<<(?!<)` exclui `<<<`) e a análise por posição de comando
**Cenário:** `bash <<< 'rm -rf /tmp/x'` e `bash<<<'git clean -fd'` passam tanto na proposta quanto na produção. O corpo do herestring fica coldado ao `bash<<<` (sem separador), então `rm`/`git` não estão em posição de comando e o ancoramento não casa. Não é regressão desta entrega (a produção também deixa passar), mas o patch reescreveu toda a lógica de "quem consome o corpo do heredoc" e não cobriu o herestring, e o `README.md` de patches lista limites conhecidos **sem** este. Um agente que aprendeu que `bash<<<` escapa tem um canal estável.
**Correção proposta:** ou tratar `<<<` como wrapper (ligar modo conservador quando a linha tem `interpretador <<<`), ou registrar explicitamente em "Limites conhecidos" do `docs/patches/README.md` com a razão de não corrigir. Preferível a primeira.
**Quem corrige:** coder

### [LOW] Escrita na zona protegida por interpretador fora da lista `MUTANTES`
**Onde:** `docs/patches/block-dangerous-git.mjs` linha 162 (`MUTANTES`)
**Cenário:** `node -e "require('fs').writeFileSync('.claude/hooks/x.mjs','')"` escreve num hook e passa (proposta e produção): `node`/`node -e` não está em `MUTANTES` e não há redireção. Igual à produção, logo não é regressão, mas a zona `.claude/workflows/`/`.claude/agents/` que o ADR-005 acabou de proteger herda o mesmo ponto cego, e o `README.md` não o lista. `python3 -c` está coberto; `node -e`, `deno`, `bun`, `tee` já cobertos — falta o `node -e`/`perl -e`/`ruby -e` escrevendo direto.
**Correção proposta:** documentar em "Limites conhecidos" (a trava primária declarada é a branch protection no servidor + o diff do PR), ou estender `MUTANTES`/o modo conservador aos `-e`/`-c` de interpretador. Não bloqueante — a defesa real é o `deny` de Write/Edit + branch protection.
**Quem corrige:** coder

### [LOW] `settings.proposto.json`: `Read(./.env)` / `Read(./.env.*)` — sintaxe de glob a confirmar
**Onde:** `docs/patches/settings.proposto.json` linhas 26–29
**Cenário:** as quatro entradas cobrem o alvo de fato pelos padrões `Read(**/.env)` e `Read(**/.env.*)` — em semântica gitignore, `**/` casa também na raiz, então `.env` e `.env.local` na raiz e em subpasta ficam negados. As duas entradas com prefixo `./` (`Read(./.env)`, `Read(./.env.*)`) são redundantes e o prefixo `./` pode não ser interpretado como esperado pelo matcher de permissões do Claude Code (a sintaxe canônica não usa `./`). Não há risco de afrouxamento (os padrões `**/` cobrem), mas vale confirmar antes de aplicar para não dar falsa sensação de cobertura extra. Observação já correta no `README.md`/`ISO-MAPPING`: negar `Read` **não** impede `cat .env` via Bash — a proteção real é o segredo não estar no disco + gitleaks no CI. Mantenha essa ressalva.
**Correção proposta:** validar a forma `Read(./.env)` contra a doc do Claude Code; se o `./` não for suportado, remover as duas linhas redundantes e ficar só com `Read(.env)`/`Read(.env.*)`/`Read(**/.env)`/`Read(**/.env.*)`.
**Quem corrige:** devops (Tech Lead na aplicação)

## Auditoria por Camada

- **Superfície de comando (block-dangerous-git):** achado #1 (HIGH, bloqueante) + #2 (MEDIUM). As melhorias reais foram confirmadas por execução: `cd .claude/hooks && cp …`, `cd .claude && cp … settings.json`, `git -C repo push --force`, `tee .claude/workflows/…` e `echo x > .claude/agents/…` agora bloqueiam (produção deixava passar). Os falsos positivos alvo (heredoc/aspas multi-linha/`;` entre push e `--base main`/`ln=5`) foram fechados. O ancoramento por posição de comando e a exclusão de token por separador estão corretos. O problema é só a detecção do consumidor do heredoc.
- **Gate de encerramento (check-reviewer-gate):** ok. Remover a flag `m` fecha o furo do artifact que abre REPROVADO mas cita um veredito positivo mais abaixo (produção 11/14 → proposta 14/14, confirmado). O `^﻿?\s*` admite BOM e linha em branco mas não pula texto (`# Review` numa linha antes ⇒ BLOCK, verificado). Correto e mais estrito.
- **Proteção de escrita (protect-guardrails + settings):** ok. `.claude/workflows/` e `.claude/agents/` cobertos em relativo, absoluto e Windows (22/22); `deny` do settings espelha nas duas ferramentas Write/Edit. `.claude/skills/` fica gravável de propósito (Documenter autora skill de projeto) — aceitável **porque** o gate mecânico não depende de skill: `SKILL.md` tem `disable-model-invocation: true`, o roteamento/`done` vive no workflow protegido e o Stop hook independe do texto da skill. Registro como postura, não achado: skill é contexto de instrução gravável por agente; a âncora de confiança são os hooks, não o texto da skill.
- **Fluxo `gbpa-task.js` (fail-open?):** ok, fail-closed em todos os caminhos alterados (smoke 13/13). Refutador cego sem retorno ⇒ `blocked` (não `done`); lente ausente ⇒ nunca unânime + issue HIGH para o Coder; `agent()` que lança é capturado como `null` e conta como reprovação; retorno único não-aprovado ⇒ `{aprovado:false}`. Sobre a divergência schema × artifact: o script decide `done` pelo campo `aprovado` do schema, e o Stop hook exige `**Veredito:**` positivo na 1ª linha de `reviewer.md` (e `security-sre.md` em task sensível). Se o schema disser aprovado mas o artifact não tiver o veredito na forma exata, o Stop hook **bloqueia o encerramento** — divergência é fail-closed, não fail-open. Ressalva informativa: o Stop hook não verifica `tester-review.md` nem `reviewer-cego.md`; a garantia dessas lentes vem só do gate por código do script. Não é bypass (o script já exige o `aprovado` delas), mas se alguém marcar `done` no run-log à mão fora do script, o refutador cego não é reexigido mecanicamente. Igual à produção; fora do escopo desta entrega.
- **check-pii.sh:** ok. Delimitação por `(^|[^0-9])…([^0-9]|$)` para de casar timestamp de 13 dígitos e segue casando celular cru/formatado e CPF/CNPJ formatados. `find … -exec grep … {} +` não passa nome de arquivo por shell (sem injeção por nome); `set -u`, saída 0/1 corretas; `$achados` só ecoado. Resíduo não-segurança: um numérico de 11 dígitos com `9` na 3ª posição (ex.: epoch atípico) pode gerar falso positivo — aceitável, o guia manda ajustar o padrão, não desligar.
- **ADR-005 / OAuth:** a restrição está descrita corretamente — login OAuth reservado ao uso ordinário do Claude Code/apps nativos e automação via Agent SDK exigindo API key; orquestrar por fora (harness externo reenviando o token da assinatura) cai na zona vedada. A escolha do workflow nativo é coerente com essa restrição.
- **Secrets:** nenhum secret no diff; a entrega **adiciona** deny de `.env*`. Nada a rotacionar.
- **Supply chain:** sem dependência nova; scripts usam só `node:*` builtin. ok.
- **Prontidão SRE:** não aplicável (mudança de processo/travas, sem serviço em runtime). As suítes de regressão (`test-*.mjs`) são o runbook de verificação e estão presentes.

## Riscos Aceitos
Nenhum risco aceito por mim. O achado #1 (HIGH) **não** é aceitável como está: é regressão de uma trava mecânica e o risco residual dela, se o Tech Lead quiser aceitar em vez de corrigir, tem de ser registrado com nome e data — mas a correção é barata (uma linha de regex + casos no banco), então o caminho é corrigir.

## Contexto para o Próximo Agente
Prioridade 1, bloqueante: corrigir `isExec` em `docs/patches/block-dangerous-git.mjs` (achado #1) e adicionar ao `test-block-dangerous-git.mjs` os casos `interpretador<<DELIM` colados como BLOCK, provando que a produção também falha neles (o critério de aceitação do brief — "produção falha exatamente nos casos novos" — exige esse par). Rodar a suíte contra proposta (100%) e produção. Reencaminhar para re-auditoria depois. Os patches **não** devem ser aplicados em `.claude/hooks/` enquanto o #1 estiver aberto — aplicar hoje trocaria uma trava que bloqueia `bash<<EOF … rm -rf` por uma que o deixa passar. Achados #2–#4 podem ir a backlog com dono (coder/devops) se o Tech Lead preferir, mas #2 e #3 pedem ao menos uma linha em "Limites conhecidos" do `docs/patches/README.md` antes da aplicação.
