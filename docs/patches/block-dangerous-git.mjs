#!/usr/bin/env node
// PreToolUse/Bash — bloqueia comandos git/shell destrutivos, inclusive sintaxes
// que burlam o deny por prefixo (ex.: git push -u origin main, git push origin branch:main).
// Multiplataforma (macOS/Linux/Windows).
// exit 2 = bloqueia a ação e devolve o stderr ao agente.

import { readFileSync } from "node:fs";

let cmd = "";
try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  cmd = input?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}

// Quebra de linha vira separador de comando explícito ANTES de colapsar espaço:
// senão `echo a\ngit clean -f` viraria uma linha só e o comando perigoso deixaria
// de estar em posição de comando.
const norm = String(cmd).replace(/[\r\n]+/g, " ; ").replace(/\s+/g, " ");

// Remove só os CARACTERES de aspas, preservando o conteúdo, para que ofuscação
// por citação (`git clean -"f"`) continue casando. O texto citado deixa de ser
// perigoso pelo ancoramento em posição de comando (abaixo), não por ser apagado.
const flat = norm.replace(/['"]/g, "");

// Um comando perigoso só conta quando está em POSIÇÃO DE COMANDO: início da
// entrada ou logo após um separador de shell, admitindo prefixo de variável de
// ambiente (FOO=1 rm -rf ...). É isto que impede o falso positivo de
// `grep "git clean -f" arquivo.md`, onde o padrão é argumento de busca, não comando.
const CMD = "(?:^|[;&|(){}`]|\\$\\()\\s*(?:\\w+=\\S* +)*";

// Wrappers que executam string como código: aí o conteúdo citado É comando, e o
// ancoramento não vale — voltamos a casar em qualquer posição (mais conservador).
const WRAPPER = /(?:^|[;&|(){}`]|\$\()\s*(?:\w+=\S* +)*(?:eval|xargs|(?:ba|z|k|da)?sh +-c|command +-[pv]* *\w*sh)\b/.test(flat);

const hit = (body) => {
  if (WRAPPER) return new RegExp(body).test(flat);
  return new RegExp(CMD + body).test(flat);
};

const block = (msg) => {
  process.stderr.write(msg + "\n");
  process.exit(2);
};

// push para main/master, em qualquer forma: aceita N flags/tokens entre `push` e o
// refspec (-u, --no-verify, etc.) e qualquer origem no refspec (branch:main, HEAD:main,
// refs completas). Guarda de fim de palavra evita falso positivo em main-backup etc.
if (hit("git( +[^ ]+)* +push( +[^ ]+)* +([^ :]+:)?(refs\\/heads\\/)?(main|master)([^-a-zA-Z0-9_/]|$)")) {
  block("BLOQUEADO: push direto em main/master. Fluxo correto: branch + draft PR (GOVERNANCE.md §2).");
}

// force push em qualquer ordem de flags, incluindo refspec com +
if (hit("git +push( +[^ ]+)* +(--force|--force-with-lease|-f)([^-a-zA-Z]|$)")) {
  block("BLOQUEADO: force push. Se for realmente necessário, é decisão do Tech Lead, não do agente.");
}
if (hit("git +push +[^ ]+ +\\+[^ ]+")) {
  block("BLOQUEADO: push com refspec forçado (+). Equivale a force push (GOVERNANCE.md §2).");
}

// rm -rf / -fr em qualquer combinação de flags (e o equivalente Windows)
if (hit("rm +(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[a-zA-Z]* ")) {
  block("BLOQUEADO: rm -rf. Delete arquivos individualmente e explique o motivo no artifact.");
}
if (WRAPPER
  ? /(rmdir +\/s|rd +\/s|Remove-Item +.*-Recurse.*-Force|Remove-Item +.*-Force.*-Recurse)/i.test(flat)
  : new RegExp(CMD + "(rmdir +\\/s|rd +\\/s|Remove-Item +.*-Recurse.*-Force|Remove-Item +.*-Force.*-Recurse)", "i").test(flat)) {
  block("BLOQUEADO: remoção recursiva forçada (equivalente Windows de rm -rf). Delete arquivos individualmente e explique o motivo no artifact.");
}

// destruição de histórico/working tree
if (hit("git +reset +--hard")) {
  block("BLOQUEADO: git reset --hard descarta trabalho. Use stash ou branch (GOVERNANCE.md §2).");
}
if (hit("git +clean +-[a-zA-Z]*f")) {
  block("BLOQUEADO: git clean com -f apaga arquivos não rastreados. Revise manualmente o que remover.");
}

// DDL destrutivo direto via CLI de banco (regra inviolável do Data-Engineer,
// até então sem trava mecânica). Escopo estreito para evitar falso positivo.
if (hit("(psql|mysql)\\b") && /(DROP +(TABLE|DATABASE|SCHEMA)|TRUNCATE +)/i.test(flat)) {
  block("BLOQUEADO: DDL destrutivo (DROP/TRUNCATE) via CLI de banco. Operação destrutiva exige aprovação do Tech Lead (manual do Data-Engineer; GOVERNANCE.md §6).");
}

process.exit(0);
