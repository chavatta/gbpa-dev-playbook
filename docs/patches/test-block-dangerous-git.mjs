#!/usr/bin/env node
// Banco de payloads para block-dangerous-git.mjs.
// Uso: node test-hook.mjs <caminho-do-hook>
import { spawnSync } from "node:child_process";

const HOOK = process.argv[2];

// [descricao, comando, esperado] — BLOCK = deve bloquear, ALLOW = deve passar
const CASES = [
  // ---- devem BLOQUEAR (regressao seria catastrofica) ----
  ["push direto main",            "git push origin main", "BLOCK"],
  ["push -u main",                "git push -u origin main", "BLOCK"],
  ["push refspec HEAD:main",      "git push origin HEAD:main", "BLOCK"],
  ["push refspec branch:main",    "git push origin feat/x:main", "BLOCK"],
  ["push master",                 "git push origin master", "BLOCK"],
  ["force push",                  "git push --force origin foo", "BLOCK"],
  ["force push -f",               "git push -f origin foo", "BLOCK"],
  ["force-with-lease",            "git push --force-with-lease origin foo", "BLOCK"],
  ["refspec forcado +",           "git push origin +foo:bar", "BLOCK"],
  ["rm -rf",                      "rm -rf /tmp/x", "BLOCK"],
  ["rm -fr",                      "rm -fr /tmp/x", "BLOCK"],
  ["rm -rf apos &&",              "cd /tmp && rm -rf x", "BLOCK"],
  ["Remove-Item recursivo",       "Remove-Item -Recurse -Force C:\\x", "BLOCK"],
  ["rmdir /s",                    "rmdir /s C:\\x", "BLOCK"],
  ["reset --hard",                "git reset --hard HEAD~1", "BLOCK"],
  ["clean -f",                    "git clean -f", "BLOCK"],
  ["clean -fd",                   "git clean -fd", "BLOCK"],
  ["clean -f apos &&",            "cd repo && git clean -fd", "BLOCK"],
  ["clean -f apos ;",             "echo oi; git clean -f", "BLOCK"],
  ["psql DROP TABLE",             'psql -c "DROP TABLE users"', "BLOCK"],
  ["mysql TRUNCATE",              'mysql -e "TRUNCATE logs"', "BLOCK"],
  // ---- novos: casos que o hook ANTIGO deixava passar ou quebravam ----
  ["clean -f ofuscado por aspas", 'git clean -"f"', "BLOCK"],
  ["reset --hard em nova linha",  "echo a\ngit reset --hard", "BLOCK"],
  ["clean -f em nova linha",      "echo a\ngit clean -fd", "BLOCK"],
  ["clean -f via bash -c",        'bash -c "git clean -fd"', "BLOCK"],
  ["rm -rf via eval",             'eval "rm -rf /tmp/x"', "BLOCK"],
  ["clean -f com env prefix",     "FOO=1 git clean -fd", "BLOCK"],
  ["clean -f em subshell",        "(git clean -fd)", "BLOCK"],
  ["rm -rf em pipe",              "echo x | rm -rf /tmp/y", "BLOCK"],

  // ---- devem PASSAR (falsos positivos que motivaram o fix) ----
  ["grep do texto clean -f",      'grep "git clean -f" arquivo.md', "ALLOW"],
  ["grep -c com escape",          'grep -c "git clean -f\\` (qualquer variante" DESENVOLVIMENTO-COM-IA.md', "ALLOW"],
  ["rg do texto rm -rf",          'rg "rm -rf" docs/', "ALLOW"],
  ["echo citando reset",          'echo "nunca rode git reset --hard"', "ALLOW"],
  ["grep reset --hard",           'grep -n "git reset --hard" GOVERNANCE.md', "ALLOW"],
  ["grep push main",              'grep "git push origin main" DESENVOLVIMENTO-COM-IA.md', "ALLOW"],
  ["grep Remove-Item",            'grep "Remove-Item -Recurse -Force" docs/x.md', "ALLOW"],
  // ---- devem PASSAR (uso legitimo) ----
  ["push branch normal",          "git push origin feat/conformidade", "ALLOW"],
  ["push main-backup",            "git push origin main-backup", "ALLOW"],
  ["push -u branch normal",       "git push -u origin feat/x", "ALLOW"],
  ["clean dry-run",               "git clean -n", "ALLOW"],
  ["rm arquivo unico",            "rm arquivo.txt", "ALLOW"],
  ["git status",                  "git status --short", "ALLOW"],
  ["reset soft",                  "git reset --soft HEAD~1", "ALLOW"],
  ["psql SELECT",                 'psql -c "SELECT * FROM users"', "ALLOW"],
  ["worktree remove",             "git worktree remove .claude/worktrees/x", "ALLOW"],
];

let pass = 0, fail = 0;
const failures = [];

for (const [desc, command, want] of CASES) {
  const r = spawnSync("node", [HOOK], {
    input: JSON.stringify({ tool_input: { command } }),
    encoding: "utf8",
  });
  const got = r.status === 2 ? "BLOCK" : "ALLOW";
  if (got === want) { pass++; }
  else { fail++; failures.push(`  [${want} esperado, veio ${got}]  ${desc}  ::  ${JSON.stringify(command)}`); }
}

console.log(HOOK);
console.log(`  passou: ${pass}/${CASES.length}   falhou: ${fail}`);
if (failures.length) console.log(failures.join("\n"));
