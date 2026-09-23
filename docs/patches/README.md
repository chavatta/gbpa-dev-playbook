# Patches em arquivos protegidos

> **Dono:** Tech Lead · **Revisão:** esvaziar conforme aplicado — patch pendente é dívida, não acervo · **Última revisão:** 2026-09-23

Arquivos que agentes não podem escrever (`GOVERNANCE.md` §6.2) chegam aqui prontos e testados, para o **Tech Lead aplicar à mão, no próprio terminal, fora da sessão do agente** — de dentro do Claude Code a própria trava bloqueia a cópia, e é para bloquear. O racional de cada patch fica em [`../PENDENCIAS-TECH-LEAD.md`](../PENDENCIAS-TECH-LEAD.md).

## Pendente — lote de 2026-09-23

| Arquivo proposto | Destino | O que muda | Prova |
|---|---|---|---|
| `block-dangerous-git.mjs` | `.claude/hooks/` | Fecha os falsos positivos reportados em 2026-09-15 (`PENDENCIAS-TECH-LEAD.md`, item 2) (token de argumento atravessava `;`/`&&`; corpo de heredoc e texto multi-linha entre aspas lidos como comando; verbo e caminho protegido casados em comandos diferentes; `ln=5` lido como `ln`). Fecha onze bypasses que a suíte nova achou no hook em produção: `git -C repo push --force`; entrar na zona com `cd` e copiar; herestring para interpretador (`bash <<< '…'`); `rsync`; caminho com `/./` ou `//`; e o próprio git reescrevendo a zona (`git checkout <ref> -- .claude/settings.json`, `git restore`, `git rm`). Estende a zona protegida a `.claude/workflows/` e `.claude/agents/` | `test-block-dangerous-git.mjs` — proposta 138/138; produção 107/138. Dos 78 casos novos, a produção falha em 31 (15 falsos positivos, 11 bypasses, 5 da zona nova); os outros 47 ela já acertava e ficam como guarda de regressão — entre eles os que as duas primeiras versões desta proposta deixavam passar e os gates pegaram (`bash<<'EOF'` colado; `python3 -c "open('.claude/hooks/x','w')"`, `cp $(ls x) .claude/hooks/y` e afins, em que parêntese e `$(` separavam verbo de caminho; script gravado por heredoc e executado depois; heredoc para `psql`/`mysql` com `DROP TABLE`, em que o corpo — SQL executado — era descartado) |
| `check-reviewer-gate.mjs` | `.claude/hooks/` | O veredito passa a ser lido **na primeira linha** de fato: a flag `m` da regex deixava passar um artifact `REPROVADO` que citasse um `**Veredito:** APROVADO` mais abaixo | `test-check-reviewer-gate.mjs` — proposta 14/14; produção 11/14 |
| `protect-guardrails.mjs` | `.claude/hooks/` | Bloqueia Write/Edit em `.claude/workflows/` (o script que devolve `done`, ADR-005) e `.claude/agents/` (tools e modelo de cada agente). `.claude/skills/` segue livre: o Documenter autora skill de projeto ali | `test-protect-guardrails.mjs` — proposta 22/22; produção 16/22 |
| `settings.proposto.json` | `.claude/settings.json` | `deny` de Write/Edit nas duas pastas novas e de `Read` em `.env` / `.env.*` — a evidência que o `ISO-MAPPING` (A.8.12) cita | Diff de 8 linhas acrescentadas, nenhuma removida |
| `GOVERNANCE.proposto.md` | `GOVERNANCE.md` | Cabeçalho de dono/revisão; §2.6 com a transição de mantenedor único; §3.1/§3.4 com o fluxo por script (ADR-005); §5.4 com a lista única de cópia; §6.2 com a zona protegida nova e a regra de mudança do script; §6.4 com Dynamic workflows | `git diff --no-index` — 7 trechos, todos listados aqui |

O smoke test do fluxo, [`scripts/test-gbpa-task.mjs`](../../scripts/test-gbpa-task.mjs), não é patch — o script ainda não está na zona protegida —, mas passa a ser a prova exigida para qualquer mudança futura em `.claude/workflows/`.

### Aplicar

**1. Rodar as suítes** — cada uma contra a versão em produção e contra a proposta. Aplicar só se a proposta fechar 100%: caso de bloqueio falhando significa que o patch afrouxou uma trava.

```bash
node docs/patches/test-block-dangerous-git.mjs .claude/hooks/block-dangerous-git.mjs
node docs/patches/test-block-dangerous-git.mjs docs/patches/block-dangerous-git.mjs
node docs/patches/test-check-reviewer-gate.mjs .claude/hooks/check-reviewer-gate.mjs
node docs/patches/test-check-reviewer-gate.mjs docs/patches/check-reviewer-gate.mjs
node docs/patches/test-protect-guardrails.mjs .claude/hooks/protect-guardrails.mjs
node docs/patches/test-protect-guardrails.mjs docs/patches/protect-guardrails.mjs
node scripts/test-gbpa-task.mjs
```

