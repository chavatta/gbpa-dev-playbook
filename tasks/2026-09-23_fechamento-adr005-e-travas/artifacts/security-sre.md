**Veredito:** REPROVADO (1 achado)

# Security Review (rodada 3, escopo restrito): 2026-09-23_fechamento-adr005-e-travas

**Task ID:** 2026-09-23_fechamento-adr005-e-travas
**Status:** completed
**Modelo:** fable (Fable 5.1) — família confere com o agente designado (ADR-002)
**HEAD auditado:** 5e07166 (inclui b1d2059)
**Próximo Agente:** coder (correção de 1 achado HIGH residual, poucos tokens em `executa()`) — ou Tech Lead, se preferir aceitar como limite registrado (HANDOFF §4.7: 3ª rodada)

---

## Sensibilidade da Entrega
Infra/pipeline do próprio processo (travas mecânicas + script que devolve `done`). Classe Interna, confere com o brief. Escopo desta rodada: só o que mudou em `1660a9a..5e07166` (`EXECUTOR` com CLIs de banco, `SCRIPT` reduzido a `./`, regra de "alvo de redirect reaparece" em `executa()`) e a pergunta explícita: a redução do `SCRIPT` abre bypass de "heredoc grava e executa" que a produção bloqueava?

## Histórico das rodadas

| Rodada | Veredito | Achado bloqueante | Estado |
|--------|----------|-------------------|--------|
| 1 | REPROVADO (4) | HIGH: `interpretador<<EOF` colado descartava o corpo do heredoc | fechado na r2 (`executa` separa em `<`/`>`) |
| 2 | REPROVADO (1) | HIGH: heredoc para `psql`/`mysql` descartava o SQL e cegava a trava de DDL | fechado na r3 (CLIs de banco no `EXECUTOR`) |
| 3 | REPROVADO (1) | HIGH: heredoc gravado por `tee`/`dd of=` e executado por caminho ainda descarta o corpo | **aberto** — abaixo |

## Re-verificação dos achados anteriores (execução diferencial, `scratchpad/probe4.mjs`)

| Item | Resultado no HEAD |
|------|-------------------|
| r2 HIGH — `psql dbname <<'EOF' … DROP TABLE`, `psql<<'EOF'` colado, `mysql db <<'EOF' … DROP DATABASE` | **BLOCK** (produção também). Fechado. |
| `psql <<'EOF' … SELECT` (não pode ser FP) | ALLOW. Correto. |
| Redução do `SCRIPT` — heredoc `>` para script, depois executado por `/tmp/s.sh`, `/tmp/s` (sem extensão), `$PWD/s.sh`, `~/s.sh`, `tmp/s.sh`, `exec /tmp/s.sh`, `env …`, `nohup …`, `bash -c …`, `sh s.sh`, `. s.sh`, `source s.sh`, `./s.sh` | **BLOCK** em todos (produção também). A regra nova do `executa()` — alvo de `>`/`>>` que reaparece por basename ≥2× — cobre o que a redução do `SCRIPT` teria aberto. |
| Doc gravado por heredoc em caminho absoluto sem execução (`cat > /tmp/notes.md <<EOF … ; echo ok`) | ALLOW. Sem FP novo. |
| Observação r2 (barra invertida esconde caminho) | Entrou em "Limites conhecidos" do `docs/patches/README.md`, junto com verbo vindo de crase e `git apply`. Aceito. |

## Achados