**2. Ler os diffs de texto** — são lei, não código, e ninguém além do Tech Lead os revisa na forma final:

```bash
git diff --no-index GOVERNANCE.md docs/patches/GOVERNANCE.proposto.md
git diff --no-index .claude/settings.json docs/patches/settings.proposto.json
```

**3. Copiar** — numa branch, fora do Claude Code:

```bash
cp docs/patches/block-dangerous-git.mjs docs/patches/check-reviewer-gate.mjs docs/patches/protect-guardrails.mjs .claude/hooks/
cp docs/patches/settings.proposto.json .claude/settings.json
cp docs/patches/GOVERNANCE.proposto.md GOVERNANCE.md
```

**4. Fechar o ciclo:** rodar a suíte de novo contra `.claude/hooks/` (tem de dar 100%), apagar daqui os três `.mjs` propostos e os dois `.proposto.*` — as suítes `test-*.mjs` ficam: são o teste de regressão das travas —, registrar a linha no histórico do `PENDENCIAS-TECH-LEAD.md` e **reiniciar as sessões do Claude Code**: hooks e `settings.json` carregam no startup.

**Opcional:** para `/task` não pedir aprovação a cada execução em sessão não-interativa, acrescente `Workflow(gbpa-task)` em `permissions.allow` do `settings.json`. Em sessão interativa não é necessário.

## Limites conhecidos das travas (não corrigidos, de propósito)

- **Variável de shell esconde o caminho:** `H=.claude/hooks; cp x $H/y` passa. Casar variável exigiria interpretar shell; a trava primária é a branch protection no servidor, e o PR mostra a mudança.
- **`Read` negado não impede `cat .env`** pela ferramenta de shell. O deny cobre a ferramenta de leitura; o que protege o segredo de fato é ele não estar no disco do dev (`praticas/06`) e o `gitleaks` no CI.
- **Escrita na zona protegida por `node -e` / `perl -e` / `ruby -e`** passa (só `python3 -c` está na lista de verbos, como em produção). Incluir os três bloquearia também a *leitura* por essas vias — `node -e` lendo o `settings.json` é uso comum —, e o `protect-guardrails` e o `deny` já cobrem as ferramentas de edição.
- **Heredoc cujo corpo pode ser executado liga o modo conservador:** se o comando, fora dos corpos, tiver um interpretador, uma CLI de banco (`psql`, `mysql`, `sqlite3`…), `eval`/`xargs`/`source` ou um caminho `./…` (`python3 - <<EOF`, `psql <<EOF`, `cat <<EOF | bash`, `cat > s.sh <<EOF … ; sh s.sh`), o corpo é analisado em qualquer posição — e um script que só *mencione* `git push origin main` num comentário é bloqueado. Para gravar documentação, use a ferramenta de escrita ou `cat > arquivo.md <<EOF` num comando que não execute nada.
- **Caminho escondido por escape ou montagem:** `cp x .cla\ude/hooks/y`, verbo vindo de crase (`` `echo cp` x .claude/hooks/y ``) e `git apply` de um patch que só *dentro* toca a zona passam — mesma classe da variável de shell acima.
- **Copiar *da* zona para fora também bloqueia** (`cp .claude/hooks/x.mjs /tmp/`): o verbo e o caminho estão no mesmo comando e a trava não distingue origem de destino. Para ler, use `cat` ou a ferramenta de leitura.
- **Vários heredocs na mesma linha** têm os corpos lidos em sequência, como o shell faz; heredoc aninhado dentro de `$(…)` noutra linha é tratado como texto comum (conservador).

## Manutenção

As suítes são o teste de regressão das travas — toda mudança futura acrescenta o caso novo ao banco e roda tudo contra a versão antiga e a nova antes de aplicar. Caso que deve bloquear e caso que deve passar têm o mesmo peso: guardrail que gera falso positivo é contornado, e guardrail contornado não protege nada.

## Histórico

| Data | Patch | Suíte |
|---|---|---|
| 2026-08-04 | `check-reviewer-gate.mjs`, `block-dangerous-git.mjs`, `settings.json`, `GOVERNANCE.md` | 26 casos |
| 2026-08-31 | `block-dangerous-git.mjs` — casamento por posição de comando, ofuscação por aspas, wrappers, escrita em zona protegida via shell; `GOVERNANCE.md` §7 | 60 casos (38/45 na versão anterior) |