### [HIGH] Heredoc gravado por `tee`/`dd of=` e executado por caminho ainda descarta o corpo — residual da mesma classe, regressão vs produção
**Onde:** `docs/patches/block-dangerous-git.mjs`, função `executa()` (linhas 35–44): a extração de `alvos` usa só `/>{1,2}\s*([^\s;&|<>()`]+)/g`, isto é, **só alvo de redirect `>`/`>>`**.
**Cenário (reproduzível, `scratchpad/probe5.mjs`):**

```
cat <<'EOF' | tee /tmp/s   … corpo …  EOF ; chmod +x /tmp/s; /tmp/s      ALLOW (proposta)  vs  BLOCK (produção)
dd of=/tmp/s <<'EOF'       … corpo …  EOF ; chmod +x /tmp/s; /tmp/s      ALLOW             vs  BLOCK
cat <<'EOF' | tee s        … corpo …  EOF ; chmod +x s; ./s              BLOCK (controle — `./` casa SCRIPT)
```

O corpo é gravado por `tee` (ou `dd of=`) em vez de `>`, então `alvos` fica vazio; o arquivo é depois executado por caminho absoluto, que não é `./` nem interpretador; `executa(fora)` devolve `false`, o corpo é descartado e o `rm -rf` dentro dele nunca é analisado. A produção, que varre o comando inteiro, bloqueia. É exatamente o padrão "grava e executa" que a regra nova pretendia fechar — ela fechou a via `>` e deixou as vias `tee`/`dd` abertas.
**Correção proposta (poucos tokens, sem nova classe de FP):** estender a extração de `alvos` para incluir os verbos que gravam stdin em arquivo: `tee [-a] ARQ`, `dd of=ARQ`, `install … ARQ`, `cp /dev/stdin ARQ` — p.ex. um segundo `matchAll` sobre `/(?:tee(?:\s+-a)?|dd\s+of=|cp\s+\/dev\/stdin)\s*([^\s;&|<>()`]+)/g` somado ao de `>`. A regra "basename reaparece ≥2×" já existe, então isto não cria FP além do que o `>` já tem (`cat > x.md … ; cat x.md` já é conservador hoje). Adicionar os dois casos acima como BLOCK ao `test-block-dangerous-git.mjs`, com o par produção-também-bloqueia.
**Quem corrige:** coder

## Auditoria por Camada (só o que mudou)
- **`EXECUTOR` com CLIs de banco:** correto. As dez CLIs listadas executam stdin; incluir todas (não só `psql|mysql`) é conservador e coerente com a checagem de DDL da linha 151, que continua estreita (`psql|mysql`) — o corpo fica visível para ela.
- **`SCRIPT = /^\.\//`:** a redução em si **não** abre bypass no HEAD — a regra de "alvo de redirect reaparece" compensa para `>`/`>>`. Quem roda o script aparece como interpretador, `./` ou reaparição do alvo. O residual (`tee`/`dd`) é da regra compensatória, não da redução.
- **Regra "alvo de redirect reaparece (basename ≥2×)":** correta no que cobre; a comparação por basename é conservadora (um `mv /tmp/s /tmp/t; /tmp/t` ainda faz `s` reaparecer no `mv` e liga o modo conservador). Sem FP novo detectado: doc gravado e não relido segue ALLOW.
- **Suíte:** proposta 138/138 · produção 107/138 (confirmado). Os 3 casos novos de "grava e executa" (`/tmp/s`, `$PWD/s`, `exec`) e os 6 de `psql`/`mysql` estão no banco com o par certo.
- **Workflow / demais hooks / check-pii / ADR-005 / secrets / supply chain:** fora do escopo desta rodada; inalterados desde a r2 (smoke 15/15 reconfirmado por reexecução).

## Riscos Aceitos
Nenhum aceito por mim. O achado é regressão vs produção na mesma classe das rodadas anteriores, mas o alcance residual é estreito (write via `tee`/`dd` + `chmod +x` + execução por caminho, tudo num único comando) e a correção é mínima. Sendo a 3ª rodada (HANDOFF §4.7), se o Tech Lead preferir aplicar o lote com este item como **limite conhecido** em vez de corrigir, isso é decisão dele: registrar nome e data aqui e no `docs/patches/README.md`. Minha recomendação é corrigir — são poucos tokens e o par de testes fecha a classe inteira.

## Contexto para o Próximo Agente
Prioridade única: estender `alvos` em `executa()` para `tee`/`dd of=`/`install`/`cp /dev/stdin` e adicionar os dois casos ao banco como BLOCK. Rodar `node docs/patches/test-block-dangerous-git.mjs` contra proposta (100%) e produção. Tudo o mais desta entrega já foi auditado e está fechado; com esse item resolvido não vejo mais nada que impeça a aplicação dos patches pelo Tech Lead.
